import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-037`,
  title: 'Image optimization for AI',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['images', 'accessibility', 'ai-vision'],
  priority: 13,
  description: 'Checks image elements for AI-friendly attributes: alt text quality, title, figcaption, and proper semantic structure.'
})
export class ImageOptimizationRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    const images = $('img');
    
    if (images.length === 0) {
      return null;
    }

    // Check for poor quality alt text
    const poorAltText: string[] = [];
    const genericAltPhrases = ['image', 'picture', 'photo', 'img', 'icon', 'logo', 'graphic'];
    
    images.each((_, el) => {
      const img = $(el);
      const alt = img.attr('alt');
      const src = img.attr('src') || 'unknown';
      
      if (alt && alt.trim().length > 0) {
        const altLower = alt.toLowerCase().trim();
        // Check if alt text is just a generic word
        if (genericAltPhrases.some(phrase => altLower === phrase || altLower.startsWith(phrase + ' ') || altLower.endsWith(' ' + phrase))) {
          poorAltText.push(`"${alt.substring(0, 30)}" on ${src.substring(0, 30)}`);
        }
        // Check if alt text is just the filename
        if (altLower === src.split('/').pop()?.toLowerCase().replace(/\.[^/.]+$/, '')) {
          poorAltText.push(`"${alt}" (filename as alt)`);
        }
      }
    });

    if (poorAltText.length > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-037`,
        title: 'Poor quality alt text',
        serverity: SEVERITY.MEDIUM,
        category: CATEGORY.AIREAD,
        description: `Found ${poorAltText.length} image(s) with generic or low-quality alt text like "image", "photo", or just the filename. AI agents need descriptive alt text to understand image content.`,
        remediation: 'Write descriptive alt text that explains what the image shows and its context. Avoid generic words like "image" or "photo".',
        impactScore: 20,
        location: { url },
        evidence: poorAltText.slice(0, 3),
        tags: ['images', 'alt-text', 'accessibility'],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for images in figures without figcaption
    const figures = $('figure');
    let figuresWithoutCaption = 0;
    
    figures.each((_, el) => {
      const figure = $(el);
      const hasImg = figure.find('img').length > 0;
      const hasCaption = figure.find('figcaption').length > 0;
      
      if (hasImg && !hasCaption) {
        figuresWithoutCaption++;
      }
    });

    if (figuresWithoutCaption > 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-038`,
        title: 'Figures missing captions',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${figuresWithoutCaption} <figure> element(s) with images but no <figcaption>. Captions provide additional context for AI agents.`,
        remediation: 'Add <figcaption> elements to <figure> tags to provide additional context about the image.',
        impactScore: 10,
        location: { url, selector: 'figure' },
        evidence: [`Figures without captions: ${figuresWithoutCaption}`],
        tags: ['images', 'figures', 'captions'],
        confidence: 1,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for images with loading="lazy" for performance
    const lazyImages = $('img[loading="lazy"]').length;
    const totalImages = images.length;
    
    if (totalImages > 3 && lazyImages === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-039`,
        title: 'Missing lazy loading on images',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${totalImages} images but none use lazy loading. While not directly AI-related, lazy loading improves page performance which affects crawl budget.`,
        remediation: 'Add loading="lazy" to images below the fold to improve page load performance.',
        impactScore: 5,
        location: { url },
        evidence: [`Total images: ${totalImages}`, `Images with lazy loading: ${lazyImages}`],
        tags: ['images', 'performance', 'optimization'],
        confidence: 0.8,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    // Check for responsive images
    const responsiveImages = $('img[srcset], picture').length;
    if (totalImages > 5 && responsiveImages === 0) {
      issues.push({
        id: `${CATEGORY.AIREAD}-040`,
        title: 'No responsive images',
        serverity: SEVERITY.LOW,
        category: CATEGORY.AIREAD,
        description: `Found ${totalImages} images but none use srcset or <picture> for responsiveness. AI agents with visual capabilities benefit from appropriate image sizes.`,
        remediation: 'Use srcset attribute or <picture> elements to provide multiple image sizes for different contexts.',
        impactScore: 8,
        location: { url },
        evidence: [`Total images: ${totalImages}`, `Responsive images: ${responsiveImages}`],
        tags: ['images', 'responsive', 'optimization'],
        confidence: 0.7,
        timestamp: new Date().toISOString()
      } as Issue);
    }

    return issues.length > 0 ? issues : null;
  }
}
