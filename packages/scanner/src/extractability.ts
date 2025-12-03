/**
 * Extractability Mapping System
 * 
 * Maps DOM nodes by their extractability characteristics:
 * - Server-side vs client-side rendered
 * - Hidden/interactive content
 * - Iframes and shadow DOM
 * - Overall extractability score
 */

import { CheerioAPI } from 'cheerio';

/**
 * Content source type
 */
export type ContentSource = 
  | 'server-rendered'      // In initial HTML
  | 'client-rendered'      // Likely loaded by JS (heuristic)
  | 'interactive'          // Requires user interaction
  | 'hidden'              // Hidden from view
  | 'iframe'              // In iframe
  | 'shadow-dom'          // In shadow DOM (detected heuristically)
  | 'unknown';

/**
 * Extractability level
 */
export type ExtractabilityLevel = 'easy' | 'moderate' | 'difficult' | 'impossible';

/**
 * Node classification in the extractability map
 */
export interface ExtractableNode {
  selector: string;           // CSS selector
  tagName: string;           // HTML tag
  source: ContentSource;     // How content is delivered
  extractability: ExtractabilityLevel; // How easy to extract
  textLength: number;        // Amount of text
  hasText: boolean;          // Contains meaningful text
  isHidden: boolean;         // Hidden via CSS/attributes
  requiresInteraction: boolean; // Needs click/hover/etc
  isNested: boolean;         // Inside iframe/shadow DOM
  attributes: {              // Relevant attributes
    id?: string;
    class?: string;
    role?: string;
    'aria-hidden'?: string;
    'data-lazy'?: string;
  };
  children: number;          // Number of child elements
  depth: number;             // Depth in DOM tree
}

/**
 * Complete extractability map
 */
export interface ExtractabilityMap {
  nodes: ExtractableNode[];
  summary: {
    totalNodes: number;
    extractableNodes: number;
    hiddenNodes: number;
    interactiveNodes: number;
    iframeNodes: number;
    clientRenderedNodes: number;
    serverRenderedNodes: number;
  };
  score: {
    extractabilityScore: number;  // 0-100, higher is better
    serverRenderedPercent: number;
    hiddenContentPercent: number;
    interactiveContentPercent: number;
    iframeContentPercent: number;
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    count: number;
  }>;
  recommendations: string[];
}

/**
 * Detect if element is likely client-rendered (heuristic-based)
 */
function detectClientRendered($: CheerioAPI, element: any): boolean {
  const $el = $(element);
  
  // Check for common JS framework attributes
  const frameworkAttrs = [
    'data-react-root',
    'data-reactroot',
    'ng-app',
    'ng-controller',
    'v-app',
    'data-vue-app',
    '[id^="__next"]',
    '[id^="__nuxt"]',
    'data-gatsby',
    'data-svelte'
  ];
  
  for (const attr of frameworkAttrs) {
    if ($el.is(attr) || $el.closest(attr).length > 0) {
      return true;
    }
  }
  
  // Check if empty container with data attributes (common for JS apps)
  const hasDataAttrs = Object.keys($el.attr() || {}).some(k => k.startsWith('data-'));
  const isEmpty = $el.text().trim().length === 0 && $el.children().length === 0;
  
  if (hasDataAttrs && isEmpty) {
    return true;
  }
  
  // Check for common client-render container IDs
  const id = $el.attr('id');
  if (id && ['root', 'app', 'main-app', '__next', '__nuxt'].includes(id)) {
    return true;
  }
  
  return false;
}

/**
 * Detect if element is hidden
 */
function isHidden($: CheerioAPI, element: any): boolean {
  const $el = $(element);
  
  // CSS visibility
  const style = $el.attr('style') || '';
  if (
    style.includes('display:none') ||
    style.includes('display: none') ||
    style.includes('visibility:hidden') ||
    style.includes('visibility: hidden') ||
    style.includes('opacity:0') ||
    style.includes('opacity: 0')
  ) {
    return true;
  }
  
  // Attributes
  if ($el.attr('aria-hidden') === 'true' || $el.attr('hidden') !== undefined) {
    return true;
  }
  
  // Common hidden classes
  const classNames = $el.attr('class') || '';
  if (/(^|\s)(hidden|invisible|d-none|sr-only|visually-hidden)(\s|$)/.test(classNames)) {
    return true;
  }
  
  return false;
}

/**
 * Detect if element requires interaction
 */
function requiresInteraction($: CheerioAPI, element: any): boolean {
  const $el = $(element);
  
  // Check for interactive attributes
  const interactiveAttrs = [
    'onclick',
    'onhover',
    'data-toggle',
    'data-dropdown',
    'data-modal',
    'data-accordion'
  ];
  
  for (const attr of interactiveAttrs) {
    if ($el.attr(attr)) {
      return true;
    }
  }
  
  // Check for interactive roles
  const role = $el.attr('role');
  if (role && ['button', 'tab', 'menu', 'menuitem', 'tooltip', 'dialog'].includes(role)) {
    return true;
  }
  
  // Check for details/summary (requires click)
  if ($el.is('details') && !$el.attr('open')) {
    return true;
  }
  
  return false;
}

