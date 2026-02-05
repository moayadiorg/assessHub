import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧹 Cleaning up Acme Corporation assessments...\n');

  // Find all assessments for Acme Corporation
  const assessments = await prisma.assessment.findMany({
    where: {
      customerName: 'Acme Corporation'
    },
    include: {
      responses: true
    }
  });

  if (assessments.length === 0) {
    console.log('ℹ️  No assessments found for Acme Corporation');
    return;
  }

  console.log(`Found ${assessments.length} assessment(s) for Acme Corporation:\n`);

  for (const assessment of assessments) {
    console.log(`  • ${assessment.name}`);
    console.log(`    ID: ${assessment.id}`);
    console.log(`    Created: ${assessment.createdAt.toLocaleString()}`);
    console.log(`    Responses: ${assessment.responses.length}`);
    console.log(`    Status: ${assessment.status}`);
  }

  console.log('\n⚠️  WARNING: This will delete all assessments and responses for Acme Corporation');
  console.log('The customer record will remain.\n');

  // In a real scenario, you'd want to prompt for confirmation
  // For this script, we'll just proceed with a comment
  console.log('Proceeding with deletion...\n');

  let deletedCount = 0;
  let deletedResponses = 0;

  for (const assessment of assessments) {
    // Responses are deleted automatically via CASCADE
    const responseCount = assessment.responses.length;

    await prisma.assessment.delete({
      where: { id: assessment.id }
    });

    deletedCount++;
    deletedResponses += responseCount;

    console.log(`  ✓ Deleted: ${assessment.name}`);
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted ${deletedCount} assessment(s)`);
  console.log(`   Deleted ${deletedResponses} response(s)`);
  console.log('\n💡 Tip: Run seed-iac-assessment-v2.ts to recreate the assessment\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
