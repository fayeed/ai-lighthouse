#!/usr/bin/env tsx
/**
 * Script to update a user's subscription plan by email
 *
 * Usage:
 *   pnpm --filter @ai-lighthouse/api run update-plan <email> <plan>
 *
 * Examples:
 *   pnpm --filter @ai-lighthouse/api run update-plan user@example.com PRO
 *   pnpm --filter @ai-lighthouse/api run update-plan user@example.com FREE
 *   pnpm --filter @ai-lighthouse/api run update-plan user@example.com ENTERPRISE
 */

import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

// Plan configurations
const PLAN_CONFIGS: Record<PlanType, {
  scansPerMonth: number;
  pagesPerScan: number;
  llmAnalysisEnabled: boolean;
  fullCrawlEnabled: boolean;
  apiAccessEnabled: boolean;
}> = {
  FREE: {
    scansPerMonth: 5,
    pagesPerScan: 1,
    llmAnalysisEnabled: false,
    fullCrawlEnabled: false,
    apiAccessEnabled: false,
  },
  PRO: {
    scansPerMonth: 100,
    pagesPerScan: 50,
    llmAnalysisEnabled: true,
    fullCrawlEnabled: true,
    apiAccessEnabled: true,
  },
  ENTERPRISE: {
    scansPerMonth: 1000,
    pagesPerScan: 200,
    llmAnalysisEnabled: true,
    fullCrawlEnabled: true,
    apiAccessEnabled: true,
  },
};

async function updateUserPlan(email: string, plan: PlanType) {
  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user) {
    console.error(`\n❌ User not found with email: ${email}\n`);
    process.exit(1);
  }

  const planConfig = PLAN_CONFIGS[plan];

  if (user.subscription) {
    // Update existing subscription
    const updated = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan,
        ...planConfig,
      },
    });

    console.log(`\n✅ Updated subscription for ${email}`);
    console.log(`   Plan: ${updated.plan}`);
    console.log(`   Scans per month: ${updated.scansPerMonth}`);
    console.log(`   Pages per scan: ${updated.pagesPerScan}`);
    console.log(`   LLM Analysis: ${updated.llmAnalysisEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Full Crawl: ${updated.fullCrawlEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   API Access: ${updated.apiAccessEnabled ? 'Enabled' : 'Disabled'}\n`);
  } else {
    // Create new subscription
    const created = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        ...planConfig,
      },
    });

    console.log(`\n✅ Created subscription for ${email}`);
    console.log(`   Plan: ${created.plan}`);
    console.log(`   Scans per month: ${created.scansPerMonth}`);
    console.log(`   Pages per scan: ${created.pagesPerScan}`);
    console.log(`   LLM Analysis: ${created.llmAnalysisEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Full Crawl: ${created.fullCrawlEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   API Access: ${created.apiAccessEnabled ? 'Enabled' : 'Disabled'}\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: pnpm --filter @ai-lighthouse/api run update-plan <email> <plan>

Arguments:
  email   - User's email address
  plan    - Plan type: FREE, PRO, or ENTERPRISE

Examples:
  pnpm --filter @ai-lighthouse/api run update-plan user@example.com PRO
  pnpm --filter @ai-lighthouse/api run update-plan user@example.com FREE
`);
    process.exit(1);
  }

  const [email, planArg] = args;
  const plan = planArg.toUpperCase() as PlanType;

  if (!['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
    console.error(`\n❌ Invalid plan: ${planArg}`);
    console.error(`   Valid plans: FREE, PRO, ENTERPRISE\n`);
    process.exit(1);
  }

  try {
    await updateUserPlan(email, plan);
  } catch (error) {
    console.error('\n❌ Error updating user plan:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
