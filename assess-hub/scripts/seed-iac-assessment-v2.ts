import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting IaC Maturity Assessment seed for Acme Corporation...\n');

  // Step 1: Create or find the customer
  const customer = await prisma.customer.upsert({
    where: { name: 'Acme Corporation' },
    update: {},
    create: {
      name: 'Acme Corporation',
    },
  });
  console.log(`✓ Customer: ${customer.name} (${customer.id})`);

  // Step 2: Find the existing IaC Maturity assessment type
  const assessmentType = await prisma.assessmentType.findFirst({
    where: { name: 'Infrastructure as Code Maturity' },
    include: {
      categories: {
        include: {
          questions: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!assessmentType) {
    throw new Error('Infrastructure as Code Maturity assessment type not found. Please import it first.');
  }

  console.log(`✓ Assessment Type: ${assessmentType.name}`);
  console.log(`  Categories: ${assessmentType.categories.length}`);

  const totalQuestions = assessmentType.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  console.log(`  Total Questions: ${totalQuestions}\n`);

  // Step 3: Create a completed assessment
  const assessment = await prisma.assessment.create({
    data: {
      name: 'IaC Maturity Assessment - Q1 2026',
      customerName: customer.name,
      customerId: customer.id,
      assessmentTypeId: assessmentType.id,
      createdBy: 'system@assesshub.com',
      status: 'completed',
    },
  });
  console.log(`✓ Created Assessment: ${assessment.name}`);
  console.log(`  ID: ${assessment.id}`);
  console.log(`  Status: ${assessment.status}\n`);

  // Step 4: Create responses with scores targeting ~65% maturity (avg score ~3.25 out of 5)
  // Map category names to response patterns
  const responsePatterns = {
    'Deployment & Delivery': [
      { score: 3, commentary: 'We use GitHub Actions for CI/CD. Automated deployments to dev/staging, manual approval for production. Working towards full automation.' },
      { score: 3, commentary: 'Infrastructure changes are deployed through pipelines with approval gates. Some manual steps remain for complex changes.' },
      { score: 4, commentary: 'Rollback procedures are documented and tested. Automated rollback for most services, manual for databases and stateful components.' },
    ],
    'Change Management & Reliability': [
      { score: 3, commentary: 'We have a change approval process for production. Changes are reviewed by the team lead before deployment.' },
      { score: 3, commentary: 'Terraform plan output is reviewed before apply. We catch most issues during review, but occasionally find surprises in production.' },
      { score: 2, commentary: 'Drift detection is manual. We run terraform plan periodically to check for drift, but no automated alerting yet.' },
    ],
    'Code Quality & Standards': [
      { score: 4, commentary: 'All IaC code is in version control (GitHub) with branch protection. Code reviews required for all PRs.' },
      { score: 3, commentary: 'We have coding standards documented in our wiki. Linting is automated via tflint. Enforcement is mostly consistent.' },
      { score: 4, commentary: 'Common patterns are extracted into reusable modules. We have a private Terraform registry with about 20 certified modules.' },
    ],
    'Testing & Validation': [
      { score: 3, commentary: 'We write unit tests for critical modules using Terratest. Coverage is around 40%. Integration testing is mostly manual.' },
      { score: 3, commentary: 'Pre-deployment validation includes syntax checks, linting, and terraform validate. Terraform plan is reviewed before merges.' },
      { score: 3, commentary: 'Basic smoke tests run after deployment to verify resources are accessible. No comprehensive integration or end-to-end tests yet.' },
    ],
    'Security & Compliance': [
      { score: 4, commentary: 'Security scanning integrated into CI/CD using tfsec and Checkov. Findings are reviewed and must be addressed before merge.' },
      { score: 3, commentary: 'Secrets are stored in AWS Secrets Manager and HashiCorp Vault. Working on automating secret rotation.' },
      { score: 3, commentary: 'We follow AWS Well-Architected Framework guidelines. Quarterly reviews for compliance. Some automation gaps remain.' },
    ],
  };

  let totalScore = 0;
  let responseCount = 0;

  // Create responses for each category
  for (const category of assessmentType.categories) {
    const patterns = responsePatterns[category.name as keyof typeof responsePatterns];

    if (!patterns) {
      console.log(`⚠️  No response pattern for category: ${category.name}`);
      continue;
    }

    console.log(`\nCategory: ${category.name}`);

    for (let i = 0; i < category.questions.length && i < patterns.length; i++) {
      const question = category.questions[i];
      const pattern = patterns[i];

      await prisma.response.create({
        data: {
          assessmentId: assessment.id,
          questionId: question.id,
          score: pattern.score,
          commentary: pattern.commentary,
        },
      });

      totalScore += pattern.score;
      responseCount++;
      console.log(`  ✓ Q${i + 1}: Score ${pattern.score}/5`);
    }
  }

  // Calculate and display results
  const avgScore = totalScore / responseCount;
  const percentScore = (avgScore / 5) * 100;

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 ASSESSMENT RESULTS');
  console.log('='.repeat(60));
  console.log(`Customer:         ${customer.name}`);
  console.log(`Assessment:       ${assessment.name}`);
  console.log(`Total Responses:  ${responseCount}`);
  console.log(`Average Score:    ${avgScore.toFixed(2)} / 5.00`);
  console.log(`Maturity Level:   ${percentScore.toFixed(1)}%`);
  console.log(`Status:           ${assessment.status}`);
  console.log('='.repeat(60));

  console.log('\n✅ Seed completed successfully!\n');
  console.log(`🌐 View the assessment at:`);
  console.log(`   http://localhost:3005/assessments/${assessment.id}/results\n`);
  console.log(`📋 Or view all assessments at:`);
  console.log(`   http://localhost:3005\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
