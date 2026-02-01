import type { FixGuide } from '../types';

/**
 * AEO (Answer Engine Optimization) issue fix guides.
 */
export const aeoGuides: Record<string, Record<string, FixGuide>> = {
  // AEO-001: No FAQ schema detected
  'AEO-001': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install a schema plugin like "Schema Pro" or "Rank Math".',
        'Edit the page and open the schema settings.',
        'Select "FAQ" as the schema type.',
        'Add your questions and answers using the plugin interface.',
        'Publish and validate with Google Rich Results Test.',
      ],
      pluginOrTool: 'Schema Pro / Rank Math',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Edit the page template in your Shopify theme editor.',
        'Add a FAQ section using Shopify\'s section blocks (if supported).',
        'Alternatively, inject FAQPage JSON-LD in the theme.liquid <head>.',
        'Use Liquid variables to dynamically generate Q&A pairs.',
      ],
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Your question here?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your answer here."
    }
  }]
}
</script>`,
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Create a FAQ data array in your page component.',
        'Render the FAQ content visually on the page.',
        'Add a <script type="application/ld+json"> tag with FAQPage schema.',
        'Consider using next-seo for structured data management.',
      ],
      codeSnippet: `const faqs = [
  { q: "Question?", a: "Answer." },
];

// In your component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  })}}
/>`,
      pluginOrTool: 'next-seo',
    },
    squarespace: {
      platform: 'Squarespace',
      steps: [
        'Create an FAQ section on your page using the Accordion block.',
        'Go to Settings → Advanced → Code Injection.',
        'Paste FAQPage JSON-LD in the "Header" code injection area.',
        'Match the schema questions/answers to your accordion content.',
      ],
    },
    webflow: {
      platform: 'Webflow',
      steps: [
        'Create an FAQ section using Webflow\'s CMS collections or static elements.',
        'Go to Page Settings → Custom Code → Head Code.',
        'Add FAQPage JSON-LD matching your FAQ content.',
        'Publish to apply.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add FAQPage structured data as a JSON-LD script in your <head>.',
        'Include each question and answer pair.',
        'Ensure the visible FAQ content matches the schema exactly.',
        'Validate at search.google.com/test/rich-results.',
      ],
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is your question?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your detailed answer."
    }
  }]
}
</script>`,
    },
  },

  // AEO-002: No direct answer format
  'AEO-002': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Edit the relevant page or post.',
        'Add a clear, concise answer within the first paragraph (40-60 words).',
        'Use a question as a heading (H2/H3) followed by a direct answer.',
        'Format with "is-style-answer" or a callout block for emphasis.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Structure content with a question as a heading.',
        'Follow immediately with a concise 1-2 sentence answer.',
        'Then provide more detailed explanation below.',
        'This "inverted pyramid" style helps AI extract direct answers.',
      ],
      codeSnippet: `<h2>What is [topic]?</h2>
<p><strong>[Topic] is a [concise definition in 1-2 sentences].</strong></p>
<p>More detailed explanation follows here...</p>`,
    },
  },

  // AEO-003: Missing HowTo schema
  'AEO-003': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Use the Yoast SEO or Rank Math "How-to" block in the block editor.',
        'Enter each step with descriptions and optional images.',
        'The plugin auto-generates the HowTo schema.',
      ],
      pluginOrTool: 'Yoast SEO / Rank Math',
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Add HowTo JSON-LD to your page.',
        'Include each step with name, text, and optional image.',
      ],
      codeSnippet: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to do X",
  "step": [
    { "@type": "HowToStep", "name": "Step 1", "text": "Do this first." },
    { "@type": "HowToStep", "name": "Step 2", "text": "Then do this." },
  ]
})}} />`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add HowTo structured data as JSON-LD in your page <head>.',
        'List each step with a name and text description.',
        'Ensure visible content matches the schema.',
      ],
    },
  },

  // AEO-004: Poor voice search optimization
  'AEO-004': {
    generic: {
      platform: 'HTML',
      steps: [
        'Write in a conversational, natural language tone.',
        'Use question-and-answer format for key topics.',
        'Target long-tail, question-based keywords (who, what, when, where, how).',
        'Keep answers concise — voice assistants prefer 30-word responses.',
        'Add FAQ schema to increase voice search citation chances.',
      ],
    },
  },

  // AEO-005: Missing question-based headings
  'AEO-005': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Review your headings in the block editor.',
        'Convert key headings to question format (e.g., "What is X?", "How does Y work?").',
        'Follow each question heading with a direct answer paragraph.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Convert at least 2-3 of your headings to question format.',
        'Use H2 or H3 tags for question headings.',
        'Follow each with a concise answer paragraph.',
        'Target questions your audience actually searches for.',
      ],
      codeSnippet: `<h2>How does [feature] work?</h2>
<p>[Feature] works by [concise explanation].</p>`,
    },
  },
};
