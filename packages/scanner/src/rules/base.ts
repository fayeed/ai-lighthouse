import { RuleContext, RuleMeta } from "./registry";
import { Issue } from "../types";

export abstract class BaseRule {
  public static meta?: RuleMeta;
  public meta!: RuleMeta;
  abstract execute(ctx: RuleContext): Promise<Issue | Issue[] | null>;
}