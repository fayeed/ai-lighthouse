/**
 * Named Entity Extraction
 * 
 * Extracts named entities (organizations, products, people, dates, numbers)
 * from content with confidence scores and locators.
 * 
 * Features:
 * - Rule-based regex extraction (fast, no API required)
 * - Optional LLM enrichment for better recall and context
 * - Schema field mapping for structured data
 * - Confidence scoring based on context signals
 * - Precise text locators for verification
 */

import { CheerioAPI } from 'cheerio';
import { LLMRunner, LLMConfig } from './runner.js';
import { safeJSONParse } from './helpers.js';

export type EntityType = 
  | 'organization' 
  | 'product' 
  | 'person' 
  | 'date' 
  | 'number' 
  | 'location' 
  | 'email' 
  | 'url' 
  | 'phone';

export interface Entity {
  name: string;
  type: EntityType;
  confidence: number; // 0-1
  locator: {
    selector?: string;      // CSS selector where found
    textSnippet: string;    // Surrounding context (50 chars before/after)
    position: number;       // Character position in text
  };
  metadata?: {
    normalized?: string;    // Normalized form (e.g., date ISO format)
    schemaField?: string;   // Mapped schema.org field
    context?: string;       // Semantic context from surrounding text
    source?: 'regex' | 'llm' | 'schema';
  };
}

export interface EntityExtractionResult {
  entities: Entity[];
  summary: {
    totalEntities: number;
    byType: Record<EntityType, number>;
    highConfidence: number;  // count with confidence >= 0.8
    mediumConfidence: number; // count with confidence >= 0.5
    lowConfidence: number;    // count with confidence < 0.5
  };
  schemaMapping?: Record<string, Entity[]>; // Schema fields → entities
}

/**
 * Extract clean text content from HTML
 */
function extractTextContent($: CheerioAPI): string {
  // Clone the DOM
  const html = $.html();
  const cloned = $.load(html);
  
  // Remove non-content elements
  cloned('script').remove();
  cloned('style').remove();
  cloned('noscript').remove();
  cloned('svg').remove();
  cloned('iframe').remove();
  cloned('nav').remove();
  cloned('header').remove();
  cloned('footer').remove();
  cloned('aside').remove();
  
  // Get main content
  const main = cloned('main, article, [role="main"]');
  if (main.length > 0) {
    return main.text();
  }
  
  const body = cloned('body');
  if (body.length > 0) {
    return body.text();
  }
  
  return cloned.root().text();
}

/**
 * Get context snippet around a position
 */
function getContextSnippet(text: string, position: number, match: string): string {
  const beforeLen = 50;
  const afterLen = 50;
  
  const start = Math.max(0, position - beforeLen);
  const end = Math.min(text.length, position + match.length + afterLen);
  
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate confidence based on context signals
 */
function calculateConfidence(
  match: string,
  context: string,
  type: EntityType,
  signals: {
    hasCapitalization?: boolean;
    hasContextKeyword?: boolean;
    matchesPattern?: boolean;
    lengthAppropriate?: boolean;
  }
): number {
  let confidence = 0.5; // Base confidence
  
  // Type-specific adjustments
  if (type === 'date' || type === 'number' || type === 'email' || type === 'url' || type === 'phone') {
    confidence = 0.9; // Pattern-based entities are highly reliable
  }
  
  // Capitalization signal (for names)
  if (signals.hasCapitalization && (type === 'organization' || type === 'person' || type === 'product')) {
    confidence += 0.15;
  }
  
  // Context keyword signal
  if (signals.hasContextKeyword) {
    confidence += 0.2;
  }
  
  // Pattern match quality
  if (signals.matchesPattern) {
    confidence += 0.1;
  }
  
  // Length appropriateness
  if (signals.lengthAppropriate) {
    confidence += 0.05;
  }
  
  return Math.min(1.0, confidence);
}

/**
 * Extract only unambiguous structured data using regex (emails, phones, URLs)
 * These don't benefit from LLM and are better handled with patterns
 */
function extractStructuredEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();
  
  // 1. EMAIL ADDRESSES
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  let match;
  while ((match = emailPattern.exec(text)) !== null) {
    const email = match[1];
    const key = `email:${email.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      
      entities.push({
        name: email,
        type: 'email',
        confidence: 0.95,
        locator: {
          textSnippet: getContextSnippet(text, match.index, email),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'email'
        }
      });
    }
  }
  
  // 2. URLS
  const urlPattern = /\b(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[1];
    const key = `url:${url.toLowerCase()}`;
    
    if (!seen.has(key) && url.length <= 200) {
      seen.add(key);
      
      entities.push({
        name: url,
        type: 'url',
        confidence: 0.95,
        locator: {
          textSnippet: getContextSnippet(text, match.index, url),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'url'
        }
      });
    }
  }
  
  // 3. PHONE NUMBERS
  const phonePatterns = [
    // US: (555) 123-4567, 555-123-4567
    /\b(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
    // International: +1-555-123-4567, +44 20 1234 5678
    /\b(\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})\b/g,
  ];
  
  for (const pattern of phonePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const phone = match[1];
      const key = `phone:${phone.replace(/\D/g, '')}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        
        const hasContextKeyword = /(?:phone|call|contact|tel|telephone|mobile|cell)/i
          .test(text.slice(Math.max(0, match.index - 100), match.index + 100));
        
        entities.push({
          name: phone,
          type: 'phone',
          confidence: hasContextKeyword ? 0.9 : 0.7,
          locator: {
            textSnippet: getContextSnippet(text, match.index, phone),
            position: match.index
          },
          metadata: {
            source: 'regex',
            schemaField: 'telephone',
            context: hasContextKeyword ? 'contact information' : undefined
          }
        });
      }
    }
  }
  
  return entities;
}

