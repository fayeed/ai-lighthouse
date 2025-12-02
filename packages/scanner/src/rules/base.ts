import { RuleContext, RuleMeta } from "./registry.js";
import { Issue } from "../types.js";

export abstract class BaseRule {
  public static meta?: RuleMeta;
  public meta!: RuleMeta;
  abstract execute(ctx: RuleContext): Promise<Issue | Issue[] | null>;
}