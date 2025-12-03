import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';
import { JsonLdExtractor } from '../../json-ld-extractor.js';

@Rule({
  id: `${CATEGORY.KG}-007`,
  title: 'Product page lacks Product schema',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['product', 'schema', 'ecommerce'],
  priority: 10,
  description: 'Detects product pages without Product schema markup.'
})
export class MissingProductSchemaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const extractor = new JsonLdExtractor($);
    const jsonLd = extractor.extract();
    
    // Check if there's a Product schema
    const hasProduct = extractor.getAllTypes().some(type => 
      type.includes('Product')
    );

    if (hasProduct) {
      return null;
    }

    // Check if page looks like a product page
    const hasProductIndicators = $(
      '[class*="product"], [itemtype*="Product"], [data-product], .price, .add-to-cart, .buy-now'
    ).length > 3;
    
    if (!hasProductIndicators) {
      return null;
    }

    return {
      id: `${CATEGORY.KG}-007`,
      title: 'Product page lacks Product schema',
      serverity: SEVERITY.MEDIUM,
      category: CATEGORY.KG,
      description: 'Page appears to be a product page but lacks Product schema. This helps AI understand pricing, availability, and reviews.',
      remediation: 'Add Product schema with name, image, description, price, and availability properties.',
      impactScore: 18,
      location: { url },
      evidence: ['Product page detected but no Product schema found'],
      tags: ['product', 'schema', 'ecommerce'],
      confidence: 0.7,
      timestamp: new Date().toISOString()
    } as Issue;
  }
}
