import * as cheerio from 'cheerio';
import { Issue, ScanOptions, SEVERITY } from './types';

export type RuleContext = {
  url: string;
  html: string;
  $: cheerio.Cheerio<any>;
  options?: ScanOptions;
}

export type RuleFn = (ctx: RuleContext) => Promise<Issue | Issue[] | null> | Issue | Issue[] | null;

export type RuleMeta = {
  id: string;
  title: string;
  category: string;
  defaultSeverity: SEVERITY;
  tags?: string[];
  priority?: number;
  description?: string;
}

export type RegisteredRule = {
  meta: RuleMeta;
  fn: RuleFn;
};

// Registry to hold all registered rules
const RULES: RegisteredRule[] = [];

export function registerRule(meta: RuleMeta, fn: RuleFn) {
  RULES.push({ meta, fn });

  RULES.sort((a, b) => ((a.meta.priority ?? 100) - (b.meta.priority ?? 100)));
}

export function getRegisteredRules(): RegisteredRule[] {
  return RULES.slice();
}

export function Rule(meta: RuleMeta) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const fn: RuleFn = descriptor ? descriptor.value : target;
    if (typeof fn !== 'function') {
      throw new Error('Rule decorator can only be applied to functions');
    }
    registerRule(meta, fn);
    return descriptor;
  }
}