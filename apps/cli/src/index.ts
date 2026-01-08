import { Command } from 'commander';
import { auditCommand } from './commands/audit.js';
import { crawlCommand } from './commands/crawl.js';
import { reportCommand } from './commands/report.js';
import { auditWizardCommand } from './commands/audit-wizard.js';
import { presetsCommand } from './commands/presets.js';

const program = new Command();

program
  .name('ai-lighthouse')
  .description('AI Lighthouse - Audit websites for AI readiness and SEO optimization')
  .version('1.0.0');

// Register commands
auditWizardCommand(program); // Interactive wizard (recommended for new users)
auditCommand(program);
crawlCommand(program);
reportCommand(program);
presetsCommand(program); // List available presets

program.parse();
