export const categoryDescriptions: Record<string, { name: string; description: string }> = {
  AIREAD: {
    name: "AI Readability",
    description: "How well your content is structured for AI/LLM comprehension. Includes heading hierarchy, semantic HTML, and content organization. This is the most crucial category for AI understanding."
  },
  CHUNK: {
    name: "Content Chunking",
    description: "How well your content fits within AI token windows and embedding systems. Large chunks may be truncated; small chunks lose context. Optimal chunking improves AI processing."
  },
  EXTRACT: {
    name: "Data Extraction",
    description: "Quality of structured data (Schema.org, JSON-LD, microdata). Makes it easier for AI to extract facts, entities, and relationships from your content."
  },
  CRAWL: {
    name: "Crawlability",
    description: "How easily AI crawlers can discover and access your content. Includes robots.txt, sitemaps, canonical URLs, and crawl directives."
  },
  A11Y: {
    name: "Accessibility",
    description: "Accessibility features that also benefit AI: ARIA labels, alt text, semantic markup, keyboard navigation. Accessible content is AI-readable content."
  },
  KG: {
    name: "Knowledge Graph",
    description: "Structured data and knowledge graph implementation using Schema.org vocabularies. Helps AI understand entities and relationships on your page."
  },
  TECH: {
    name: "Technical SEO",
    description: "Technical infrastructure supporting AI crawling: HTML structure, meta tags, canonicals, redirects, and page performance."
  },
  LLMLOCAL: {
    name: "Local LLM",
    description: "Optimization for local/on-device AI models that may have smaller context windows and different processing requirements."
  },
  LLMAPI: {
    name: "API LLM",
    description: "Optimization for cloud-based AI APIs (GPT, Claude, etc.) including API-specific formatting and data structures."
  },
  LLMCONF: {
    name: "LLM Confidence",
    description: "Signals that help AI systems determine confidence in their understanding of your content. Clear, authoritative content scores higher."
  },
  HALL: {
    name: "Hallucination Prevention",
    description: "Measures to prevent AI from generating false information about your content. Includes fact verification, clear attribution, and explicit disclaimers."
  },
  GAPS: {
    name: "Content Gaps",
    description: "Missing information that AI systems might expect or need to fully understand your offering. Filling gaps improves completeness."
  },
  DRIFT: {
    name: "Content Drift",
    description: "Consistency between different representations of your content. Mismatches between title/meta/body can confuse AI systems."
  },
  CI: {
    name: "Citations",
    description: "Proper attribution and citation of sources. Helps AI understand authority and trustworthiness of information."
  },
  DX: {
    name: "Developer Experience",
    description: "Technical elements that affect developers working with AI integrations: APIs, documentation, code examples."
  },
  MISC: {
    name: "Miscellaneous",
    description: "Other optimization opportunities that don't fit into major categories but still affect AI readiness."
  }
};
