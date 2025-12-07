#!/usr/bin/env node

import { Command } from 'commander';
import { auditCommand } from './commands/audit.js';
import { crawlCommand } from './commands/crawl.js';
import { reportCommand } from './commands/report.js';

const program = new Command();

program
  .name('ai-lighthouse')
  .description('AI Lighthouse - Audit websites for AI readiness and SEO optimization')
  .version('1.0.0');

// Register commands
auditCommand(program);
crawlCommand(program);
reportCommand(program);

program.parse();
