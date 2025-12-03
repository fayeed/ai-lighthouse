import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.A11Y}-006`,
  title: 'Table headers missing scope attributes',
  category: CATEGORY.A11Y,
  defaultSeverity: SEVERITY.LOW,
  tags: ['tables', 'scope', 'accessibility'],
  priority: 12,
  description: 'Checks that table headers have scope attributes to help AI agents understand relationships.'
})
export class TableScopeRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

    const tables = $('table');
    let tablesWithScopeIssues = 0;
    
    tables.each((_, el) => {
      const table = $(el);
      const headers = table.find('th');
      const headersWithScope = table.find('th[scope]');
      
      if (headers.length > 0 && headersWithScope.length === 0) {
        tablesWithScopeIssues++;
      }
    });

    if (tablesWithScopeIssues > 0) {
      return {
        id: `${CATEGORY.A11Y}-006`,
        title: 'Table headers missing scope attributes',
        serverity: SEVERITY.LOW,
        category: CATEGORY.A11Y,
        description: `Found ${tablesWithScopeIssues} table(s) with headers but no scope attributes. Scope helps AI agents understand header relationships.`,
        remediation: 'Add scope="col" or scope="row" to <th> elements to clarify whether they are column or row headers.',
        impactScore: 8,
        location: { url, selector: 'table' },
        evidence: [`Tables with scope issues: ${tablesWithScopeIssues}`],
        tags: ['tables', 'scope', 'accessibility'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue;
    }

    return null;
  }
}
