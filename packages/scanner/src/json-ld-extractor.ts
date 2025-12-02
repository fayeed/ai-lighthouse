import type { CheerioAPI } from 'cheerio';

export interface ParsedSchema {
  type: string | string[];
  data: any;
  raw: any;
}

export interface JsonLdExtractionResult {
  schemas: ParsedSchema[];
  types: Set<string>;
  hasMainEntity: boolean;
  hasSameAs: boolean;
  hasBreadcrumbs: boolean;
  hasFAQ: boolean;
  errors: Array<{ index: number; error: string }>;
}

/**
 * Extracts and parses JSON-LD structured data from a page
 * Supports:
 * - List-based JSON-LD (arrays of objects)
 * - Multiple script blocks
 * - @graph structures
 * - Incomplete/partial objects
 * - Schema.org type standardization
 */
export class JsonLdExtractor {
  private schemas: ParsedSchema[] = [];
  private types: Set<string> = new Set();
  private errors: Array<{ index: number; error: string }> = [];

  constructor(private $: CheerioAPI) {}

  /**
   * Extract and parse all JSON-LD blocks from the page
   */
  extract(): JsonLdExtractionResult {
    this.schemas = [];
    this.types = new Set();
    this.errors = [];

    const jsonLdScripts = this.$('script[type="application/ld+json"]');

    jsonLdScripts.each((index, el) => {
      try {
        const content = this.$(el).html();
        if (!content || content.trim().length === 0) {
          return; // Skip empty scripts
        }

        const parsed = JSON.parse(content);
        this.processJsonLd(parsed, index);
      } catch (e) {
        this.errors.push({
          index,
          error: e instanceof Error ? e.message : 'Invalid JSON'
        });
      }
    });

    return {
      schemas: this.schemas,
      types: this.types,
      hasMainEntity: this.hasMainEntity(),
      hasSameAs: this.hasSameAs(),
      hasBreadcrumbs: this.hasBreadcrumbs(),
      hasFAQ: this.hasFAQ(),
      errors: this.errors
    };
  }

  /**
   * Process JSON-LD data (handles arrays, @graph, and single objects)
   */
  private processJsonLd(data: any, scriptIndex: number): void {
    if (!data) return;

    // Handle array of objects
    if (Array.isArray(data)) {
      data.forEach(item => this.processJsonLdItem(item, scriptIndex));
      return;
    }

    // Handle @graph structure
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      data['@graph'].forEach((item: any) => this.processJsonLdItem(item, scriptIndex));
      return;
    }

    // Handle single object
    this.processJsonLdItem(data, scriptIndex);
  }

  /**
   * Process a single JSON-LD item
   */
  private processJsonLdItem(item: any, scriptIndex: number): void {
    if (!item || typeof item !== 'object') return;

    const type = this.extractType(item);
    
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      types.forEach(t => this.types.add(this.normalizeType(t)));

      this.schemas.push({
        type,
        data: item,
        raw: item
      });
    }

    // Recursively process nested objects that might have @type
    Object.values(item).forEach(value => {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (v && typeof v === 'object' && (v as any)['@type']) {
              this.processJsonLdItem(v, scriptIndex);
            }
          });
        } else if ((value as any)['@type']) {
          this.processJsonLdItem(value, scriptIndex);
        }
      }
    });
  }

  /**
   * Extract @type from an item (handles string, array, or missing)
   */
  private extractType(item: any): string | string[] | null {
    if (!item['@type']) return null;

    const type = item['@type'];
    
    if (typeof type === 'string') {
      return type;
    }
    
    if (Array.isArray(type)) {
      return type.filter(t => typeof t === 'string');
    }

    return null;
  }

  /**
   * Normalize Schema.org type (remove URL prefix if present)
   */
  private normalizeType(type: string): string {
    // Handle full URLs like "https://schema.org/Article"
    if (type.includes('schema.org/')) {
      return type.split('schema.org/').pop() || type;
    }
    
    // Handle namespaced types like "schema:Article"
    if (type.includes(':')) {
      return type.split(':').pop() || type;
    }

    return type;
  }

  /**
   * Check if there's a main entity type
   */
  private hasMainEntity(): boolean {
    const mainEntityTypes = [
      'Organization',
      'Person',
      'Article',
      'NewsArticle',
      'BlogPosting',
      'WebPage',
      'WebSite',
      'Product',
      'Event',
      'LocalBusiness',
      'Corporation'
    ];

    return Array.from(this.types).some(type =>
      mainEntityTypes.includes(type)
    );
  }

  /**
   * Check if any schema has sameAs property
   */
  private hasSameAs(): boolean {
    return this.schemas.some(schema => {
      const data = schema.data;
      return data && (
        data.sameAs !== undefined ||
        data.sameAs !== null ||
        (Array.isArray(data.sameAs) && data.sameAs.length > 0)
      );
    });
  }

  /**
   * Check if there's BreadcrumbList schema
   */
  private hasBreadcrumbs(): boolean {
    return this.types.has('BreadcrumbList');
  }

  /**
   * Check if there's FAQ schema
   */
  private hasFAQ(): boolean {
    return this.types.has('FAQPage') || this.types.has('Question');
  }

  /**
   * Get all schemas of a specific type
   */
  getSchemasByType(type: string): ParsedSchema[] {
    const normalizedType = this.normalizeType(type);
    return this.schemas.filter(schema => {
      const schemaTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
      return schemaTypes.some(t => this.normalizeType(t) === normalizedType);
    });
  }

  /**
   * Check if a specific type exists
   */
  hasType(type: string): boolean {
    return this.types.has(this.normalizeType(type));
  }

  /**
   * Get all unique types found
   */
  getAllTypes(): string[] {
    return Array.from(this.types);
  }

  /**
   * Get validation errors
   */
  getErrors(): Array<{ index: number; error: string }> {
    return this.errors;
  }

  /**
   * Get all schemas with Person or Organization that should have sameAs
   */
  getSchemasNeedingSameAs(): ParsedSchema[] {
    return this.schemas.filter(schema => {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      const hasIdentityType = types.some(t => {
        const normalized = this.normalizeType(t);
        return normalized === 'Person' || normalized === 'Organization';
      });
      
      const hasSameAs = schema.data.sameAs !== undefined && 
                        schema.data.sameAs !== null &&
                        (!Array.isArray(schema.data.sameAs) || schema.data.sameAs.length > 0);
      
      return hasIdentityType && !hasSameAs;
    });
  }
}

/**
 * Helper function to quickly extract JSON-LD from a Cheerio instance
 */
export function extractJsonLd($: CheerioAPI): JsonLdExtractionResult {
  const extractor = new JsonLdExtractor($);
  return extractor.extract();
}
