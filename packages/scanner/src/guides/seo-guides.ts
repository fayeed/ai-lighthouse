import type { FixGuide } from '../types';

/**
 * SEO issue fix guides, keyed by issue ID → platform key → guide.
 */
export const seoGuides: Record<string, Record<string, FixGuide>> = {
  // SEO-001: Missing title tag
  'SEO-001': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install and activate the Yoast SEO plugin if not already installed.',
        'Edit the page or post in the WordPress editor.',
        'Scroll down to the Yoast SEO meta box below the editor.',
        'Click "Edit snippet" and enter your title in the "SEO title" field.',
        'Keep it between 50-60 characters for optimal display.',
        'Click "Update" or "Publish" to save.',
      ],
      pluginOrTool: 'Yoast SEO',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Go to your Shopify admin panel.',
        'Navigate to Online Store → Pages (or Products/Collections).',
        'Select the page you want to edit.',
        'Scroll down to "Search engine listing preview" and click "Edit".',
        'Enter a descriptive title between 50-60 characters.',
        'Click "Save".',
      ],
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Open the page file (e.g. app/page.tsx or pages/index.tsx).',
        'Export a metadata object (App Router) or use next/head (Pages Router).',
        'Set the title to a descriptive string of 50-60 characters.',
      ],
      codeSnippet: `// App Router (app/page.tsx)
export const metadata = {
  title: 'Your Page Title — Brand Name',
};

// OR Pages Router (pages/index.tsx)
import Head from 'next/head';
<Head><title>Your Page Title — Brand Name</title></Head>`,
      pluginOrTool: 'next/head or metadata export',
    },
    squarespace: {
      platform: 'Squarespace',
      steps: [
        'Open the page in Squarespace editor.',
        'Click the gear icon (⚙) to open Page Settings.',
        'Go to the "SEO" tab.',
        'Enter your title in the "SEO Title" field (50-60 characters).',
        'Click "Save".',
      ],
    },
    webflow: {
      platform: 'Webflow',
      steps: [
        'Open your project in the Webflow Designer.',
        'Select the page from the Pages panel.',
        'Click the gear icon to open Page Settings.',
        'Enter your title in the "Title Tag" field (50-60 characters).',
        'Publish to apply changes.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Open your HTML file in a code editor.',
        'Inside the <head> section, add or edit the <title> tag.',
        'Write a descriptive title between 50-60 characters.',
        'Include your primary keyword near the beginning.',
      ],
      codeSnippet: `<head>
  <title>Your Page Title — Brand Name</title>
</head>`,
    },
  },

  // SEO-002/003: Title too short / too long
  'SEO-002': {
    generic: {
      platform: 'HTML',
      steps: [
        'Expand your title to include more descriptive keywords.',
        'Aim for 50-60 characters to maximize search visibility.',
        'Include your primary keyword and brand name.',
      ],
    },
  },

  'SEO-003': {
    generic: {
      platform: 'HTML',
      steps: [
        'Shorten your title to 60 characters or less.',
        'Keep the most important keywords at the beginning.',
        'Move secondary info to the meta description instead.',
      ],
    },
  },

  // SEO-004: Missing meta description
  'SEO-004': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Edit the page/post in the WordPress editor.',
        'Scroll to the Yoast SEO meta box.',
        'Click "Edit snippet" and fill in the "Meta description" field.',
        'Write a compelling summary between 150-160 characters.',
        'Include your primary keyword naturally.',
        'Click "Update" to save.',
      ],
      pluginOrTool: 'Yoast SEO',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Go to Shopify admin → Online Store → Pages.',
        'Select the page and scroll to "Search engine listing preview".',
        'Click "Edit" and enter a description (150-160 characters).',
        'Click "Save".',
      ],
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Open the page file.',
        'Add a description to the metadata export or <Head> component.',
      ],
      codeSnippet: `// App Router
export const metadata = {
  title: 'Page Title',
  description: 'A compelling summary of your page content in 150-160 characters.',
};

// Pages Router
<Head>
  <meta name="description" content="A compelling summary..." />
</Head>`,
      pluginOrTool: 'next/head or metadata export',
    },
    squarespace: {
      platform: 'Squarespace',
      steps: [
        'Open Page Settings → SEO tab.',
        'Enter a compelling description in the "SEO Description" field.',
        'Keep it 150-160 characters with your primary keyword.',
        'Click "Save".',
      ],
    },
    webflow: {
      platform: 'Webflow',
      steps: [
        'Open Page Settings in the Webflow Designer.',
        'Enter your description in the "Meta Description" field.',
        'Write 150-160 characters that entice clicks.',
        'Publish to apply.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add a meta description tag inside <head>.',
        'Write a compelling summary (150-160 characters).',
        'Include your primary keyword naturally.',
      ],
      codeSnippet: `<head>
  <meta name="description" content="Your compelling page summary here, 150-160 characters." />
</head>`,
    },
  },

  // SEO-007: Missing H1
  'SEO-007': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Edit the page in the WordPress block editor.',
        'The page title is usually rendered as H1 by your theme.',
        'If it\'s missing, add a Heading block at the top set to H1.',
        'Ensure there is only one H1 per page.',
      ],
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Edit the page/product in Shopify admin.',
        'The page title field is typically rendered as H1 by themes.',
        'If missing, check your theme\'s template (theme.liquid / sections/).',
        'Ensure the title is wrapped in <h1> tags.',
      ],
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Open the page component.',
        'Add an <h1> element with your primary page heading.',
        'Ensure only one <h1> exists per page.',
      ],
      codeSnippet: `export default function Page() {
  return (
    <main>
      <h1>Your Primary Page Heading</h1>
      {/* rest of content */}
    </main>
  );
}`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add exactly one <h1> tag to your page.',
        'Place it near the top of your main content area.',
        'Make it descriptive and include your primary keyword.',
      ],
      codeSnippet: `<body>
  <h1>Your Primary Page Heading</h1>
</body>`,
    },
  },

  // SEO-008: Multiple H1s
  'SEO-008': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Review your page in the block editor.',
        'Search for all Heading blocks set to H1.',
        'Keep the most important one as H1.',
        'Change others to H2 or H3 as appropriate.',
        'Check your theme header — it may also output an H1.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Search your HTML for all <h1> tags.',
        'Keep only one <h1> for the page\'s primary topic.',
        'Demote extra H1s to <h2> or lower to maintain hierarchy.',
      ],
    },
  },

  // SEO-010: Missing alt text on images
  'SEO-010': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Go to Media → Library in the WordPress admin.',
        'Click on each image missing alt text.',
        'Enter descriptive alt text in the "Alternative Text" field.',
        'For decorative images, set alt="" (empty string).',
        'Click "Update" to save.',
      ],
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Go to Products → select the product.',
        'Click on the image and enter "Image alt text".',
        'For page images, edit the page HTML and add alt attributes.',
        'For theme images, edit the Liquid template and add alt text.',
      ],
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Find <img> or next/image components missing the alt prop.',
        'Add descriptive alt text to each image.',
        'For decorative images, use alt="".',
      ],
      codeSnippet: `import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Descriptive text about the image"
  width={800}
  height={600}
/>`,
      pluginOrTool: 'next/image',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Find all <img> tags in your HTML.',
        'Add an alt attribute with descriptive text to each.',
        'For decorative images, use alt="" (empty).',
      ],
      codeSnippet: `<img src="photo.jpg" alt="A descriptive explanation of the image" />`,
    },
  },

  // SEO-011: Low internal links
  'SEO-011': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Edit your page/post content.',
        'Identify relevant pages or posts to link to.',
        'Highlight relevant text and use the link button to add internal links.',
        'Aim for 3-5 internal links per page minimum.',
        'Use the Yoast SEO internal linking suggestions if available.',
      ],
      pluginOrTool: 'Yoast SEO (Premium)',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Review your content for opportunities to link to related pages.',
        'Add <a> tags pointing to relevant pages on your site.',
        'Use descriptive anchor text (not "click here").',
        'Aim for at least 3-5 internal links per page.',
      ],
    },
  },

  // SEO-012: Missing canonical tag
  'SEO-012': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Yoast SEO automatically adds canonical tags.',
        'To customize: edit the page → Yoast SEO → Advanced tab.',
        'Set the "Canonical URL" field if the default is incorrect.',
        'For duplicate pages, point the canonical to the preferred URL.',
      ],
      pluginOrTool: 'Yoast SEO',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Shopify adds canonical tags automatically for most pages.',
        'To override, edit theme.liquid and add a canonical link in <head>.',
        'Use Liquid to set the canonical URL dynamically.',
      ],
      codeSnippet: `<link rel="canonical" href="{{ canonical_url }}" />`,
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Add an alternates.canonical field to your metadata export.',
        'For Pages Router, add a <link> tag inside <Head>.',
      ],
      codeSnippet: `// App Router
export const metadata = {
  alternates: {
    canonical: 'https://yoursite.com/page',
  },
};

// Pages Router
<Head>
  <link rel="canonical" href="https://yoursite.com/page" />
</Head>`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add a canonical link tag in your <head> section.',
        'Point it to the preferred version of the URL.',
      ],
      codeSnippet: `<head>
  <link rel="canonical" href="https://yoursite.com/preferred-url" />
</head>`,
    },
  },

  // SEO-013: Noindex set
  'SEO-013': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Edit the page → Yoast SEO → Advanced tab.',
        'Change "Allow search engines to show this page?" to "Yes".',
        'Also check Settings → Reading → "Discourage search engines" is unchecked.',
      ],
      pluginOrTool: 'Yoast SEO',
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Find and remove the noindex meta tag from your <head>.',
        'Check for X-Robots-Tag headers in your server config.',
      ],
      codeSnippet: `<!-- REMOVE this line -->
<meta name="robots" content="noindex" />`,
    },
  },

  // SEO-014: Missing viewport
  'SEO-014': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Most WordPress themes include the viewport tag by default.',
        'If missing, add it to your theme\'s header.php inside <head>.',
        'Or use a child theme to add it safely.',
      ],
    },
    nextjs: {
      platform: 'Next.js',
      steps: [
        'Next.js includes the viewport tag automatically.',
        'If you\'re using a custom _document, ensure it\'s present.',
        'For App Router, export a viewport config.',
      ],
      codeSnippet: `// App Router (app/layout.tsx)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};`,
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Add the viewport meta tag inside <head>.',
      ],
      codeSnippet: `<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>`,
    },
  },

  // SEO-020: Broken link
  'SEO-020': {
    wordpress: {
      platform: 'WordPress',
      steps: [
        'Install the "Broken Link Checker" plugin to scan for all broken links.',
        'Review each broken link in Tools → Broken Links.',
        'Update the URL, remove the link, or redirect the target page.',
        'Consider setting up 301 redirects for moved content using Redirection plugin.',
      ],
      pluginOrTool: 'Broken Link Checker / Redirection',
    },
    shopify: {
      platform: 'Shopify',
      steps: [
        'Go to Online Store → Navigation to review menu links.',
        'Check product and collection pages for broken links in descriptions.',
        'Set up URL redirects: Online Store → Navigation → URL Redirects.',
        'Add a redirect from the broken URL to the correct destination.',
      ],
    },
    generic: {
      platform: 'HTML',
      steps: [
        'Identify the broken link URL from the issue details.',
        'Update the href to the correct URL, or remove the link entirely.',
        'If the target page has moved, set up a 301 redirect on your server.',
      ],
    },
  },
};