/**
 * Legacy regex extraction - kept for fallback but NOT recommended
 * Use LLM extraction instead for better accuracy
 * @deprecated Use extractEntitiesWithLLM instead
 */
function extractEntitiesWithRegex_DEPRECATED(text: string, $: CheerioAPI): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();
  
  // Only extract dates and numbers - these are somewhat reliable
  
  // DATE PATTERNS
  let dateMatch;
  const datePatterns = [
    // ISO dates: 2023-12-01, 2023/12/01
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
    // US dates: 12/31/2023, 12-31-2023
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/g,
    // Written dates: January 1, 2023 | Jan 1, 2023 | 1 Jan 2023
    /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/gi,
    // Year ranges: 2020-2023
    /\b(\d{4}\s*[-–—]\s*\d{4})\b/g,
  ];
  
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateStr = match[1];
      const key = `date:${dateStr.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        
        const hasContextKeyword = /(?:date|time|year|month|published|updated|founded|established|since|created|released)/i
          .test(text.slice(Math.max(0, match.index - 100), match.index + 100));
        
        entities.push({
          name: dateStr,
          type: 'date',
          confidence: calculateConfidence(dateStr, text.slice(match.index - 50, match.index + 50), 'date', {
            matchesPattern: true,
            hasContextKeyword,
            lengthAppropriate: dateStr.length >= 4
          }),
          locator: {
            textSnippet: getContextSnippet(text, match.index, dateStr),
            position: match.index
          },
          metadata: {
            source: 'regex',
            context: hasContextKeyword ? 'temporal context' : undefined
          }
        });
      }
    }
  }
  
  // 2. NUMBER PATTERNS (with context)
  const numberPatterns = [
    // Currency: $1,234.56, €1.234,56, £1,234
    { pattern: /\b([€$£¥₹]\s*[\d,]+(?:\.\d{2})?)\b/g, context: 'price' },
    // Percentages: 45%, 99.5%
    { pattern: /\b(\d+(?:\.\d+)?%)\b/g, context: 'percentage' },
    // Large numbers with units: 1.5M, 2.3B, 100K
    { pattern: /\b(\d+(?:\.\d+)?[KMB](?:\+)?)\b/gi, context: 'metric' },
    // Version numbers: v1.2.3, 2.0.1
    { pattern: /\b(v?\d+\.\d+(?:\.\d+)?)\b/gi, context: 'version' },
    // Generic numbers with commas: 1,234,567
    { pattern: /\b(\d{1,3}(?:,\d{3})+)\b/g, context: 'quantity' },
  ];
  
  for (const { pattern, context: numberContext } of numberPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numStr = match[1];
      const key = `number:${numStr.toLowerCase()}:${numberContext}`;
      
      if (!seen.has(key) && numStr.length <= 20) { // Reasonable length
        seen.add(key);
        
        const hasContextKeyword = /(?:count|total|amount|number|quantity|size|value|rate|score|rating)/i
          .test(text.slice(Math.max(0, match.index - 100), match.index + 100));
        
        entities.push({
          name: numStr,
          type: 'number',
          confidence: calculateConfidence(numStr, text.slice(match.index - 50, match.index + 50), 'number', {
            matchesPattern: true,
            hasContextKeyword,
            lengthAppropriate: true
          }),
          locator: {
            textSnippet: getContextSnippet(text, match.index, numStr),
            position: match.index
          },
          metadata: {
            source: 'regex',
            context: numberContext
          }
        });
      }
    }
  }
  
  // 3. EMAIL ADDRESSES
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  let match;
  while ((match = emailPattern.exec(text)) !== null) {
    const email = match[1];
    const key = `email:${email.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      
      entities.push({
        name: email,
        type: 'email',
        confidence: 0.95,
        locator: {
          textSnippet: getContextSnippet(text, match.index, email),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'email'
        }
      });
    }
  }
  
  // 4. URLS
  const urlPattern = /\b(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[1];
    const key = `url:${url.toLowerCase()}`;
    
    if (!seen.has(key) && url.length <= 200) { // Reasonable URL length
      seen.add(key);
      
      entities.push({
        name: url,
        type: 'url',
        confidence: 0.95,
        locator: {
          textSnippet: getContextSnippet(text, match.index, url),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'url'
        }
      });
    }
  }
  
  // 5. PHONE NUMBERS
  const phonePatterns = [
    // US: (555) 123-4567, 555-123-4567
    /\b(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
    // International: +1-555-123-4567, +44 20 1234 5678
    /\b(\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})\b/g,
  ];
  
  for (const pattern of phonePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const phone = match[1];
      const key = `phone:${phone.replace(/\D/g, '')}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        
        const hasContextKeyword = /(?:phone|call|contact|tel|telephone|mobile|cell)/i
          .test(text.slice(Math.max(0, match.index - 100), match.index + 100));
        
        entities.push({
          name: phone,
          type: 'phone',
          confidence: hasContextKeyword ? 0.9 : 0.7,
          locator: {
            textSnippet: getContextSnippet(text, match.index, phone),
            position: match.index
          },
          metadata: {
            source: 'regex',
            schemaField: 'telephone',
            context: hasContextKeyword ? 'contact information' : undefined
          }
        });
      }
    }
  }
  
  // 6. ORGANIZATIONS (capitalized multi-word phrases near keywords)
  const orgPattern = /\b([A-Z][a-z]+(?:\s+(?:and|&|of|the|for)?\s*[A-Z][a-z]+)+(?:\s+(?:Inc|LLC|Ltd|Corp|Co|Group|Company|Corporation|Foundation|Institute|University|College|Agency|Department|Organization))?)(?=\s|[,.]|\b)/g;
  
  while ((match = orgPattern.exec(text)) !== null) {
    const org = match[1];
    const key = `org:${org.toLowerCase()}`;
    
    // Filter out common false positives
    if (!seen.has(key) && 
        org.length >= 4 && 
        org.length <= 100 &&
        !/^(This|That|These|Those|There|What|When|Where|Which|How|Why|The|And|But|Or)\b/i.test(org)) {
      seen.add(key);
      
      const hasContextKeyword = /(?:company|corporation|organization|agency|founded|headquartered|based in|established|operates|provides|offers|develops|builds|creates)/i
        .test(text.slice(Math.max(0, match.index - 150), match.index + 150));
      
      const hasOrgSuffix = /(?:Inc|LLC|Ltd|Corp|Co|Group|Company|Corporation|Foundation|Institute|University|College|Agency|Department|Organization)$/i.test(org);
      
      entities.push({
        name: org,
        type: 'organization',
        confidence: calculateConfidence(org, text.slice(match.index - 50, match.index + 50), 'organization', {
          hasCapitalization: true,
          hasContextKeyword,
          matchesPattern: hasOrgSuffix,
          lengthAppropriate: org.length >= 4 && org.length <= 50
        }),
        locator: {
          textSnippet: getContextSnippet(text, match.index, org),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'organization',
          context: hasContextKeyword ? 'organizational context' : undefined
        }
      });
    }
  }
  
  // 7. PRODUCTS (multi-word capitalized phrases or branded names)
  // More conservative: require either multi-word names OR specific product indicators
  const productPattern = /\b([A-Z][a-z]+(?:\s+(?:for|and|&|the)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const productIndicators = /(?:™|®|©|\bv\d+\.\d+|\bversion\s+\d|\bpro\b|\bplus\b|\bpremium\b|\benterprise\b|\bstarter\b|\bbasic\b)/i;
  
  while ((match = productPattern.exec(text)) !== null) {
    const product = match[1];
    const key = `product:${product.toLowerCase()}`;
    
    // Skip if too short, common words, or already seen
    if (product.length < 5 || 
        seen.has(key) || 
        seen.has(`org:${product.toLowerCase()}`) ||
        /^(This|That|These|Those|There|What|When|Where|Which|How|Why|The|And|But|Or|With|From|Into|About|Your|Our|All|Some|Many|More|Most|Each|Every|Other|Such|Only|Very|Even|Just|Much|Enter|Learn|Start|Get|Make|Take|Give|Find|Know|Think|Tell|Feel|Leave|Put|Mean|Keep|Let|Begin|Seem|Help|Talk|Turn|Show|Try|Call|Ask|Need|Want|Use|Work|Move|Live|Believe|Hold|Bring|Happen|Write|Provide|Sit|Stand|Lose|Pay|Meet|Include|Continue|Set|Learn|Change|Lead|Understand|Watch|Follow|Stop|Create|Speak|Read|Allow|Add|Spend|Grow|Open|Walk|Win|Offer|Remember|Love|Consider|Appear|Buy|Wait|Serve|Die|Send|Expect|Build|Stay|Fall|Cut|Reach|Kill|Remain|Suggest|Raise|Pass|Sell|Require|Report|Decide|Pull)\b/i.test(product)) {
      continue;
    }
    
    const context = text.slice(Math.max(0, match.index - 150), match.index + 150);
    
    // Check for product-specific signals
    const hasProductKeyword = /(?:introducing|announcing|launched|released|new product|our product|this product|software|application|app|platform|tool|solution|system|device|service offering)/i.test(context);
    const hasProductIndicator = productIndicators.test(product) || productIndicators.test(context);
    const hasMultipleWords = product.split(/\s+/).length >= 2;
    
    // Require strong signals: multi-word name OR product indicators OR explicit product keywords
    if (hasMultipleWords || hasProductIndicator || hasProductKeyword) {
      seen.add(key);
      
      const confidence = calculateConfidence(product, context, 'product', {
        hasCapitalization: true,
        hasContextKeyword: hasProductKeyword || hasProductIndicator,
        lengthAppropriate: product.length >= 5 && product.length <= 40,
        matchesPattern: hasMultipleWords || hasProductIndicator
      });
      
      // Only add if confidence is reasonable
      if (confidence >= 0.6) {
        entities.push({
          name: product,
          type: 'product',
          confidence,
          locator: {
            textSnippet: getContextSnippet(text, match.index, product),
            position: match.index
          },
          metadata: {
            source: 'regex',
            schemaField: 'product',
            context: 'product context'
          }
        });
      }
    }
  }
  
  // 8. PEOPLE (Name patterns: First Last, First Middle Last)
  const personPattern = /\b([A-Z][a-z]+\s+(?:[A-Z][a-z]+\s+)?[A-Z][a-z]+)\b/g;
  
  while ((match = personPattern.exec(text)) !== null) {
    const person = match[1];
    const key = `person:${person.toLowerCase()}`;
    
    const context = text.slice(Math.max(0, match.index - 150), match.index + 150);
    
    // Check for person-specific keywords
    const hasPersonKeyword = /(?:CEO|CTO|founder|director|president|author|created by|written by|designed by|developed by|Mr\.|Mrs\.|Ms\.|Dr\.|Professor)/i.test(context);
    
    // Not already captured as org/product and has person signals
    if (!seen.has(key) && 
        !seen.has(`org:${person.toLowerCase()}`) &&
        !seen.has(`product:${person.toLowerCase()}`) &&
        person.length >= 6 && 
        person.length <= 40 &&
        hasPersonKeyword) {
      seen.add(key);
      
      entities.push({
        name: person,
        type: 'person',
        confidence: calculateConfidence(person, context, 'person', {
          hasCapitalization: true,
          hasContextKeyword: hasPersonKeyword,
          lengthAppropriate: person.length >= 6 && person.length <= 30
        }),
        locator: {
          textSnippet: getContextSnippet(text, match.index, person),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'author',
          context: 'person context'
        }
      });
    }
  }
  
  // 9. LOCATIONS (City, State/Country patterns)
  const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  
  while ((match = locationPattern.exec(text)) !== null) {
    const location = match[0]; // Full match: "San Francisco, CA"
    const key = `location:${location.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      
      const hasLocationKeyword = /(?:located|based|headquarters|office|address|city|state|country|region)/i
        .test(text.slice(Math.max(0, match.index - 100), match.index + 100));
      
      entities.push({
        name: location,
        type: 'location',
        confidence: calculateConfidence(location, text.slice(match.index - 50, match.index + 50), 'location', {
          hasCapitalization: true,
          hasContextKeyword: hasLocationKeyword,
          matchesPattern: true,
          lengthAppropriate: true
        }),
        locator: {
          textSnippet: getContextSnippet(text, match.index, location),
          position: match.index
        },
        metadata: {
          source: 'regex',
          schemaField: 'location',
          context: hasLocationKeyword ? 'geographical context' : undefined
        }
      });
    }
  }
  
  return entities;
}

