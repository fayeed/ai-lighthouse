import type { FixGuide } from '../types';

/**
 * GEO (Generative Engine Optimization) issue fix guides.
 */
export const geoGuides: Record<string, Record<string, FixGuide>> = {
  // GEO-001: Missing structured data / JSON-LD
  'GEO-001': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install "Schema Pro" or "Rank Math" plugin for automatic structured data.',
        'Go to the plugin settings and enable schema types for your content.',
        'For custom schemas, use the plugin\'s Schema Generator.',
        'Validate with Google Rich Results Test.',
      ],
      pluginOrTool: 'Schema Pro / Rank Math',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Shopify includes basic Product and BreadcrumbList schema automatically.',
        'For additional schemas, install an app like "JSON-LD for SEO".',
        'Or manually add JSON-LD in your theme.liquid file.',
        'Include Organization, WebSite, and Article schemas as needed.',
      ],
      pluginOrTool: 'JSON-LD for SEO app',
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Install next-seo for easy structured data management.',
        'Add JSON-LD scripts to your layout or page components.',
        'Include Organization, WebSite, and page-specific schemas.',
      ],
      codeSnippet: `import { ArticleJsonLd } from 'next-seo';

<ArticleJsonLd
  type="BlogPosting"
  url="https://example.com/article"
  title="Article Title"
  description="Article description"
  authorName="Author Name"
  publisherName="Publisher"
  datePublished="2024-01-01"
/>`,
      pluginOrTool: 'next-seo',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add JSON-LD structured data in a <script> tag within <head>.',
        'Include Organization schema for your brand identity.',
        'Add page-specific schema (Article, Product, FAQPage, etc.).',
        'Validate at schema.org/docs/validator.html.',
      ],
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png"
}
</script>`,
    },
  },

  // GEO-002: Missing author attribution
  'GEO-002': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Ensure author profiles have complete bio information.',
        'Go to Users → Your Profile and fill in biographical info.',
        'Use a theme or plugin that displays author boxes on posts.',
        'Consider "Simple Author Box" plugin for rich author displays.',
        'Link author names to their author archive pages.',
      ],
      pluginOrTool: 'Simple Author Box',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Edit your blog template to include author information.',
        'Add author name, bio, and optional image in blog post templates.',
        'Include Person schema for the author in the template.',
      ],
      codeSnippet: `{% if article.author %}
  <div class="author-box">
    <span>By {{ article.author }}</span>
  </div>
{% endif %}`,
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Create an Author component that displays name, bio, and avatar.',
        'Include it on article/blog post pages.',
        'Add Person schema or author field in Article JSON-LD.',
      ],
      codeSnippet: `// In article metadata
export const metadata = {
  authors: [{ name: 'Author Name', url: 'https://author-url.com' }],
};`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add an author section to your content with name and credentials.',
        'Include a <meta name="author" content="Name"> tag.',
        'Add Person schema linked to Article schema.',
      ],
      codeSnippet: `<meta name="author" content="Author Name" />
<div class="author">
  <span>Written by <a href="/about">Author Name</a></span>
  <p>Author credentials and bio.</p>
