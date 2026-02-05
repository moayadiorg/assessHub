import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ASSESSMENT_TYPE_ID = 'cml94fxv200153o1j41tfysml' // Infrastructure as Code Maturity
const CUSTOMER_NAME = 'CloudNative Solutions'
const CREATED_BY = 'demo@assesshub.com'

// High maturity responses (targeting 93% overall = 4.65/5 average)
// Mix of 5s and 4s, with one or two 3s for realism
const responses = [
  // Deployment & Delivery (Category 1)
  {
    questionId: 'cml94gy7k001h3o1jbxsyxu4m',
    score: 5,
    commentary: 'We deploy multiple times per day using fully automated CI/CD pipelines. Infrastructure changes are deployed on-demand with zero manual intervention.'
  },
  {
    questionId: 'cml94gy8m001o3o1jnasko1wo',
    score: 5,
    commentary: 'Our lead time is under 15 minutes from commit to production. Automated validation and progressive rollouts ensure safety while maintaining speed.'
  },
  {
    questionId: 'cml94gy9o001v3o1jnrhy6oi0',
    score: 5,
    commentary: '100% automated deployments through GitOps workflows. ArgoCD continuously reconciles desired state with actual infrastructure state across all environments.'
  },

  // Change Management & Reliability (Category 2)
  {
    questionId: 'cml94ha1600223o1jv2nsvfu8',
    score: 5,
    commentary: 'Less than 0.1% of infrastructure changes result in failures. Comprehensive testing, blue-green deployments, and automated rollback mechanisms ensure high reliability.'
  },
  {
    questionId: 'cml94ha2e00293o1ju1974kmu',
    score: 5,
    commentary: 'Automated rollback within 2-3 minutes. Health checks and monitoring trigger instant rollbacks when issues are detected. MTTR is consistently under 5 minutes.'
  },
  {
    questionId: 'cml94ha3a002g3o1jgq81updx',
    score: 4,
    commentary: 'We use Terraform Cloud for centralized state management with state locking. Drift detection runs hourly and alerts on any discrepancies. Working on automated drift remediation.'
  },

  // Code Quality & Standards (Category 3)
  {
    questionId: 'cml94hld9002n3o1jbr6gglwj',
    score: 5,
    commentary: 'Monorepo structure with clear module boundaries. Shared modules published to internal registry. Consistent directory structure across all infrastructure projects following industry best practices.'
  },
  {
    questionId: 'cml94hlf4002u3o1ja889tvgl',
    score: 5,
    commentary: 'Mandatory peer review for all infrastructure changes. Automated checks enforce coding standards, security policies, and cost limits. Average review time is under 2 hours.'
  },
  {
    questionId: 'cml94hlg100313o1jvnlzmx30',
    score: 4,
    commentary: 'All modules include README with usage examples and variable documentation. Architecture decision records (ADRs) document major design choices. Working on auto-generating documentation from code annotations.'
  },

  // Testing & Validation (Category 4)
  {
    questionId: 'cml94hxbx00383o1jq8c0xvs0',
    score: 5,
    commentary: 'Comprehensive testing strategy: static analysis (tflint, checkov), unit tests (terratest), integration tests in ephemeral environments, and contract tests for API boundaries.'
  },
  {
    questionId: 'cml94hxd0003f3o1jqovk4b0w',
    score: 5,
    commentary: 'Infrastructure as Code ensures 100% parity across environments. Same code promotes through dev -> staging -> prod with only configuration differences.'
  },
  {
    questionId: 'cml94hxet003m3o1j52yuznmf',
    score: 4,
    commentary: 'Multiple validation gates: automated security scanning, cost impact analysis, policy compliance checks, and required approvals for production changes. Exploring canary analysis for gradual rollouts.'
  },

  // Security & Compliance (Category 5)
  {
    questionId: 'cml94ia9q003t3o1j6dipuw5s',
    score: 5,
    commentary: 'Zero secrets in code. All sensitive data managed through HashiCorp Vault with dynamic credentials and automatic rotation. SOPS encryption for static secrets in git.'
  },
  {
    questionId: 'cml94iaat00403o1jvv5jv9jy',
    score: 5,
    commentary: 'Multiple security scanning layers: Checkov and tfsec in CI pipeline, Snyk for dependency scanning, and Bridgecrew for runtime security. All scans run on every commit with zero tolerance for high-severity issues.'
  },
  {
    questionId: 'cml94iacc00473o1jw6v4x8qr',
    score: 4,
    commentary: 'Policy-as-code using OPA and Sentinel. Automated compliance checks against SOC2, ISO27001, and GDPR requirements. Monthly compliance reports generated automatically. Working on continuous compliance monitoring.'
  }
]

async function main() {
  console.log('Creating CloudNative Solutions IaC Maturity Assessment...\n')

  // 1. Find or create customer
  let customer = await prisma.customer.findUnique({
    where: { name: CUSTOMER_NAME }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: CUSTOMER_NAME }
    })
    console.log(`✓ Created customer: ${customer.name}`)
  } else {
    console.log(`✓ Found existing customer: ${customer.name}`)
  }

  // 2. Get assessment type details
  const assessmentType = await prisma.assessmentType.findUnique({
    where: { id: ASSESSMENT_TYPE_ID },
    include: {
      categories: {
        include: {
          questions: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!assessmentType) {
    throw new Error('Infrastructure as Code Maturity assessment type not found')
  }
  console.log(`✓ Found assessment type: ${assessmentType.name}`)

  // 3. Create assessment
  const assessment = await prisma.assessment.create({
    data: {
      name: 'Q1 2026 Infrastructure as Code Maturity Assessment',
      customerName: customer.name,
      customerId: customer.id,
      assessmentTypeId: ASSESSMENT_TYPE_ID,
      createdBy: CREATED_BY,
      status: 'completed'
    }
  })
  console.log(`✓ Created assessment: ${assessment.name}`)

  // 4. Create responses
  console.log('\nCreating responses...')
  let totalScore = 0
  for (const response of responses) {
    await prisma.response.create({
      data: {
        assessmentId: assessment.id,
        questionId: response.questionId,
        score: response.score,
        commentary: response.commentary
      }
    })
    totalScore += response.score
    console.log(`  ✓ Question response: Score ${response.score}/5`)
  }

  // 5. Calculate and display results
  const avgScore = totalScore / responses.length
  const percentageScore = (avgScore / 5) * 100

  console.log('\n' + '='.repeat(60))
  console.log('Assessment Created Successfully!')
  console.log('='.repeat(60))
  console.log(`Customer: ${customer.name}`)
  console.log(`Assessment: ${assessment.name}`)
  console.log(`Status: ${assessment.status}`)
  console.log(`Total Questions: ${responses.length}`)
  console.log(`Average Score: ${avgScore.toFixed(2)}/5`)
  console.log(`Percentage: ${percentageScore.toFixed(1)}%`)
  console.log('='.repeat(60))

  // Display breakdown by category
  console.log('\nScore Breakdown by Category:')
  for (const category of assessmentType.categories) {
    const categoryResponses = responses.filter(r =>
      category.questions.some(q => q.id === r.questionId)
    )
    if (categoryResponses.length > 0) {
      const categoryAvg = categoryResponses.reduce((sum, r) => sum + r.score, 0) / categoryResponses.length
      const categoryPct = (categoryAvg / 5) * 100
      console.log(`  ${category.name}: ${categoryAvg.toFixed(2)}/5 (${categoryPct.toFixed(1)}%)`)
    }
  }

  console.log(`\nView the assessment at: http://localhost:3005/assessments/${assessment.id}/results`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