/**
 * Detect shadow DOM presence (heuristic - can't actually access shadow DOM from HTML)
 */
function hasShadowDOM($: CheerioAPI, element: any): boolean {
  const $el = $(element);
  
  // Web components typically have custom element names with hyphens
  const tagName = (element as any).tagName?.toLowerCase() || '';
  if (tagName.includes('-')) {
    return true;
  }
  
  // Check for common shadow DOM host attributes
  const hasShadowAttr = $el.attr('shadowroot') !== undefined;
  
  return hasShadowAttr;
}

/**
 * Calculate extractability level for a node
 */
function calculateExtractability(node: Partial<ExtractableNode>): ExtractabilityLevel {
  // Impossible: hidden or in shadow DOM
  if (node.source === 'shadow-dom' || (node.isHidden && !node.hasText)) {
    return 'impossible';
  }
  
  // Difficult: requires interaction or in iframe
  if (node.requiresInteraction || node.source === 'iframe') {
    return 'difficult';
  }
  
  // Moderate: client-rendered or partially hidden
  if (node.source === 'client-rendered' || node.isHidden) {
    return 'moderate';
  }
  
  // Easy: server-rendered and visible
  return 'easy';
}

/**
 * Get element depth in DOM
 */
function getDepth($: CheerioAPI, element: any): number {
  let depth = 0;
  let current = $(element);
  
  while (current.parent().length > 0 && depth < 100) { // Max depth 100 to prevent infinite loops
    current = current.parent();
    depth++;
  }
  
  return depth;
}

/**
 * Build extractability map for a page
 */
export function buildExtractabilityMap($: CheerioAPI, options: {
  maxNodes?: number;
  includeHidden?: boolean;
  minTextLength?: number;
} = {}): ExtractabilityMap {
  const {
    maxNodes = 1000,
    includeHidden = true,
    minTextLength = 10
  } = options;
  
  const nodes: ExtractableNode[] = [];
  const summary = {
    totalNodes: 0,
    extractableNodes: 0,
    hiddenNodes: 0,
    interactiveNodes: 0,
    iframeNodes: 0,
    clientRenderedNodes: 0,
    serverRenderedNodes: 0
  };
  
  // Analyze main content elements
  const contentSelectors = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'article', 'section', 'main', 'div',
    'span', 'li', 'td', 'th',
    'blockquote', 'pre', 'code'
  ];
  
  const elements = $(contentSelectors.join(', ')).toArray();
  
  for (const element of elements.slice(0, maxNodes)) {
    const $el = $(element);
    const text = $el.text().trim();
    const textLength = text.length;
    
    // Skip if too little text and not including hidden
    if (textLength < minTextLength && !includeHidden) {
      continue;
    }
    
    const tagName = (element as any).tagName?.toLowerCase() || 'element';
    const hidden = isHidden($, element);
    const interactive = requiresInteraction($, element);
    const shadowDOM = hasShadowDOM($, element);
    const clientRendered = detectClientRendered($, element);
    const inIframe = $el.closest('iframe').length > 0;
    
    // Determine source
    let source: ContentSource = 'server-rendered';
    if (shadowDOM) source = 'shadow-dom';
    else if (inIframe) source = 'iframe';
    else if (interactive) source = 'interactive';
    else if (hidden) source = 'hidden';
    else if (clientRendered) source = 'client-rendered';
    
    // Build node
    const node: Partial<ExtractableNode> = {
      selector: generateSelector($, element),
      tagName,
      source,
      textLength,
      hasText: textLength > 0,
      isHidden: hidden,
      requiresInteraction: interactive,
      isNested: inIframe || shadowDOM,
      attributes: {
        id: $el.attr('id'),
        class: $el.attr('class'),
        role: $el.attr('role'),
        'aria-hidden': $el.attr('aria-hidden'),
        'data-lazy': $el.attr('data-lazy')
      },
      children: $el.children().length,
      depth: getDepth($, element)
    };
    
    node.extractability = calculateExtractability(node);
    
    nodes.push(node as ExtractableNode);
    
    // Update summary
    summary.totalNodes++;
    if (node.extractability === 'easy' || node.extractability === 'moderate') {
      summary.extractableNodes++;
    }
    if (hidden) summary.hiddenNodes++;
    if (interactive) summary.interactiveNodes++;
    if (inIframe) summary.iframeNodes++;
    if (clientRendered) summary.clientRenderedNodes++;
    if (source === 'server-rendered') summary.serverRenderedNodes++;
  }
  
  // Calculate scores
  const extractabilityScore = summary.totalNodes > 0
    ? Math.round((summary.extractableNodes / summary.totalNodes) * 100)
    : 0;
  
  const serverRenderedPercent = summary.totalNodes > 0
    ? Math.round((summary.serverRenderedNodes / summary.totalNodes) * 100)
    : 0;
  
  const hiddenContentPercent = summary.totalNodes > 0
    ? Math.round((summary.hiddenNodes / summary.totalNodes) * 100)
    : 0;
  
  const interactiveContentPercent = summary.totalNodes > 0
    ? Math.round((summary.interactiveNodes / summary.totalNodes) * 100)
    : 0;
  
  const iframeContentPercent = summary.totalNodes > 0
    ? Math.round((summary.iframeNodes / summary.totalNodes) * 100)
    : 0;
  
  // Identify issues
  const issues: ExtractabilityMap['issues'] = [];
  
  if (hiddenContentPercent > 20) {
    issues.push({
      type: 'hidden-content',
      severity: 'medium',
      description: `${hiddenContentPercent}% of content is hidden from view`,
      count: summary.hiddenNodes
    });
  }
  
  if (interactiveContentPercent > 30) {
    issues.push({
      type: 'interactive-content',
      severity: 'high',
      description: `${interactiveContentPercent}% of content requires user interaction`,
      count: summary.interactiveNodes
    });
  }
  
  if (iframeContentPercent > 10) {
    issues.push({
      type: 'iframe-content',
      severity: 'medium',
      description: `${iframeContentPercent}% of content is in iframes`,
      count: summary.iframeNodes
    });
  }
  
  if (serverRenderedPercent < 50) {
    issues.push({
      type: 'client-rendered',
      severity: 'high',
      description: `Only ${serverRenderedPercent}% of content is server-rendered`,
      count: summary.clientRenderedNodes
    });
  }
  
  // Check for noscript content
  const noscriptElements = $('noscript');
  if (noscriptElements.length > 0) {
    issues.push({
      type: 'noscript-fallback',
      severity: 'low',
      description: 'Page has noscript fallback content',
      count: noscriptElements.length
    });
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (extractabilityScore < 70) {
    recommendations.push('Improve content extractability by reducing client-side rendering and hidden content');
  }
  
  if (hiddenContentPercent > 20) {
    recommendations.push('Reduce hidden content or provide alternative accessible versions');
  }
  
  if (interactiveContentPercent > 30) {
    recommendations.push('Make interactive content accessible without JavaScript or provide server-rendered alternatives');
  }
  
  if (iframeContentPercent > 10) {
    recommendations.push('Minimize iframe usage or provide alternative content representations');
  }
  
  if (serverRenderedPercent < 50) {
    recommendations.push('Increase server-side rendering for better AI/bot accessibility');
  }
  
  return {
    nodes,
    summary,
    score: {
      extractabilityScore,
      serverRenderedPercent,
      hiddenContentPercent,
      interactiveContentPercent,
      iframeContentPercent
    },
    issues,
    recommendations
  };
}

