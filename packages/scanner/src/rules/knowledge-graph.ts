import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.KG}-001`,
  title: 'Knowledge Graph and entity markup',
  category: CATEGORY.KG,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['knowledge-graph', 'entities', 'schema'],
  priority: 10,
  description: 'Checks for structured data that helps build knowledge graphs: Schema.org types, entities, and relationships.'
})
export class KnowledgeGraphRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const schemaCount = jsonLdScripts.length;
    
    if (schemaCount === 0) {
      issues.push({
        id: `${CATEGORY.KG}-001`,
        title: 'No Schema.org structured data',
        serverity: SEVERITY.HIGH,
        category: CATEGORY.KG,
        description: 'The page lacks Schema.org structured data in JSON-LD format. This prevents AI from building knowledge graphs from your content.',
        remediation: 'Add Schema.org structured data using JSON-LD. Consider Organization, Person, Article, Product, or other relevant schemas.',
        impactScore: 30,
        location: { url },
        evidence: ['No JSON-LD structured data found'],
        tags: ['schema', 'json-ld', 'knowledge-graph'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    } else {
      // Parse JSON-LD to check quality
      const schemas: string[] = [];
      let hasMainEntity = false;
      
      jsonLdScripts.each((_, el) => {
        try {
          const content = $(el).html();
          if (content) {
            const data = JSON.parse(content);
            const types = Array.isArray(data) ? data.map(d => d['@type']).filter(Boolean) : [data['@type']].filter(Boolean);
            schemas.push(...types);
            
            if (data['@type'] === 'Organization' || data['@type'] === 'Person' || data['@type'] === 'Article' || data['@type'] === 'WebPage') {
              hasMainEntity = true;
            }
          }
        } catch (e) {
          // Invalid JSON-LD
        }
      });

      if (!hasMainEntity) {
        issues.push({
          id: `${CATEGORY.KG}-002`,
          title: 'Schema.org data lacks main entity',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.KG,
          description: `Found ${schemaCount} Schema.org object(s) but no main entity type (Organization, Person, Article, WebPage, etc.).`,
          remediation: 'Add a primary Schema.org type that describes the main content or purpose of the page.',
          impactScore: 20,
          location: { url },
          evidence: [`Schema types found: ${schemas.join(', ') || 'none'}`],
          tags: ['schema', 'entities', 'knowledge-graph'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for entity recognition hints
    const personEntities = $('[itemtype*="Person"], [typeof="Person"]').length;
    const orgEntities = $('[itemtype*="Organization"], [typeof="Organization"]').length;
    const placeEntities = $('[itemtype*="Place"], [typeof="Place"]').length;
    
    // Look for potential entities in text
    const mainText = $('main, article, body').first().text();
    const capitalizedWords = mainText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
    const potentialEntities = capitalizedWords ? new Set(capitalizedWords).size : 0;
    
    if (potentialEntities > 10 && (personEntities + orgEntities + placeEntities) === 0) {
      issues.push({
        id: `${CATEGORY.KG}-004`,
        title: 'Named entities not marked up',
        serverity: SEVERITY.LOW,
        category: CATEGORY.KG,
        description: `Found ${potentialEntities} potential named entities (people, organizations, places) but no entity markup. Entity recognition helps AI build knowledge graphs.`,
        remediation: 'Use Schema.org markup or semantic HTML to identify people, organizations, and places mentioned in content.',
        impactScore: 12,
        location: { url },
        evidence: [`Potential entities: ${potentialEntities}`, 'No entity markup found'],
        tags: ['entities', 'ner', 'knowledge-graph'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for relationship markup (sameAs, relatedTo, etc.)
    const sameAsLinks = jsonLdScripts.filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('sameAs'));
    }).length;

    if (schemaCount > 0 && sameAsLinks === 0) {
      const orgOrPerson = jsonLdScripts.filter((_, el) => {
        const content = $(el).html();
        return !!(content && (content.includes('"@type":"Organization"') || content.includes('"@type":"Person"')));
      }).length;

      if (orgOrPerson > 0) {
        issues.push({
          id: `${CATEGORY.KG}-005`,
          title: 'Missing sameAs relationships',
          serverity: SEVERITY.LOW,
          category: CATEGORY.KG,
          description: 'Schema.org data for Organization/Person lacks "sameAs" property. This property links entities to their social profiles and external identifiers.',
          remediation: 'Add "sameAs" property with URLs to social media profiles, Wikipedia, or other authoritative sources.',
          impactScore: 10,
          location: { url },
          evidence: ['No sameAs relationships found'],
          tags: ['relationships', 'schema', 'identity'],
          confidence: 0.8,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for breadcrumb schema
    const hasBreadcrumbs = jsonLdScripts.filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('BreadcrumbList'));
    }).length > 0;

    const breadcrumbNav = $('[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb" i]').length > 0;
    const pathDepth = new URL(url).pathname.split('/').filter(p => p.length > 0).length;

    if (pathDepth > 1 && !hasBreadcrumbs && breadcrumbNav) {
      issues.push({
        id: `${CATEGORY.KG}-006`,
        title: 'Breadcrumbs lack structured data',
        serverity: SEVERITY.LOW,
        category: CATEGORY.KG,
        description: 'Page has breadcrumb navigation but no BreadcrumbList schema. Structured breadcrumbs help AI understand site hierarchy.',
        remediation: 'Add BreadcrumbList structured data to complement your breadcrumb navigation.',
        impactScore: 8,
        location: { url },
        evidence: [`URL depth: ${pathDepth}`, 'No BreadcrumbList schema'],
        tags: ['breadcrumbs', 'schema', 'hierarchy'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for FAQ schema
    const hasFaqSchema = jsonLdScripts.filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('FAQPage'));
    }).length > 0;

    const faqHeaders = $('h2, h3, h4').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.endsWith('?') || text.includes('how to') || text.includes('what is');
    }).length;

    if (faqHeaders > 2 && !hasFaqSchema) {
      issues.push({
        id: `${CATEGORY.KG}-007`,
        title: 'FAQ content lacks schema markup',
        serverity: SEVERITY.LOW,
        category: CATEGORY.KG,
        description: `Found ${faqHeaders} potential FAQ items but no FAQPage schema. FAQ schema helps AI provide direct answers.`,
        remediation: 'Add FAQPage structured data to mark up question-answer pairs.',
        impactScore: 12,
        location: { url },
        evidence: [`Question-style headings: ${faqHeaders}`],
        tags: ['faq', 'schema', 'qa'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
