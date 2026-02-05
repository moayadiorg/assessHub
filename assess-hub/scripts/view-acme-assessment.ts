import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('ACME CORPORATION - IaC MATURITY ASSESSMENT DETAILS');
  console.log('='.repeat(80) + '\n');

  // Get the most recent assessment for Acme Corporation
  const assessment = await prisma.assessment.findFirst({
    where: {
      customerName: 'Acme Corporation',
      assessmentType: {
        name: 'Infrastructure as Code Maturity'
      }
    },
    include: {
      customer: true,
      assessmentType: {
        include: {
          categories: {
            orderBy: { order: 'asc' }
          }
        }
      },
      responses: {
        include: {
          question: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!assessment) {
    console.log('❌ No assessment found for Acme Corporation');
    console.log('\nRun the seed script first:');
    console.log('  npx tsx scripts/seed-iac-assessment-v2.ts\n');
    return;
  }

  // Display header
  console.log('📋 Assessment Information');
  console.log('-'.repeat(80));
  console.log(`Customer:         ${assessment.customer?.name || assessment.customerName}`);
  console.log(`Assessment:       ${assessment.name}`);
  console.log(`Type:             ${assessment.assessmentType.name}`);
  console.log(`Status:           ${assessment.status.toUpperCase()}`);
  console.log(`Created:          ${assessment.createdAt.toLocaleString()}`);
  console.log(`Created By:       ${assessment.createdBy}`);
  console.log(`Assessment ID:    ${assessment.id}`);

  // Calculate overall score
  const totalScore = assessment.responses.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalScore / assessment.responses.length;
  const percentScore = (avgScore / 5) * 100;

  console.log('\n📊 Overall Results');
  console.log('-'.repeat(80));
  console.log(`Total Questions:  ${assessment.responses.length}`);
  console.log(`Average Score:    ${avgScore.toFixed(2)} / 5.00`);
  console.log(`Maturity Level:   ${percentScore.toFixed(1)}%`);

  const getMaturityLabel = (percent: number) => {
    if (percent >= 90) return '🏆 Optimized';
    if (percent >= 75) return '🎯 Quantitatively Managed';
    if (percent >= 60) return '📈 Defined';
    if (percent >= 40) return '⚙️  Managed';
    return '🌱 Initial';
  };

  console.log(`Maturity Stage:   ${getMaturityLabel(percentScore)}`);

  // Group responses by category
  const categoriesMap = new Map<string, typeof assessment.responses>();
  assessment.responses.forEach(response => {
    const catName = response.question.category.name;
    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, []);
    }
    categoriesMap.get(catName)!.push(response);
  });

  // Display by category
  console.log('\n📁 Category Breakdown');
  console.log('-'.repeat(80));

  for (const category of assessment.assessmentType.categories) {
    const responses = categoriesMap.get(category.name) || [];

    if (responses.length === 0) continue;

    const catScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    const catPercent = (catScore / 5) * 100;

    console.log(`\n${category.name}`);
    console.log(`  Score: ${catScore.toFixed(2)}/5.00 (${catPercent.toFixed(0)}%)`);
    console.log(`  Questions answered: ${responses.length}`);

    // Show score distribution
    const scoreBar = '█'.repeat(Math.round(catPercent / 5)) + '░'.repeat(20 - Math.round(catPercent / 5));
    console.log(`  [${scoreBar}]`);

    // Show individual responses
    responses.forEach((response, idx) => {
      const stars = '⭐'.repeat(response.score) + '☆'.repeat(5 - response.score);
      console.log(`\n  Q${idx + 1}. ${response.question.text}`);
      console.log(`      ${stars} (${response.score}/5)`);
      if (response.commentary) {
        console.log(`      💬 "${response.commentary}"`);
      }
    });
  }

  // Strengths and weaknesses
  console.log('\n\n🎯 Key Insights');
  console.log('-'.repeat(80));

  const categoryScores = Array.from(categoriesMap.entries()).map(([name, responses]) => ({
    name,
    score: responses.reduce((sum, r) => sum + r.score, 0) / responses.length
  })).sort((a, b) => b.score - a.score);

  console.log('\n✅ Strongest Areas:');
  categoryScores.slice(0, 2).forEach(cat => {
    console.log(`   • ${cat.name}: ${cat.score.toFixed(2)}/5.00 (${((cat.score/5)*100).toFixed(0)}%)`);
  });

  console.log('\n⚠️  Areas for Improvement:');
  categoryScores.slice(-2).forEach(cat => {
    console.log(`   • ${cat.name}: ${cat.score.toFixed(2)}/5.00 (${((cat.score/5)*100).toFixed(0)}%)`);
  });

  // Access URLs
  console.log('\n\n🌐 View Assessment Online');
  console.log('-'.repeat(80));
  console.log(`Assessment Results:`);
  console.log(`  http://localhost:3005/assessments/${assessment.id}/results`);
  console.log(`\nCustomer Report:`);
  console.log(`  http://localhost:3005/reports/customer/${assessment.customer?.id}`);
  console.log(`\nAll Assessments:`);
  console.log(`  http://localhost:3005`);

  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
