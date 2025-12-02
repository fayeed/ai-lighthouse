import * as cheerio from 'cheerio';
import { Issue, ScanOptions, SEVERITY } from '../types.js';

export type RuleContext = {
  url: string;
  html: string;
  $: cheerio.CheerioAPI;
  options?: ScanOptions;
}

export abstract class BaseRule {
  meta?: RuleMeta;
  abstract execute(ctx: RuleContext): Promise<Issue | Issue[] | null>;
}

export type RuleConstructor<T extends BaseRule = BaseRule> = new (...args: any[]) => T;

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
  ctor: RuleConstructor;
};

// Registry to hold all registered rules
const RULES: RegisteredRule[] = [];

export function registerRule(meta: RuleMeta, ctor: RuleConstructor) {
  RULES.push({ meta, ctor });

  RULES.sort((a, b) => ((a.meta.priority ?? 100) - (b.meta.priority ?? 100)));
}

export function getRegisteredRules(): RegisteredRule[] {
  return RULES.slice();
}

export function Rule(meta: RuleMeta) {
  return function (target: RuleConstructor) {
    registerRule(meta, target);
    return target;
  };
}