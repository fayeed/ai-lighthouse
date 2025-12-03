import type { CheerioAPI } from 'cheerio';
import { JsonLdExtractor } from './json-ld-extractor.js';

export interface EntityDetails {
  entityType: 'Product' | 'Organization' | 'Article' | 'Person' | 'LocalBusiness' | 'WebPage' | 'Unknown' | null;
  name: string | null;
  description: string | null;
  productDetails?: {
    brand?: string;
    price?: string;
    currency?: string;
    availability?: string;
    sku?: string;
    gtin?: string;
  };
  sameAsLinks: string[];
  brand?: string;
  url?: string;
  image?: string;
  confidence: number;
}

/**
 * Page-Level Entity Detector
 * 
 * Rules:
 * 1. If Product JSON-LD exists → primary entity: Product
 * 2. If Organization JSON-LD exists and no Product → Organization
 * 3. Else infer from content (NER heuristics)
 * 
 * Outputs:
 * - entity type
 * - name
 * - description
 * - product details (price, brand, etc.)
 * - pricing
 * - sameAs links
 * - brand
 */
export class EntityDetector {
  private $: CheerioAPI;
  private jsonLdExtractor: JsonLdExtractor;
  private url: string;

  constructor($: CheerioAPI, url: string) {
    this.$ = $;
    this.url = url;
    this.jsonLdExtractor = new JsonLdExtractor($);
  }

  /**
   * Detect the primary entity on the page
   */
  detect(): EntityDetails {
    const jsonLd = this.jsonLdExtractor.extract();
    
    // Rule 1: If Product JSON-LD exists → primary entity: Product
    const productSchema = jsonLd.schemas.find(s => {
      const type = s.type || s.raw?.['@type'];
      return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
    });
    
    if (productSchema) {
      return this.extractProductEntity(productSchema);
    }

    // Rule 2: If Organization JSON-LD exists and no Product → Organization
    const orgSchema = jsonLd.schemas.find(s => {
      const type = s.type || s.raw?.['@type'];
      const types = Array.isArray(type) ? type : [type];
      return types.some(t => 
        t === 'Organization' || 
        t === 'LocalBusiness' || 
        t === 'Corporation'
      );
    });
    
    if (orgSchema) {
      return this.extractOrganizationEntity(orgSchema);
    }

    // Rule 3: Else infer from content (NER heuristics)
    return this.inferFromContent();
  }

  private extractProductEntity(schema: any): EntityDetails {
    const data = schema.data || schema.raw || schema;
    const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
    
    return {
      entityType: 'Product',
      name: data.name || this.$('h1').first().text().trim() || null,
      description: data.description || this.$('meta[name="description"]').attr('content') || null,
      productDetails: {
        brand: data.brand?.name || data.brand || undefined,
        price: offers?.price?.toString() || offers?.lowPrice?.toString() || undefined,
        currency: offers?.priceCurrency || undefined,
        availability: offers?.availability || undefined,
        sku: data.sku || undefined,
        gtin: data.gtin || data.gtin13 || data.gtin12 || data.gtin8 || undefined,
      },
      sameAsLinks: this.extractSameAsLinks(data),
      brand: data.brand?.name || data.brand || undefined,
      url: data.url || this.url,
      image: data.image || undefined,
      confidence: 1.0
    };
  }

  private extractOrganizationEntity(schema: any): EntityDetails {
    const data = schema.data || schema.raw || schema;
    const type = schema.type || data['@type'];
    const types = Array.isArray(type) ? type : [type];
    const isLocalBusiness = types.some(t => t === 'LocalBusiness');
    
    return {
      entityType: isLocalBusiness ? 'LocalBusiness' : 'Organization',
      name: data.name || this.$('title').text().split(/[-–—|:]/)[0].trim() || null,
      description: data.description || this.$('meta[name="description"]').attr('content') || null,
      sameAsLinks: this.extractSameAsLinks(data),
      url: data.url || this.url,
      image: data.logo?.url || data.logo || data.image || undefined,
      confidence: 1.0
    };
  }