/**
 * Extract entities from schema.org JSON-LD
 */
function extractEntitiesFromSchema($: CheerioAPI): Entity[] {
  const entities: Entity[] = [];
  const scripts = $('script[type="application/ld+json"]');
  
  scripts.each((_, elem) => {
    try {
      const content = $(elem).html();
      if (!content) return;
      
      const data = safeJSONParse(content, 'Schema.org JSON-LD');
      const schemas = Array.isArray(data) ? data : [data];
      
      for (const schema of schemas) {
        // Extract organization
        if (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') {
          if (schema.name) {
            entities.push({
              name: schema.name,
              type: 'organization',
              confidence: 1.0,
              locator: {
                selector: 'script[type="application/ld+json"]',
                textSnippet: `Schema.org ${schema['@type']}`,
                position: 0
              },
              metadata: {
                source: 'schema',
                schemaField: 'name',
                normalized: schema.name
              }
            });
          }
          
          if (schema.email) {
            entities.push({
              name: schema.email,
              type: 'email',
              confidence: 1.0,
              locator: {
                selector: 'script[type="application/ld+json"]',
                textSnippet: 'Schema.org email',
                position: 0
              },
              metadata: {
                source: 'schema',
                schemaField: 'email'
              }
            });
          }
          
          if (schema.telephone) {
            entities.push({
              name: schema.telephone,
              type: 'phone',
              confidence: 1.0,
              locator: {
                selector: 'script[type="application/ld+json"]',
                textSnippet: 'Schema.org telephone',
                position: 0
              },
              metadata: {
                source: 'schema',
                schemaField: 'telephone'
              }
            });
          }
          
          if (schema.address && typeof schema.address === 'object') {
            const addr = schema.address;
            const locationStr = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry]
              .filter(Boolean)
              .join(', ');
            
            if (locationStr) {
              entities.push({
                name: locationStr,
                type: 'location',
                confidence: 1.0,
                locator: {
                  selector: 'script[type="application/ld+json"]',
                  textSnippet: 'Schema.org address',
                  position: 0
                },
                metadata: {
                  source: 'schema',
                  schemaField: 'address'
                }
              });
            }
          }
        }
        
        // Extract product
        if (schema['@type'] === 'Product') {
          if (schema.name) {
            entities.push({
              name: schema.name,
              type: 'product',
              confidence: 1.0,
              locator: {
                selector: 'script[type="application/ld+json"]',
                textSnippet: 'Schema.org Product',
                position: 0
              },
              metadata: {
                source: 'schema',
                schemaField: 'name'
              }
            });
          }
          
          if (schema.offers && typeof schema.offers === 'object') {
            const offer = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
            if (offer.price) {
              const priceStr = `${offer.priceCurrency || '$'}${offer.price}`;
              entities.push({
                name: priceStr,
                type: 'number',
                confidence: 1.0,
                locator: {
                  selector: 'script[type="application/ld+json"]',
                  textSnippet: 'Schema.org price',
                  position: 0
                },
                metadata: {
                  source: 'schema',
                  schemaField: 'price',
                  context: 'price',
                  normalized: offer.price.toString()
                }
              });
            }
          }
        }
        
        // Extract person/author
        if (schema['@type'] === 'Person' || (schema.author && typeof schema.author === 'object')) {
          const person = schema['@type'] === 'Person' ? schema : schema.author;
          if (person.name) {
            entities.push({
              name: person.name,
              type: 'person',
              confidence: 1.0,
              locator: {
                selector: 'script[type="application/ld+json"]',
                textSnippet: 'Schema.org Person/Author',
                position: 0
              },
              metadata: {
                source: 'schema',
                schemaField: 'author'
              }
            });
          }
        }
        
        // Extract dates
        if (schema.datePublished) {
          entities.push({
            name: schema.datePublished,
            type: 'date',
            confidence: 1.0,
            locator: {
              selector: 'script[type="application/ld+json"]',
              textSnippet: 'Schema.org datePublished',
              position: 0
            },
            metadata: {
              source: 'schema',
              schemaField: 'datePublished',
              normalized: schema.datePublished
            }
          });
        }
        
        if (schema.dateModified) {
          entities.push({
            name: schema.dateModified,
            type: 'date',
            confidence: 1.0,
            locator: {
              selector: 'script[type="application/ld+json"]',
              textSnippet: 'Schema.org dateModified',
              position: 0
            },
            metadata: {
              source: 'schema',
              schemaField: 'dateModified',
              normalized: schema.dateModified
            }
          });
        }
      }
    } catch (err) {
      // Ignore invalid JSON-LD
    }
  });
  
  return entities;
}

