import type { FixGuide } from '../types';
import { seoGuides } from './seo-guides';
import { aeoGuides } from './aeo-guides';
import { geoGuides } from './geo-guides';

/**
 * Combined guide registry: issue ID → platform → FixGuide
 */
const allGuides: Record<string, Record<string, FixGuide>> = {
  ...seoGuides,
  ...aeoGuides,
  ...geoGuides,
};

/**
 * Look up CMS-specific fix guides for a given issue ID.
 * Returns undefined if no guides exist for that issue.
 */
export function getFixGuides(issueId: string): Record<string, FixGuide> | undefined {
  return allGuides[issueId];
}

/**
 * Attach CMS-specific fix guides to an array of issues (mutates in place).
 */
export function attachFixGuides(issues: Array<{ id: string; cmsGuides?: Record<string, FixGuide> }>): void {
  for (const issue of issues) {
    const guides = getFixGuides(issue.id);
    if (guides) {
      issue.cmsGuides = guides;
    }
  }
}