  private inferFromContent(): EntityDetails {
    const $ = this.$;
    
    // Check for product indicators
    const hasProductIndicators = $(
      '[class*="product"], [itemtype*="Product"], [data-product], .price, .add-to-cart, .buy-now, [class*="cart"]'
    ).length > 2;
    
    if (hasProductIndicators) {
      return this.inferProduct();
    }

    // Check for organization indicators (homepage, about page, contact info)
    const isHomePage = new URL(this.url).pathname === '/' || new URL(this.url).pathname === '';
    const hasOrgIndicators = isHomePage || 
      $('[class*="about"], [class*="company"], [class*="organization"]').length > 0;
    
    if (hasOrgIndicators) {
      return this.inferOrganization();
    }

    // Check for article indicators
    const hasArticleIndicators = $('article').length > 0 || 
      $('[class*="post"], [class*="blog"], [class*="article"]').length > 0;
    
    if (hasArticleIndicators) {
      return this.inferArticle();
    }

    // Default: WebPage
    return this.inferWebPage();
  }

  private inferProduct(): EntityDetails {
    const $ = this.$;
    const h1 = $('h1').first().text().trim();
    const title = $('title').text();
    
    // Try to find price
    const priceElement = $('[class*="price" i], [id*="price" i], [itemprop="price"]').first();
    const priceText = priceElement.text().match(/[\d,]+\.?\d*/)?.[0];
    
    // Try to find brand
    const brandElement = $('[class*="brand" i], [id*="brand" i], [itemprop="brand"]').first();
    const brandText = brandElement.text().trim();
    
    return {
      entityType: 'Product',
      name: h1 || title.split(/[-–—|:]/)[0].trim(),
      description: $('meta[name="description"]').attr('content') || null,
      productDetails: {
        brand: brandText || undefined,
        price: priceText || undefined,
      },
      sameAsLinks: [],
      brand: brandText || undefined,
      url: this.url,
      confidence: 0.6
    };
  }

  private inferOrganization(): EntityDetails {
    const $ = this.$;
    const title = $('title').text();
    const h1 = $('h1').first().text().trim();
    
    return {
      entityType: 'Organization',
      name: h1 || title.split(/[-–—|:]/)[0].trim(),
      description: $('meta[name="description"]').attr('content') || null,
      sameAsLinks: this.extractSocialLinks(),
      url: this.url,
      confidence: 0.5
    };
  }

  private inferArticle(): EntityDetails {
    const $ = this.$;
    const h1 = $('h1').first().text().trim();
    
    return {
      entityType: 'Article',
      name: h1,
      description: $('meta[name="description"]').attr('content') || null,
      sameAsLinks: [],
      url: this.url,
      confidence: 0.6
    };
  }

  private inferWebPage(): EntityDetails {
    const $ = this.$;
    const title = $('title').text();
    
    return {
      entityType: 'WebPage',
      name: title,
      description: $('meta[name="description"]').attr('content') || null,
      sameAsLinks: [],
      url: this.url,
      confidence: 0.4
    };
  }

  private extractSameAsLinks(schema: any): string[] {
    const sameAs = schema.sameAs;
    if (!sameAs) return [];
    return Array.isArray(sameAs) ? sameAs : [sameAs];
  }

  private extractSocialLinks(): string[] {
    const $ = this.$;
    const socialLinks: string[] = [];
    const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com'];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && socialDomains.some(domain => href.includes(domain))) {
        socialLinks.push(href);
      }
    });
    
    return [...new Set(socialLinks)];
  }
}

/**
 * Helper function to quickly detect entity from a Cheerio instance
 */
export function detectEntity($: CheerioAPI, url: string): EntityDetails {
  const detector = new EntityDetector($, url);
  return detector.detect();
}