</div>`,
    },
  },

  // GEO-003: Poor citation signals
  'GEO-003': {
    generic: {
      platform: 'HTML',
      steps: [
        'Add source citations for statistics and claims using inline links.',
        'Include a "Sources" or "References" section at the end of articles.',
        'Link to authoritative sources (.gov, .edu, established publications).',
        'Use data attributes or schema to mark up citations.',
        'Include original data, research, or unique analysis when possible.',
      ],
    },
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Use inline links to cite sources for claims and statistics.',
        'Add a "References" section at the bottom of each post.',
        'Consider using the "Easy Footnotes" plugin for academic-style citations.',
        'Include original data visualizations or research findings.',
      ],
      pluginOrTool: 'Easy Footnotes',
    },
  },

  // GEO-004: Low AI comprehension score
  'GEO-004': {
    generic: {
      platform: 'HTML',
      steps: [
        'Break content into clearly labeled sections with descriptive headings.',
        'Use bullet points and numbered lists for key information.',
        'Define technical terms and acronyms on first use.',
        'Add a summary or TL;DR at the beginning of long content.',
        'Use tables for comparative data instead of prose.',
      ],
    },
  },

  // GEO-005: Missing knowledge graph signals
  'GEO-005': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install Rank Math or Schema Pro for auto-generated schemas.',
        'Ensure Organization, Person, and WebSite schemas are present.',
        'Link internal entities to Wikipedia/Wikidata where relevant.',
        'Use consistent entity naming across your site.',
      ],
      pluginOrTool: 'Rank Math',
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Add Organization, WebSite, and BreadcrumbList JSON-LD.',
        'Use sameAs property to link to Wikipedia, social profiles.',
        'Ensure consistent entity references across pages.',
      ],
      codeSnippet: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "sameAs": [
    "https://twitter.com/yourbrand",
    "https://linkedin.com/company/yourbrand",
    "https://en.wikipedia.org/wiki/Your_Brand"
  ]
}`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add Organization and WebSite JSON-LD schemas.',
        'Include sameAs links to official social/Wikipedia profiles.',
        'Use consistent naming for entities throughout your content.',
        'Implement BreadcrumbList for navigation context.',
      ],
    },
  },

  // GEO-006: Missing content freshness signals
  'GEO-006': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Ensure your theme displays "Published" and "Last Updated" dates.',
        'Use the "WP Last Modified Info" plugin to show update dates.',
        'Regularly update your most important content.',
        'Include datePublished and dateModified in Article schema.',
      ],
      pluginOrTool: 'WP Last Modified Info',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Display publish and last-modified dates visibly on the page.',
        'Include datePublished and dateModified in Article schema.',
        'Add a <meta> tag for last-modified date.',
      ],
      codeSnippet: `<meta property="article:published_time" content="2024-01-15T10:00:00Z" />
<meta property="article:modified_time" content="2024-06-20T14:30:00Z" />`,
    },
  },

  // GEO-007: No brand protection
  'GEO-007': {
    generic: {
      platform: 'HTML',
      steps: [
        'Use your brand name consistently throughout the page.',
        'Add Organization schema with your brand details.',
        'Include a clear brand value proposition on each page.',
        'Avoid unnecessary competitor mentions in your content.',
        'Ensure your brand messaging is unambiguous.',
      ],
    },
  },

  // GEO-008: Content not optimized for AI extraction
  'GEO-008': {
    generic: {
      platform: 'HTML',
      steps: [
        'Structure content with clear, descriptive headings (H2, H3).',
        'Use semantic HTML elements (article, section, nav, aside).',
        'Include summary/overview paragraphs at the start of sections.',
        'Use lists and tables for structured information.',
        'Ensure all critical content is in the HTML (not loaded via JS).',
        'Add aria-labels and descriptive link text.',
      ],
    },
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Use the block editor\'s built-in heading, list, and table blocks.',
        'Add a summary paragraph at the top of each post.',
        'Use proper heading hierarchy (H2 → H3 → H4).',
        'Avoid placing key content only in images or PDFs.',
      ],
    },
  },

  // Also cover rule-based issues
  // KG-001: Missing JSON-LD
  'KG-001': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install Rank Math or Yoast SEO — both auto-generate JSON-LD.',
        'Go to the plugin\'s Schema settings to configure default types.',
        'Verify schema output using Google Rich Results Test.',
      ],
      pluginOrTool: 'Rank Math / Yoast SEO',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Install "JSON-LD for SEO" app from the Shopify App Store.',
        'The app automatically adds structured data for products, articles, etc.',
        'Verify with Google Rich Results Test.',
      ],
      pluginOrTool: 'JSON-LD for SEO',
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Add JSON-LD scripts to your layout or page components.',
        'Use next-seo library for structured data helpers.',
      ],
      codeSnippet: `<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page Title",
    description: "Page description",
  })}}
/>`,
      pluginOrTool: 'next-seo',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add at least one JSON-LD block in <head> or at the end of <body>.',
        'Start with Organization and WebPage schemas.',
        'Add content-specific types (Article, Product, etc.) as applicable.',
      ],
    },
  },

  // AIREAD-037: Missing alt text (rule-based)
  'AIREAD-037': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Go to Media → Library and click on images missing alt text.',
        'Enter descriptive alt text in the "Alternative Text" field.',
        'For images in posts, click the image block and fill in the alt text field.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add alt attributes to all <img> tags.',
        'Write descriptive alt text that explains the image content.',
        'For decorative images, use an empty alt attribute: alt="".',
      ],
    },
  },
};
