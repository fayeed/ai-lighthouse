import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-022`,
  title: 'AI-friendly formatting issues',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['formatting', 'accessibility', 'structure'],
  priority: 11,
  description: 'Checks for proper use of lists, tables, and code blocks that help AI agents parse content correctly.'
})
export class FormattingRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for fake lists (divs styled like lists)
    const possibleLists = $('div[class*="list"], div[class*="item"]');
    let fakeListCount = 0;
    
    possibleLists.each((_, el) => {
      const children = $(el).children('div[class*="item"]');
      if (children.length > 2) {
        fakeListCount++;
      }
    });

    if (fakeListCount > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-022`,
        title: 'Fake lists using divs',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${fakeListCount} potential list(s) created with <div> elements instead of proper <ul>/<ol> tags. AI agents may not recognize these as lists.`,
        remediation: 'Use semantic <ul> or <ol> elements for lists. This helps AI agents understand the content structure and relationship between items.',
        impactScore: 15,
        location: { url },
        evidence: [`Potential div-based lists: ${fakeListCount}`],
        tags: ['lists', 'semantic', 'structure'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for tables without proper structure
    const tables = $('table');
    let poorTables = 0;
    let tablesWithoutCaption = 0;
    
    tables.each((_, el) => {
      const table = $(el);
      const hasThead = table.find('thead').length > 0;
      const hasTh = table.find('th').length > 0;
      const hasCaption = table.find('caption').length > 0;
      
      if (!hasThead && !hasTh) {
        poorTables++;
      }
      if (!hasCaption) {
        tablesWithoutCaption++;
      }
    });

    if (poorTables > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-023`,
        title: 'Tables missing semantic structure',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${poorTables} table(s) without <thead> or <th> elements. Proper table structure helps AI agents understand headers and data relationships.`,
        remediation: 'Add <thead> sections and use <th> elements for table headers. Consider adding <caption> to describe the table purpose.',
        impactScore: 15,
        location: { url, selector: 'table' },
        evidence: [`Tables without proper headers: ${poorTables}`],
        tags: ['tables', 'accessibility', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    if (tablesWithoutCaption > 0 && tables.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-023a`,
        title: 'Tables missing captions',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${tablesWithoutCaption} table(s) without <caption> elements. Captions help AI agents understand the table's purpose and context.`,
        remediation: 'Add <caption> elements to tables to describe their purpose and content.',
        impactScore: 8,
        location: { url, selector: 'table' },
        evidence: [`Tables without captions: ${tablesWithoutCaption}`],
        tags: ['tables', 'accessibility', 'context'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for code blocks with proper formatting
    const preBlocks = $('pre');
    const inlineCode = $('code').not('pre code');
    
    let poorlyFormattedCode = 0;
    preBlocks.each((_, el) => {
      const pre = $(el);
      const hasCode = pre.find('code').length > 0;
      if (!hasCode && pre.text().trim().length > 50) {
        poorlyFormattedCode++;
      }
    });

    if (poorlyFormattedCode > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-024`,
        title: 'Code blocks missing semantic markup',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${poorlyFormattedCode} <pre> block(s) without <code> elements. Wrapping code in <code> tags helps AI agents identify programming content.`,
        remediation: 'Wrap code content in <pre><code> tags instead of just <pre>. This semantic markup helps AI distinguish code from regular preformatted text.',
        impactScore: 10,
        location: { url, selector: 'pre' },
        evidence: [`Pre blocks without code tags: ${poorlyFormattedCode}`],
        tags: ['code', 'semantic', 'formatting'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for proper list nesting
    const lists = $('ul, ol');
    let improperNesting = 0;
    
    lists.each((_, el) => {
      const list = $(el);
      const directChildren = list.children();
      
      directChildren.each((_, child) => {
        const tagName = $(child).prop('tagName')?.toLowerCase();
        if (tagName !== 'li') {
          improperNesting++;
        }
      });
    });

    if (improperNesting > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-025`,
        title: 'Improper list nesting',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${improperNesting} non-<li> element(s) as direct children of lists. Lists should only contain <li> elements as direct children.`,
        remediation: 'Ensure <ul> and <ol> elements only contain <li> as direct children. Nest other elements inside the <li> tags.',
        impactScore: 10,
        location: { url },
        evidence: [`Invalid list children: ${improperNesting}`],
        tags: ['lists', 'html-validity', 'structure'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for definition lists
    const dlists = $('dl');
    if (dlists.length > 0) {
      dlists.each((_, el) => {
        const dl = $(el);
        const hasDt = dl.find('dt').length > 0;
        const hasDd = dl.find('dd').length > 0;
        
        if (!hasDt || !hasDd) {
          issues.push({
            id: `${CATEGORY.AIREAD}-026`,
            title: 'Malformed definition list',
            serverity: SEVERITY.LOW,
            category: CATEGORY.AIREAD,
            description: 'Found a <dl> element without proper <dt>/<dd> pairs. Definition lists help AI agents understand term-definition relationships.',
            remediation: 'Ensure definition lists contain both <dt> (term) and <dd> (definition) elements in proper pairs.',
            impactScore: 5,
            location: { url, selector: 'dl' },
            evidence: ['Definition list missing dt or dd elements'],
            tags: ['lists', 'semantic', 'definitions'],
            confidence: 1,
            timestamp: new Date().toISOString()
          } as Issue);
        }
      });
    }

    // Check for blockquotes without proper attribution
    const blockquotes = $('blockquote');
    let quotesWithoutCite = 0;
    
    blockquotes.each((_, el) => {
      const blockquote = $(el);
      const hasCite = blockquote.attr('cite') || blockquote.find('cite').length > 0;
      if (!hasCite && blockquote.text().trim().length > 50) {
        quotesWithoutCite++;
      }
    });

    if (quotesWithoutCite > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-027`,
        title: 'Blockquotes missing citations',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${quotesWithoutCite} <blockquote>(s) without citation information. Citations help AI agents understand quote sources and context.`,
        remediation: 'Add cite attribute to <blockquote> elements or include a <cite> element to provide source information.',
        impactScore: 8,
        location: { url, selector: 'blockquote' },
        evidence: [`Blockquotes without citations: ${quotesWithoutCite}`],
        tags: ['quotes', 'citations', 'semantic'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
