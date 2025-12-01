import { CATEGORY, Issue, SEVERITY } from "../types";
import { BaseRule, Rule, RuleContext } from "./registry";

@Rule({
  id: `${CATEGORY.EXTRACT}-001`,
  title: "Content Extraction Rule",
  category: CATEGORY.EXTRACT,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['content', 'extraction'],
  priority: 15,
  description: "Extracts and analyzes specific content from the HTML document."
})
export class ExtractCSRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { $, url, html } = ctx;

    const mainText = $('main').text().trim() ? $('body').text().trim() : '';
    const articleText = $('article').text().trim() ? $('article').text().trim() : '';
    const bodyText = $('body').text().trim() ? $('body').text().trim() : '';

    const textLength = bodyText.length;
    const scriptCount = $('script').length;
    const hasNextData = html.includes('__NEXT_DATA__');
    const hasReactRoot = !html.match(/data-reactroot|data-reactroot\=|data-react-checksum/)

    if ((mainText.length === 0 && articleText.length === 0 && textLength < 200) && (scriptCount > 10 || hasNextData || hasReactRoot)) {
        return {
          id: `${CATEGORY.EXTRACT}-001`,
          title: "Potential Content Extraction Issue",
          serverity: SEVERITY.CRITICAL,
          category: CATEGORY.EXTRACT,
          description: "The HTML document appears to have minimal extractable content, which may indicate issues with content extraction.",
          remediation: "Review the HTML structure and ensure that meaningful content is present within <main> or <article> tags. Consider improving the content delivery method if necessary.",
          impactScore: 40,
          location: { url },
          evidence: [
            `Main text length: ${mainText.length}`,
            `Article text length: ${articleText.length}`,
            `Body text length: ${textLength}`,
            `Script tag count: ${scriptCount}`,
            `Contains __NEXT_DATA__: ${hasNextData}`,
            `Uses React without data-reactroot: ${hasReactRoot}`
          ],
          tags: ['content', 'extraction', 'performance'],
          confidence: 0.9,
          timestamp: new Date().toISOString() 
        }
    }

    return null;
  }
}