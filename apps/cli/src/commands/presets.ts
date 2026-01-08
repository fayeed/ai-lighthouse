import { Command } from 'commander';
import chalk from 'chalk';
import { listPresets } from '../presets.js';

export function presetsCommand(program: Command) {
  program
    .command('presets')
    .description('List available preset configurations')
    .action(() => {
      console.log('\n' + chalk.bold.cyan('🎯 Available Presets\n'));

      const presets = listPresets();

      presets.forEach(preset => {
        const badge = preset.name === 'ai-optimized' ? chalk.green('[Recommended]') : '';

        console.log(chalk.bold(preset.name) + ' ' + badge);
        console.log(chalk.dim(`  ${preset.description}`));
        console.log(chalk.dim(`  Duration: ${preset.duration}`));
        console.log('');
      });

      console.log(chalk.dim('Usage:'));
      console.log(chalk.dim('  ai-lighthouse audit <url> --preset <name>'));
      console.log('');
      console.log(chalk.dim('Examples:'));
      console.log(chalk.dim('  ai-lighthouse audit https://example.com --preset basic'));
      console.log(chalk.dim('  ai-lighthouse audit https://example.com --preset ai-optimized'));
      console.log('');
    });
}
