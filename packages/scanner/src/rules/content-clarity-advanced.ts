import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-080`,
  title: 'Content clarity and AI-usability',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['clarity', 'usability', 'content-quality', 'llm-friendly'],
  priority: 8,
  description: 'Advanced content clarity checks: summaries, readability, structure, and LLM-friendly formatting.'
})
export class ContentClarityAdvancedRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Get main content
    const mainContent = $('main, article, [role="main"]').first();
    const bodyText = (mainContent.length > 0 ? mainContent : $('body')).text();
    const paragraphs = (mainContent.length > 0 ? mainContent : $('body')).find('p');
    
    // 1. Check for summary/intro section
    const hasSummary = $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').length > 0;
    const firstParagraph = paragraphs.first().text().trim();
    
    if (!hasSummary && firstParagraph.length < 50) {
      issues.push({
        id: `${CATEGORY.AIREAD}-080`,
        title: 'Missing summary or intro section',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: 'No clear summary or introduction section found. AI agents benefit from explicit page summaries.',
        remediation: 'Add a clear introduction or summary section at the start of your content.',
        impactScore: 15,
        location: { url },
        evidence: ['No summary section detected', `First paragraph length: ${firstParagraph.length}`],
        tags: ['summary', 'structure', 'clarity'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 2. Check summary length (40-120 words optimal)
    if (hasSummary || firstParagraph.length > 50) {
      const summaryText = hasSummary 
        ? $('[class*="summary" i], [class*="intro" i], [id*="summary" i], [id*="intro" i]').first().text()
        : firstParagraph;
      const wordCount = summaryText.trim().split(/\s+/).length;
      
      if (wordCount < 40) {
        issues.push({
          id: `${CATEGORY.AIREAD}-081`,
          title: 'Summary too short',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Summary is only ${wordCount} words. Optimal length is 40-120 words for AI comprehension.`,
          remediation: 'Expand the summary to 40-120 words to provide sufficient context.',
          impactScore: 8,
          location: { url },
          evidence: [`Word count: ${wordCount}`, 'Optimal: 40-120 words'],
          tags: ['summary', 'length', 'clarity'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      } else if (wordCount > 120) {
        issues.push({
          id: `${CATEGORY.AIREAD}-082`,
          title: 'Summary too long',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Summary is ${wordCount} words. Optimal length is 40-120 words for concise AI understanding.`,
          remediation: 'Condense the summary to 40-120 words for better scannability.',
          impactScore: 6,
          location: { url },
          evidence: [`Word count: ${wordCount}`, 'Optimal: 40-120 words'],
          tags: ['summary', 'length', 'clarity'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // 3. Check if summary contains main entity
      const title = $('title').text();
      const h1 = $('h1').first().text();
      const mainEntity = (title || h1).split(/[-–—|:]/)[0].trim();
      
      if (mainEntity.length > 3 && !summaryText.toLowerCase().includes(mainEntity.toLowerCase().substring(0, 20))) {
        issues.push({
          id: `${CATEGORY.AIREAD}-083`,
          title: 'Summary missing main entity',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'Summary does not mention the main entity, product, or organization name.',
          remediation: 'Include the main subject/entity name in the opening summary for clarity.',
          impactScore: 10,
          location: { url },
          evidence: [`Main entity: ${mainEntity.substring(0, 50)}`],
          tags: ['summary', 'entity', 'clarity'],
          confidence: 0.6,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // 4. First paragraph relevance
    if (firstParagraph.length > 0) {
      const firstParaWords = firstParagraph.split(/\s+/);
      const hasQuestionWords = /\b(what|why|how|when|where|who)\b/i.test(firstParagraph.substring(0, 100));
      const startsWithAction = /^(learn|discover|find|get|explore|see)/i.test(firstParagraph);
      
      if (!hasQuestionWords && !startsWithAction && firstParaWords.length < 15) {
        issues.push({
          id: `${CATEGORY.AIREAD}-084`,
          title: 'First paragraph unclear purpose',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'First paragraph does not clearly describe the page purpose or answer key questions.',
          remediation: 'Start with a clear statement of what the page offers or answers.',
          impactScore: 12,
          location: { url },
          evidence: [`First paragraph: ${firstParagraph.substring(0, 100)}...`],
          tags: ['intro', 'clarity', 'purpose'],
          confidence: 0.6,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // 5. Pricing visibility (if applicable)
    const hasPricing = $('[class*="price" i], [id*="price" i], [itemprop="price"]').length > 0;
    const hasProductSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && (content.includes('"Product"') || content.includes('"Offer"')));
    }).length > 0;
    
    if (hasProductSchema && !hasPricing) {
      issues.push({
        id: `${CATEGORY.AIREAD}-085`,
        title: 'Pricing not visible',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product detected but pricing information is not clearly visible on the page.',
        remediation: 'Display pricing information prominently for products/services.',
        impactScore: 8,
        location: { url },
        evidence: ['Product schema present', 'No visible pricing'],
        tags: ['pricing', 'product', 'visibility'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 6. Features visibility
    const hasFeaturesList = $('[class*="feature" i], [id*="feature" i]').find('ul, ol').length > 0;
    const hasFeatureHeading = $('h2, h3, h4').filter((_, el) => {
      return /features|benefits|advantages/i.test($(el).text());
    }).length > 0;
    
    if (hasProductSchema && !hasFeaturesList && !hasFeatureHeading) {
      issues.push({
        id: `${CATEGORY.AIREAD}-086`,
        title: 'Features not clearly listed',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product page lacks a clear features or benefits section with structured lists.',
        remediation: 'Add a "Features" or "Benefits" section with bullet points or ordered list.',
        impactScore: 10,
        location: { url },
        evidence: ['No structured features list found'],
        tags: ['features', 'product', 'structure'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 7. Bullet/ordered lists present
    const lists = $('ul, ol').filter((_, el) => {
      return $(el).find('li').length >= 3; // At least 3 items
    });
    
    if (lists.length === 0 && paragraphs.length > 5) {
      issues.push({
        id: `${CATEGORY.AIREAD}-087`,
        title: 'No bullet or ordered lists',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page has substantial content but no lists. Lists improve scannability for AI and users.',
        remediation: 'Break up content with bullet points or numbered lists where appropriate.',
        impactScore: 8,
        location: { url },
        evidence: [`Paragraphs: ${paragraphs.length}`, 'Lists: 0'],
        tags: ['lists', 'structure', 'scannability'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 8. FAQ section present
    const hasFAQ = $('[class*="faq" i], [id*="faq" i]').length > 0;
    const faqSchema = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return !!(content && content.includes('FAQPage'));
    }).length > 0;
    
    const questionHeadings = $('h2, h3, h4, h5, h6').filter((_, el) => {
      return $(el).text().trim().endsWith('?');
    }).length;
    
    if (questionHeadings > 2 && !hasFAQ && !faqSchema) {
      issues.push({
        id: `${CATEGORY.AIREAD}-088`,
        title: 'FAQ section not structured',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${questionHeadings} question-style headings but no structured FAQ section.`,
        remediation: 'Create a dedicated FAQ section with proper markup or schema.',
        impactScore: 10,
        location: { url },
        evidence: [`Question headings: ${questionHeadings}`],
        tags: ['faq', 'structure', 'questions'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 9. Content density check
    const textLength = bodyText.replace(/\s+/g, ' ').trim().length;
    const htmlLength = $.html().length;
    const contentRatio = textLength / htmlLength;
    
    if (contentRatio < 0.1) {
      issues.push({
        id: `${CATEGORY.AIREAD}-089`,
        title: 'Content density too low',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content-to-code ratio is ${(contentRatio * 100).toFixed(1)}%. Too much markup relative to content.`,
        remediation: 'Increase text content or reduce excessive HTML markup/scripts.',
        impactScore: 15,
        location: { url },
        evidence: [`Content ratio: ${(contentRatio * 100).toFixed(1)}%`, 'Optimal: >10%'],
        tags: ['density', 'content-ratio', 'quality'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (contentRatio > 0.6) {
      issues.push({
        id: `${CATEGORY.AIREAD}-090`,
        title: 'Content density too high',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Content-to-code ratio is ${(contentRatio * 100).toFixed(1)}%. May lack proper structure and formatting.`,
        remediation: 'Add semantic HTML structure, headings, and formatting to improve organization.',
        impactScore: 8,
        location: { url },
        evidence: [`Content ratio: ${(contentRatio * 100).toFixed(1)}%`],
        tags: ['density', 'structure', 'formatting'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 10. Reading level check (simplified)
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = bodyText.split(/\s+/);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    
    // Flesch-Kincaid approximation: high = difficult
    const estimatedGrade = Math.round((0.39 * avgWordsPerSentence) + (11.8 * (words.join('').length / words.length)) - 15.59);
    
    if (estimatedGrade < 6) {
      issues.push({
        id: `${CATEGORY.AIREAD}-091`,
        title: 'Reading level too simple',
        serverity: SEVERITY.INFO,
        category: CATEGORY.AIREAD,
        description: `Estimated reading level: Grade ${estimatedGrade}. Content may be oversimplified.`,
        remediation: 'Consider adding more detail and depth appropriate for your audience.',
        impactScore: 5,
        location: { url },
        evidence: [`Estimated grade level: ${estimatedGrade}`, 'Recommended: Grade 6-10'],
        tags: ['readability', 'reading-level', 'quality'],
        confidence: 0.5,
        timestamp: new Date().toISOString()
      } as Issue);
    } else if (estimatedGrade > 12) {
      issues.push({
        id: `${CATEGORY.AIREAD}-092`,
        title: 'Reading level too complex',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Estimated reading level: Grade ${estimatedGrade}. Content may be too complex for general audiences.`,
        remediation: 'Simplify language and sentence structure for broader accessibility.',
        impactScore: 10,
        location: { url },
        evidence: [`Estimated grade level: ${estimatedGrade}`, 'Recommended: Grade 6-10'],
        tags: ['readability', 'reading-level', 'complexity'],
        confidence: 0.5,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 11. Duplicate content check
    const paraTexts = new Map<string, number>();
    paragraphs.each((_, el) => {
      const text = $(el).text().trim().substring(0, 100);
      if (text.length > 50) {
        paraTexts.set(text, (paraTexts.get(text) || 0) + 1);
      }
    });
    
    const duplicates = Array.from(paraTexts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-093`,
        title: 'Duplicate content detected',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${duplicates.length} instances of duplicate paragraphs across the page.`,
        remediation: 'Remove or consolidate duplicate content to avoid redundancy.',
        impactScore: 10,
        location: { url },
        evidence: [`Duplicate paragraphs: ${duplicates.length}`],
        tags: ['duplicate', 'quality', 'redundancy'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 12. Clarity heuristic score
    let clarityScore = 100;
    const clarityIssues: string[] = [];
    
    if (!hasSummary) { clarityScore -= 10; clarityIssues.push('No summary'); }
    if (lists.length === 0) { clarityScore -= 8; clarityIssues.push('No lists'); }
    if (avgWordsPerSentence > 25) { clarityScore -= 15; clarityIssues.push('Long sentences'); }
    if (contentRatio < 0.15) { clarityScore -= 12; clarityIssues.push('Low content density'); }
    if (paragraphs.length > 0 && paragraphs.filter((_, el) => $(el).text().length > 1000).length > paragraphs.length / 2) {
      clarityScore -= 10;
      clarityIssues.push('Long paragraphs');
    }
    
    if (clarityScore < 60) {
      issues.push({
        id: `${CATEGORY.AIREAD}-094`,
        title: 'Low clarity score',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Content clarity score: ${clarityScore}/100. Multiple readability issues detected.`,
        remediation: 'Improve structure, readability, and organization. Issues: ' + clarityIssues.join(', '),
        impactScore: 20,
        location: { url },
        evidence: [`Clarity score: ${clarityScore}`, `Issues: ${clarityIssues.join(', ')}`],
        tags: ['clarity', 'readability', 'score'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 13. Jargon/technical language check
    const technicalTerms = bodyText.match(/\b[A-Z]{2,}\b/g) || []; // Acronyms
    const jargonDensity = technicalTerms.length / Math.max(words.length, 1);
    
    if (jargonDensity > 0.05) {
      issues.push({
        id: `${CATEGORY.AIREAD}-095`,
        title: 'Excessive jargon detected',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `High density of technical terms/acronyms: ${(jargonDensity * 100).toFixed(1)}% of words.`,
        remediation: 'Define acronyms on first use and consider adding a glossary for technical terms.',
        impactScore: 8,
        location: { url },
        evidence: [`Acronyms found: ${technicalTerms.length}`, `Density: ${(jargonDensity * 100).toFixed(1)}%`],
        tags: ['jargon', 'technical', 'accessibility'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 14. Entity mentions consistency
    const h1Text = $('h1').first().text();
    const titleText = $('title').text();
    const mainEntityMatch = (h1Text || titleText).match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    
    if (mainEntityMatch) {
      const entity = mainEntityMatch[0];
      const mentions = (bodyText.match(new RegExp(entity, 'gi')) || []).length;
      
      if (mentions < 2) {
        issues.push({
          id: `${CATEGORY.AIREAD}-096`,
          title: 'Inconsistent entity references',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Main entity "${entity}" mentioned only ${mentions} time(s) in content.`,
          remediation: 'Reference the main entity consistently throughout the content.',
          impactScore: 6,
          location: { url },
          evidence: [`Entity: ${entity}`, `Mentions: ${mentions}`],
          tags: ['entity', 'consistency', 'references'],
          confidence: 0.5,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // 15. Claims/facts extractability
    const hasNumbers = /\d{1,3}(,\d{3})*(\.\d+)?%?/.test(bodyText);
    const hasStats = $('td, [class*="stat" i], [class*="metric" i]').length > 0;
    const hasCitations = $('cite, [class*="citation" i], [class*="reference" i], sup').length > 0;
    
    if (!hasNumbers && !hasStats && paragraphs.length > 5) {
      issues.push({
        id: `${CATEGORY.AIREAD}-097`,
        title: 'No extractable facts or data',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Content lacks quantifiable facts, statistics, or data points for LLM extraction.',
        remediation: 'Include specific numbers, statistics, or data points to support claims.',
        impactScore: 10,
        location: { url },
        evidence: ['No numbers or statistics detected'],
        tags: ['facts', 'data', 'extraction'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 16. Contact info present
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText);
    const hasPhone = /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/.test(bodyText);
    const hasContactLink = $('a[href^="mailto:"], a[href^="tel:"]').length > 0;
    
    if (!hasEmail && !hasPhone && !hasContactLink) {
      issues.push({
        id: `${CATEGORY.AIREAD}-098`,
        title: 'No contact information',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page lacks visible contact information (email, phone, or contact links).',
        remediation: 'Add contact information to improve trust and AI understanding of your organization.',
        impactScore: 8,
        location: { url },
        evidence: ['No email, phone, or contact links found'],
        tags: ['contact', 'trust', 'information'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 17. Call-to-action present
    const ctaButtons = $('button, a').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return /buy|purchase|sign up|subscribe|download|get started|contact|learn more|try|demo/i.test(text);
    });
    
    if (ctaButtons.length === 0 && hasProductSchema) {
      issues.push({
        id: `${CATEGORY.AIREAD}-099`,
        title: 'No clear call-to-action',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Product/service page lacks clear call-to-action buttons or links.',
        remediation: 'Add prominent CTAs like "Buy Now", "Sign Up", or "Get Started".',
        impactScore: 10,
        location: { url },
        evidence: ['No CTA buttons detected'],
        tags: ['cta', 'conversion', 'ux'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 18. Paragraph length checks
    const shortParas = paragraphs.filter((_, el) => {
      const words = $(el).text().trim().split(/\s+/);
      return words.length > 0 && words.length < 20;
    }).length;
    
    const longParas = paragraphs.filter((_, el) => {
      const words = $(el).text().trim().split(/\s+/);
      return words.length > 150;
    }).length;
    
    if (shortParas > paragraphs.length * 0.7 && paragraphs.length > 5) {
      issues.push({
        id: `${CATEGORY.AIREAD}-100`,
        title: 'Too many short paragraphs',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `${shortParas} out of ${paragraphs.length} paragraphs are very short (<20 words).`,
        remediation: 'Combine related short paragraphs for better flow and readability.',
        impactScore: 6,
        location: { url },
        evidence: [`Short paragraphs: ${shortParas}/${paragraphs.length}`],
        tags: ['paragraphs', 'structure', 'readability'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }
    
    if (longParas > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-101`,
        title: 'Paragraphs too long',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${longParas} paragraph(s) longer than 150 words. Break up for better readability.`,
        remediation: 'Split long paragraphs into smaller chunks (50-150 words ideal).',
        impactScore: 8,
        location: { url },
        evidence: [`Long paragraphs: ${longParas}`],
        tags: ['paragraphs', 'readability', 'structure'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 19. Internal link context
    const internalLinks = $('a[href^="/"], a[href^="' + new URL(url).origin + '"]');
    let linksWithoutContext = 0;
    
    internalLinks.each((_, el) => {
      const linkText = $(el).text().trim();
      if (linkText.length < 3 || /^(here|click|link|more)$/i.test(linkText)) {
        linksWithoutContext++;
      }
    });
    
    if (linksWithoutContext > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-102`,
        title: 'Internal links lack context',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${linksWithoutContext} internal link(s) with non-descriptive anchor text.`,
        remediation: 'Use descriptive anchor text that explains where the link leads.',
        impactScore: 8,
        location: { url },
        evidence: [`Links without context: ${linksWithoutContext}`],
        tags: ['links', 'context', 'navigation'],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 20. Content freshness
    const datePattern = /\b(20\d{2})[/-](0[1-9]|1[0-2])[/-](0[1-9]|[12]\d|3[01])\b/;
    const dateMatch = bodyText.match(datePattern);
    const lastModified = $('meta[property="article:modified_time"], meta[name="last-modified"]').attr('content');
    
    if (!dateMatch && !lastModified) {
      issues.push({
        id: `${CATEGORY.AIREAD}-103`,
        title: 'No freshness indicators',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: 'Page lacks date stamps or freshness indicators. AI agents prefer timestamped content.',
        remediation: 'Add publication/update dates using meta tags or visible timestamps.',
        impactScore: 8,
        location: { url },
        evidence: ['No dates detected'],
        tags: ['freshness', 'dates', 'currency'],
        confidence: 0.6,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 21. No popups detected
    const popupIndicators = $('[class*="popup" i], [class*="modal" i], [class*="overlay" i]').filter((_, el) => {
      const display = $(el).css('display');
      const visibility = $(el).css('visibility');
      return display !== 'none' && visibility !== 'hidden';
    });
    
    if (popupIndicators.length > 2) {
      issues.push({
        id: `${CATEGORY.AIREAD}-104`,
        title: 'Intrusive popups detected',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${popupIndicators.length} popup/modal elements. These interfere with AI crawling.`,
        remediation: 'Minimize popups and ensure they don\'t block content from crawlers.',
        impactScore: 15,
        location: { url },
        evidence: [`Popup elements: ${popupIndicators.length}`],
        tags: ['popups', 'ux', 'accessibility'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // 22. Fragment identifier usage
    const fragmentLinks = $('a[href*="#"]').filter((_, el) => {
      const href = $(el).attr('href');
      return !!(href && href.includes('#') && href.split('#')[1].length > 0);
    });
    
    if (fragmentLinks.length > 0) {
      let invalidFragments = 0;
      fragmentLinks.each((_, el) => {
        const href = $(el).attr('href') || '';
        const fragment = href.split('#')[1];
        // Escape special characters in CSS selector
        const escapedFragment = fragment.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
        const target = $(`#${escapedFragment}, [name="${escapedFragment}"]`);
        if (target.length === 0) {
          invalidFragments++;
        }
      });
      
      if (invalidFragments > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-105`,
          title: 'Invalid fragment identifiers',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Found ${invalidFragments} link(s) with fragment identifiers that don't exist on the page.`,
          remediation: 'Ensure all # fragment links point to valid IDs or named anchors.',
          impactScore: 6,
          location: { url },
          evidence: [`Invalid fragments: ${invalidFragments}/${fragmentLinks.length}`],
          tags: ['fragments', 'links', 'navigation'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    return issues.length > 0 ? issues : null;
  }
}