/**
 * Extract entities using LLM
 * Primary method for semantic entity extraction
 */
async function extractEntitiesWithLLM(
  text: string,
  llmConfig: LLMConfig
): Promise<Entity[]> {
  const runner = new LLMRunner(llmConfig);
  
  // Prepare context (first 4000 chars to stay within token limits)
  const context = text.slice(0, 4000);
  
  const prompt = `Analyze this content and extract ALL named entities. Be comprehensive but accurate.

For each entity found, provide:
1. The entity name (exact text as it appears)
2. Entity type: organization, product, person, date, number, or location
3. Confidence score (0.0-1.0) - how certain you are this is a real entity
4. Brief context (why this is an entity, what role it plays)

Content:
"""
${context}
"""

Return ONLY a JSON array with this structure (no other text):
[
  {
    "name": "TechCorp Inc",
    "type": "organization",
    "confidence": 0.95,
    "context": "Company mentioned as developer of the platform"
  },
  {
    "name": "CloudMaster Pro",
    "type": "product",
    "confidence": 0.9,
    "context": "Software product being described"
  }
]

Guidelines:
- Organizations: Companies, agencies, foundations, universities
- Products: Software, apps, platforms, devices, services (NOT single generic words like "Code" or "Learn")
- People: Full names with titles/roles (CEO, founder, author, Dr., etc.)
- Dates: Specific dates, year ranges, time periods
- Numbers: Prices, percentages, metrics, statistics (with units/context)
- Locations: Cities, countries, addresses, regions

IMPORTANT: 
- DO NOT extract single common words as products (e.g., "With", "Enter", "Code", "Learn")
- Only extract products that are clearly branded names or multi-word product names
- Skip navigation items and generic UI text
- Focus on meaningful content entities

Return ONLY the JSON array, nothing else.`;

  try {
    const response = await runner.callWithSystem(
      'You are an expert at named entity recognition. Extract entities accurately and return valid JSON only.',
      prompt,
      {
        maxTokens: 2500,
        temperature: 0.2 // Lower temperature for more consistent extraction
      }
    );
    
    // Parse LLM response
    let llmEntities = safeJSONParse(response.content, 'LLM entity extraction');
    
    if (!Array.isArray(llmEntities)) {
      console.error('LLM returned non-array response');
      return [];
    }
    
    // Convert to Entity format
    const entities: Entity[] = [];
    
    for (const llmEntity of llmEntities) {
      if (!llmEntity.name || !llmEntity.type || !llmEntity.confidence) {
        continue; // Skip invalid entries
      }
      
      entities.push({
        name: llmEntity.name,
        type: llmEntity.type as EntityType,
        confidence: Math.min(1.0, llmEntity.confidence), // Ensure <= 1.0
        locator: {
          textSnippet: llmEntity.context || 'Found by LLM analysis',
          position: text.indexOf(llmEntity.name) // Best effort position
        },
        metadata: {
          source: 'llm',
          context: llmEntity.context
        }
      });
    }
    
    return entities;
  } catch (err) {
    console.error('LLM entity extraction failed:', err);
    return [];
  }
}