/**
 * Generate a CSS selector for an element
 */
function generateSelector($: CheerioAPI, element: any): string {
  const $el = $(element);
  const id = $el.attr('id');
  
  if (id) {
    return `#${id}`;
  }
  
  const tagName = (element as any).tagName?.toLowerCase() || 'element';
  const className = $el.attr('class')?.split(' ')[0];
  
  if (className) {
    return `${tagName}.${className}`;
  }
  
  // Use nth-child as fallback
  const index = $el.index();
  return `${tagName}:nth-child(${index + 1})`;
}

/**
 * Analyze extractability for specific content types
 */
export function analyzeContentTypeExtractability($: CheerioAPI): {
  text: { extractable: number; total: number; percentage: number };
  images: { extractable: number; total: number; percentage: number };
  links: { extractable: number; total: number; percentage: number };
  structured: { extractable: number; total: number; percentage: number };
} {
  // Text content
  const textElements = $('p, h1, h2, h3, h4, h5, h6, li, td, th').toArray();
  const extractableText = textElements.filter(el => !isHidden($, el)).length;
  
  // Images
  const images = $('img').toArray();
  const extractableImages = images.filter(el => {
    const $el = $(el);
    return !isHidden($, el) && $el.attr('alt');
  }).length;
  
  // Links
  const links = $('a[href]').toArray();
  const extractableLinks = links.filter(el => !isHidden($, el)).length;
  
  // Structured data
  const structured = $('table, ul, ol, dl').toArray();
  const extractableStructured = structured.filter(el => !isHidden($, el)).length;
  
  return {
    text: {
      extractable: extractableText,
      total: textElements.length,
      percentage: textElements.length > 0 ? Math.round((extractableText / textElements.length) * 100) : 0
    },
    images: {
      extractable: extractableImages,
      total: images.length,
      percentage: images.length > 0 ? Math.round((extractableImages / images.length) * 100) : 0
    },
    links: {
      extractable: extractableLinks,
      total: links.length,
      percentage: links.length > 0 ? Math.round((extractableLinks / links.length) * 100) : 0
    },
    structured: {
      extractable: extractableStructured,
      total: structured.length,
      percentage: structured.length > 0 ? Math.round((extractableStructured / structured.length) * 100) : 0
    }
  };
}
