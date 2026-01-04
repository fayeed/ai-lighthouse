// packages/scanner/src/rules/runner.ts
import { CATEGORY, Issue, SEVERITY } from '../types.js';
import { getRegisteredRules } from './registry.js';
import type { RuleContext } from './registry.js';

export async function runRegisteredRules(ctx: RuleContext) {
  const regs = getRegisteredRules();
  
  // Run all rules in parallel for better performance
  const results = await Promise.all(
    regs.map(async (r) => {
      const Ctor = r.ctor;
      try {
        const instance = new Ctor();
        (instance as any).meta = r.meta;
        const res = await Promise.resolve(instance.execute(ctx));
        if (!res) return [];
        return Array.isArray(res) ? res : [res];
      } catch (err) {
        return [{
          id: 'MISC-ERR',
          title: `Rule ${r.meta.id} failed to run`,
          severity: SEVERITY.LOW,
          category: CATEGORY.MISC,
          description: String(err ?? err),
          remediation: 'Report this rule error to maintainers.',
          impactScore: 1,
          location: { url: ctx.url },
          evidence: [],
          tags: ['rule-error'],
          confidence: 0,
          timestamp: new Date().toISOString()
        }];
      }
    })
  );

  return results.flat();
}
