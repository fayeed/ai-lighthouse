import { CATEGORY, Issue, SEVERITY } from '../../types.js';
import { Rule, BaseRule, RuleContext } from '../registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-038`,
  title: 'Poor quality alt text',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['images', 'alt-text', 'accessibility'],
  priority: 13,
  description: 'Detects generic or low-quality alt text like "image" or "photo".'
})
export class GenericAltTextRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;

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

    if (poorAltText.length === 0) {
      return null;
    }

    return {
      id: `${CATEGORY.AIREAD}-038`,
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
    } as Issue;
  }
}