/**
 * Map entities to schema.org fields
 */
function createSchemaMapping(entities: Entity[]): Record<string, Entity[]> {
  const mapping: Record<string, Entity[]> = {};
  
  for (const entity of entities) {
    const schemaField = entity.metadata?.schemaField;
    if (schemaField) {
      if (!mapping[schemaField]) {
        mapping[schemaField] = [];
      }
      mapping[schemaField].push(entity);
    }
  }
  
  return mapping;
}

/**
 * Generate summary statistics
 */
function generateSummary(entities: Entity[]): EntityExtractionResult['summary'] {
  const byType: Record<EntityType, number> = {
    organization: 0,
    product: 0,
    person: 0,
    date: 0,
    number: 0,
    location: 0,
    email: 0,
    url: 0,
    phone: 0
  };
  
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  
  for (const entity of entities) {
    byType[entity.type]++;
    
    if (entity.confidence >= 0.8) {
      highConfidence++;
    } else if (entity.confidence >= 0.5) {
      mediumConfidence++;
    } else {
      lowConfidence++;
    }
  }
  
  return {
    totalEntities: entities.length,
    byType,
    highConfidence,
    mediumConfidence,
    lowConfidence
  };
}

/**
 * Extract named entities from HTML content
 * 
 * LLM-first approach: Uses LLM for semantic entities (orgs, products, people, dates, numbers, locations)
 * Regex fallback: Only for structured data (emails, phones, URLs) and when LLM unavailable
 * 
 * @param $ - Cheerio instance
 * @param options - Extraction options
 * @returns Entity extraction result
 */
