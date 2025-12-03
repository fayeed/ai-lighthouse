import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { EntityDetector } from '../../entity-detector.js';

@Rule({
  id: `${CATEGORY.EXTRACT}-002`,
  title: 'Page-Level Entity Detection',
  category: CATEGORY.EXTRACT,
  defaultSeverity: SEVERITY.INFO,
  tags: ['entity', 'extraction', 'ner', 'metadata'],
  priority: 5,
  description: 'Detects and extracts the primary entity from the page (Product, Organization, Article, etc.) with structured details.'
})
export class PageEntityDetectorRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const detector = new EntityDetector($, url);
    const entity = detector.detect();

    // This is an informational rule - always returns an issue with entity details
    const evidence: string[] = [
      `Entity Type: ${entity.entityType || 'Unknown'}`,
      `Name: ${entity.name || 'N/A'}`,
      `Confidence: ${(entity.confidence * 100).toFixed(0)}%`
    ];

    if (entity.description) {
      evidence.push(`Description: ${entity.description.substring(0, 100)}${entity.description.length > 100 ? '...' : ''}`);
    }

    if (entity.entityType === 'Product' && entity.productDetails) {
      if (entity.productDetails.brand) {
        evidence.push(`Brand: ${entity.productDetails.brand}`);
      }
      if (entity.productDetails.price) {
        evidence.push(`Price: ${entity.productDetails.currency || ''}${entity.productDetails.price}`);
      }
      if (entity.productDetails.availability) {
        evidence.push(`Availability: ${entity.productDetails.availability}`);
      }
    }

    if (entity.sameAsLinks && entity.sameAsLinks.length > 0) {
      evidence.push(`SameAs Links: ${entity.sameAsLinks.length} found`);
    }

    return {
      id: `${CATEGORY.EXTRACT}-002`,
      title: 'Page-Level Entity Detected',
      serverity: SEVERITY.INFO,
      category: CATEGORY.EXTRACT,
      description: `Detected primary entity: ${entity.entityType || 'Unknown'} - ${entity.name || 'Unnamed'}`,
      remediation: entity.confidence < 0.7 
        ? 'Consider adding JSON-LD structured data to improve entity detection confidence.'
        : 'Entity successfully detected with high confidence.',
      impactScore: 0, // Informational only
      location: { url },
      evidence,
      tags: ['entity', 'extraction', 'ner', 'metadata'],
      confidence: entity.confidence,
      timestamp: new Date().toISOString(),
      metadata: {
        entity: {
          type: entity.entityType,
          name: entity.name,
          description: entity.description,
          productDetails: entity.productDetails,
          sameAsLinks: entity.sameAsLinks,
          brand: entity.brand,
          url: entity.url,
          image: entity.image,
        }
      }
    } as Issue;
  }
}
