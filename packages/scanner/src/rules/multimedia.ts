import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { Rule, BaseRule, RuleContext } from './registry.js';

@Rule({
  id: `${CATEGORY.AIREAD}-066`,
  title: 'Video and multimedia optimization',
  category: CATEGORY.AIREAD,
  defaultSeverity: SEVERITY.MEDIUM,
  tags: ['video', 'multimedia', 'transcripts'],
  priority: 12,
  description: 'Checks multimedia elements for AI-friendly features: transcripts, captions, and semantic markup.'
})
export class MultimediaRule extends BaseRule {
  async execute(ctx: RuleContext): Promise<Issue | Issue[] | null> {
    const { url, $ } = ctx;
    const issues: Issue[] = [];

    // Check for videos
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
    
    if (videos.length > 0) {
      // Check for video captions/tracks
      let videosWithoutCaptions = 0;
      
      $('video').each((_, el) => {
        const video = $(el);
        const hasCaptions = video.find('track[kind="captions"], track[kind="subtitles"]').length > 0;
        if (!hasCaptions) {
          videosWithoutCaptions++;
        }
      });

      if (videosWithoutCaptions > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-066`,
          title: 'Videos without captions',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.AIREAD,
          description: `Found ${videosWithoutCaptions} video(s) without caption tracks. Captions provide text alternatives that AI can process.`,
          remediation: 'Add <track kind="captions"> elements to video tags with WebVTT caption files.',
          impactScore: 20,
          location: { url, selector: 'video' },
          evidence: [`Videos without captions: ${videosWithoutCaptions}`],
          tags: ['video', 'captions', 'accessibility'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // Check for video descriptions
      const videoSchema = $('script[type="application/ld+json"]').filter((_, el) => {
        const content = $(el).html();
        return !!(content && content.includes('VideoObject'));
      }).length;

      if (videoSchema === 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-067`,
          title: 'Videos lack structured data',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.AIREAD,
          description: 'Page contains videos but no VideoObject schema markup. Structured data helps AI understand video content.',
          remediation: 'Add VideoObject schema with name, description, thumbnailUrl, and other metadata.',
          impactScore: 18,
          location: { url },
          evidence: [`Videos: ${videos.length}`, 'No VideoObject schema'],
          tags: ['video', 'schema', 'structured-data'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // Check for transcript links
      const transcriptLinks = $('a[href*="transcript"], a:contains("Transcript"), a:contains("transcript")').length;
      if (transcriptLinks === 0 && videos.length > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-068`,
          title: 'No video transcripts available',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'Videos present but no transcript links found. Full text transcripts are ideal for AI content understanding.',
          remediation: 'Provide full text transcripts for videos. Link to them near the video or include them on the page.',
          impactScore: 12,
          location: { url },
          evidence: [`Videos: ${videos.length}`, 'No transcript links'],
          tags: ['video', 'transcripts', 'accessibility'],
          confidence: 0.7,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for audio elements
    const audioElements = $('audio');
    if (audioElements.length > 0) {
      // Check for audio descriptions or transcripts
      const audioTranscripts = $('a[href*="transcript"]').length;
      
      if (audioTranscripts === 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-069`,
          title: 'Audio content without transcripts',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.AIREAD,
          description: `Found ${audioElements.length} audio element(s) without transcript links. Audio content is inaccessible to AI without text alternatives.`,
          remediation: 'Provide text transcripts for all audio content (podcasts, audio clips, etc.).',
          impactScore: 18,
          location: { url, selector: 'audio' },
          evidence: [`Audio elements: ${audioElements.length}`],
          tags: ['audio', 'transcripts', 'accessibility'],
          confidence: 0.8,
          timestamp: new Date().toISOString()
        } as Issue);
      }

      // Check for PodcastEpisode schema
      const podcastSchema = $('script[type="application/ld+json"]').filter((_, el) => {
        const content = $(el).html();
        return !!(content && (content.includes('PodcastEpisode') || content.includes('PodcastSeries')));
      }).length;

      if (podcastSchema === 0 && audioElements.length > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-070`,
          title: 'Audio content lacks podcast schema',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: 'Audio content present but no PodcastEpisode/PodcastSeries schema. Structured data helps AI categorize audio content.',
          remediation: 'Add PodcastEpisode or AudioObject schema for audio content.',
          impactScore: 10,
          location: { url },
          evidence: [`Audio elements: ${audioElements.length}`],
          tags: ['audio', 'schema', 'podcast'],
          confidence: 0.7,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for SVG accessibility
    const svgs = $('svg');
    if (svgs.length > 0) {
      let svgsWithoutTitle = 0;
      
      svgs.each((_, el) => {
        const svg = $(el);
        const hasTitle = svg.find('title').length > 0;
        const hasAriaLabel = !!svg.attr('aria-label');
        const isDecorative = svg.attr('role') === 'presentation' || svg.attr('aria-hidden') === 'true';
        
        if (!hasTitle && !hasAriaLabel && !isDecorative) {
          svgsWithoutTitle++;
        }
      });

      if (svgsWithoutTitle > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-071`,
          title: 'SVGs without accessible descriptions',
          serverity: SEVERITY.LOW,
          category: CATEGORY.AIREAD,
          description: `Found ${svgsWithoutTitle} SVG(s) without <title> elements or aria-label. Descriptive text helps AI understand SVG content.`,
          remediation: 'Add <title> elements inside SVGs, use aria-label, or mark decorative SVGs with aria-hidden="true".',
          impactScore: 8,
          location: { url, selector: 'svg' },
          evidence: [`SVGs without descriptions: ${svgsWithoutTitle}`],
          tags: ['svg', 'accessibility', 'graphics'],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    // Check for embedded content (YouTube, etc.) without fallback
    const iframes = $('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="embed"]');
    if (iframes.length > 0) {
      let iframesWithoutTitle = 0;
      
      iframes.each((_, el) => {
        const iframe = $(el);
        const hasTitle = !!iframe.attr('title');
        if (!hasTitle) {
          iframesWithoutTitle++;
        }
      });

      if (iframesWithoutTitle > 0) {
        issues.push({
          id: `${CATEGORY.AIREAD}-072`,
          title: 'Embedded content without titles',
          serverity: SEVERITY.MEDIUM,
          category: CATEGORY.AIREAD,
          description: `Found ${iframesWithoutTitle} iframe(s) without title attributes. Titles help AI understand embedded content purpose.`,
          remediation: 'Add descriptive title attributes to all iframe elements (e.g., title="YouTube video: Tutorial Name").',
          impactScore: 12,
          location: { url, selector: 'iframe' },
          evidence: [`Iframes without titles: ${iframesWithoutTitle}`],
          tags: ['iframe', 'embedded', 'accessibility'],
          confidence: 1,
          timestamp: new Date().toISOString()
        } as Issue);
      }
    }

    return issues.length > 0 ? issues : null;
  }
}