export async function extractNamedEntities(
  $: CheerioAPI,
  options?: {
    enableLLM?: boolean;
    llmConfig?: LLMConfig;
    minConfidence?: number; // Filter entities below this confidence
  }
): Promise<EntityExtractionResult> {
  const text = extractTextContent($);
  let entities: Entity[] = [];
  
  // 1. Always extract structured data (emails, phones, URLs) with regex
  const structuredEntities = extractStructuredEntities(text);
  entities.push(...structuredEntities);
  
  // 2. Extract from schema.org JSON-LD (perfect confidence)
  const schemaEntities = extractEntitiesFromSchema($);
  
  // Merge schema entities (they have perfect confidence)
  const entityMap = new Map<string, Entity>();
  
  // Add schema entities first (highest confidence)
  for (const entity of schemaEntities) {
    const key = `${entity.type}:${entity.name.toLowerCase()}`;
    entityMap.set(key, entity);
  }
  
  // Add structured entities
  for (const entity of entities) {
    const key = `${entity.type}:${entity.name.toLowerCase()}`;
    if (!entityMap.has(key)) {
      entityMap.set(key, entity);
    }
  }
  
  // 3. LLM extraction for semantic entities (organizations, products, people, dates, numbers, locations)
  if (options?.enableLLM && options.llmConfig) {
    try {
      const llmEntities = await extractEntitiesWithLLM(text, options.llmConfig);
      
      // Merge LLM entities
      for (const entity of llmEntities) {
        const key = `${entity.type}:${entity.name.toLowerCase()}`;
        const existing = entityMap.get(key);
        
        if (existing) {
          // Boost confidence with LLM confirmation
          existing.confidence = (existing.confidence + entity.confidence) / 2;
          if (entity.metadata?.context && !existing.metadata?.context) {
            existing.metadata = {
              ...existing.metadata,
              context: entity.metadata.context
            };
          }
        } else {
          // Add new LLM-discovered entity
          entityMap.set(key, entity);
        }
      }
    } catch (error) {
      console.error('LLM entity extraction failed, using structured data only:', error);
    }
  }
  
  entities = Array.from(entityMap.values());
  
  // 4. Filter by minimum confidence
  if (options?.minConfidence !== undefined) {
    entities = entities.filter((e: Entity) => e.confidence >= options.minConfidence!);
  }
  
  // 5. Sort by confidence (high to low)
  entities.sort((a: Entity, b: Entity) => b.confidence - a.confidence);
  
  // 6. Generate summary and mapping
  const summary = generateSummary(entities);
  const schemaMapping = createSchemaMapping(entities);
  
  return {
    entities,
    summary,
    schemaMapping: Object.keys(schemaMapping).length > 0 ? schemaMapping : undefined
  };
}

/**
 * Extract entities quickly without LLM (local mode)
 */
export async function extractEntitiesQuick($: CheerioAPI): Promise<EntityExtractionResult> {
  return extractNamedEntities($, { enableLLM: false });
}
