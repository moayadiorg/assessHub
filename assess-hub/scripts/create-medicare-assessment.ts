/**
 * Script to create a sample Infrastructure as Code Maturity assessment
 * for MediCare Health Systems
 *
 * This healthcare company shows moderate-high maturity (72-78%) with:
 * - Strong security and compliance (HIPAA requirements)
 * - Good documentation practices
 * - Solid CI/CD implementation
 * - Room for improvement in advanced testing and modularity
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Assessment type ID (Infrastructure as Code Maturity)
const ASSESSMENT_TYPE_ID = 'cml94fxv200153o1j41tfysml'

// Customer and assessment details
const CUSTOMER_NAME = 'MediCare Health Systems'
const ASSESSMENT_NAME = 'Q1 2026 Infrastructure Review'
const CREATED_BY = 'sarah.johnson@assesshub.com'

// Category IDs
const CATEGORIES = {
  deployment: 'cml94gfjv00173o1j7ifcj16i',
  changeManagement: 'cml94gfm200193o1jzdl168of',
  codeQuality: 'cml94gfna001b3o1jopx9ryk1',
  testing: 'cml94gfpb001d3o1j9sh3vpdu',
  security: 'cml94gfqd001f3o1j3wwj1lj1'
}

// Responses with scores and commentary
// Healthcare context: Strong on security/compliance, good on automation,
// moderate on advanced practices
const responses = [
  // DEPLOYMENT & DELIVERY (Average: ~3.7/5)
  {
    questionId: 'cml94gy7k001h3o1jbxsyxu4m', // Deploy frequency
    score: 4,
    commentary: 'We deploy infrastructure changes weekly through our CI/CD pipeline. More frequent deployments are limited by change control board approval requirements for HIPAA compliance.'
  },
  {
    questionId: 'cml94gy8m001o3o1jnasko1wo', // Lead time
    score: 3,
    commentary: 'Typical lead time is 2-3 days from commit to production. This includes mandatory security scans, compliance checks, and CAB approval. Emergency changes can be expedited to same-day deployment with proper justification.'
  },
  {
    questionId: 'cml94gy9o001v3o1jnrhy6oi0', // Automation level
    score: 4,
    commentary: 'Our infrastructure deployment pipeline is highly automated using Terraform Cloud with automated testing and approval workflows. Manual intervention is only required for final production approval and rollback scenarios.'
  },

  // CHANGE MANAGEMENT & RELIABILITY (Average: ~3.7/5)
  {
    questionId: 'cml94ha1600223o1jv2nsvfu8', // Failure rate
    score: 4,
    commentary: 'Our infrastructure changes have a <5% failure rate thanks to comprehensive testing in lower environments. Most failures are caught in staging. We maintain detailed metrics and conduct monthly reviews.'
  },
  {
    questionId: 'cml94ha2e00293o1ju1974kmu', // Recovery time
    score: 3,
    commentary: 'We can typically recover from failed deployments within 15-30 minutes using automated rollback procedures. For critical healthcare applications, we maintain blue-green deployment capability to minimize patient impact.'
  },
  {
    questionId: 'cml94ha3a002g3o1jgq81updx', // State management
    score: 4,
    commentary: 'We use Terraform state locking with remote backend in S3 and DynamoDB. Automated drift detection runs daily with alerts to operations team. Drift is typically resolved within 24 hours per our compliance SLA.'
  },

  // CODE QUALITY & STANDARDS (Average: ~4.0/5)
  {
    questionId: 'cml94hld9002n3o1jbr6gglwj', // Code organization
    score: 4,
    commentary: 'Our IaC codebase uses a modular structure with reusable modules for networking, compute, and data services. We follow a standardized directory structure across all projects with clear separation between environments.'
  },
  {
    questionId: 'cml94hlf4002u3o1ja889tvgl', // Code review
    score: 4,
    commentary: 'All infrastructure changes require peer review by at least two senior engineers, including one from our security team. We use pull requests with automated linting and security scanning before approval. Average review time is 1 business day.'
  },
  {
    questionId: 'cml94hlg100313o1jvnlzmx30', // Documentation
    score: 4,
    commentary: 'Infrastructure code includes comprehensive inline documentation, README files for each module, and architecture diagrams. We maintain a central wiki with runbooks for common procedures. Documentation is updated as part of code review process.'
  },

  // TESTING & VALIDATION (Average: ~3.3/5)
  {
    questionId: 'cml94hxbx00383o1jq8c0xvs0', // Testing level
    score: 3,
    commentary: 'We perform syntax validation, linting with tflint, and policy-as-code checks using Sentinel. Unit testing is limited - we primarily rely on staging environment validation. Would like to implement more comprehensive automated testing in the future.'
  },
  {
    questionId: 'cml94hxd0003f3o1jqovk4b0w', // Environment consistency
    score: 4,
    commentary: 'Dev, staging, and production environments are deployed from the same Terraform code using workspace-specific variables. Configuration differences are minimal and well-documented. We maintain environment parity for security and compliance requirements.'
  },
  {
    questionId: 'cml94hxet003m3o1j52yuznmf', // Validation gates
    score: 3,
    commentary: 'We have automated policy checks for security baseline compliance, cost thresholds, and resource tagging. Manual approval is required from security and compliance teams before production deployments. Looking to add more automated integration testing.'
  },

  // SECURITY & COMPLIANCE (Average: ~4.3/5)
  {
    questionId: 'cml94ia9q003t3o1j6dipuw5s', // Secrets management
    score: 5,
    commentary: 'All secrets are managed through AWS Secrets Manager with automatic rotation enabled. No hardcoded credentials in code. Access is controlled via IAM with MFA required for production access. Regular audits ensure compliance with HIPAA requirements.'
  },
  {
    questionId: 'cml94iaat00403o1jvv5jv9jy', // Security scanning
    score: 4,
    commentary: 'We use Checkov and tfsec for automated security scanning in our CI/CD pipeline. All high and critical findings must be resolved before merge. We also perform quarterly third-party security assessments of our infrastructure code.'
  },
  {
    questionId: 'cml94iacc00473o1jw6v4x8qr', // Compliance
    score: 4,
    commentary: 'Our infrastructure is continuously monitored for HIPAA, SOC 2, and internal security policy compliance using automated policy-as-code tools. All infrastructure changes are logged and auditable. Monthly compliance reports are generated for leadership review.'
  }
]

async function main() {
  console.log('🏥 Creating MediCare Health Systems IaC Assessment...\n')

  // Step 1: Find or create customer
  console.log('Step 1: Setting up customer...')
  let customer = await prisma.customer.findUnique({
    where: { name: CUSTOMER_NAME }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: CUSTOMER_NAME }
    })
    console.log(`✓ Created customer: ${CUSTOMER_NAME}`)
  } else {
    console.log(`✓ Customer already exists: ${CUSTOMER_NAME}`)
  }

  // Step 2: Verify assessment type exists
  console.log('\nStep 2: Verifying assessment type...')
  const assessmentType = await prisma.assessmentType.findUnique({
    where: { id: ASSESSMENT_TYPE_ID },
    include: {
      _count: {
        select: { categories: true }
      }
    }
  })

  if (!assessmentType) {
    throw new Error('Infrastructure as Code Maturity assessment type not found!')
  }
  console.log(`✓ Found assessment type: ${assessmentType.name}`)
  console.log(`  - ${assessmentType._count.categories} categories`)

  // Step 3: Create assessment
  console.log('\nStep 3: Creating assessment...')
  const assessment = await prisma.assessment.create({
    data: {
      name: ASSESSMENT_NAME,
      customerName: CUSTOMER_NAME,
      customerId: customer.id,
      assessmentTypeId: ASSESSMENT_TYPE_ID,
      createdBy: CREATED_BY,
      status: 'in-progress'
    }
  })
  console.log(`✓ Created assessment: ${assessment.name}`)
  console.log(`  - Assessment ID: ${assessment.id}`)

  // Step 4: Create responses
  console.log('\nStep 4: Adding responses...')
  let totalScore = 0
  let responseCount = 0

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
    responseCount++
    console.log(`✓ Added response (score: ${response.score}/5)`)
  }

  // Step 5: Mark assessment as completed
  console.log('\nStep 5: Completing assessment...')
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { status: 'completed' }
  })

  // Calculate statistics
  const averageScore = totalScore / responseCount
  const percentage = (averageScore / 5) * 100

  console.log('\n' + '='.repeat(60))
  console.log('✅ Assessment created successfully!')
  console.log('='.repeat(60))
  console.log(`\n📊 Statistics:`)
  console.log(`   Customer: ${CUSTOMER_NAME}`)
  console.log(`   Assessment: ${ASSESSMENT_NAME}`)
  console.log(`   Questions answered: ${responseCount}/15`)
  console.log(`   Average score: ${averageScore.toFixed(2)}/5.00`)
  console.log(`   Overall maturity: ${percentage.toFixed(1)}%`)
  console.log(`\n   Category Breakdown:`)
  console.log(`   - Deployment & Delivery: 3.7/5 (73%)`)
  console.log(`   - Change Management: 3.7/5 (73%)`)
  console.log(`   - Code Quality: 4.0/5 (80%)`)
  console.log(`   - Testing: 3.3/5 (67%)`)
  console.log(`   - Security & Compliance: 4.3/5 (87%)`)
  console.log(`\n🔍 Key Findings:`)
  console.log(`   ✓ Strong security posture (HIPAA-compliant)`)
  console.log(`   ✓ Excellent documentation practices`)
  console.log(`   ✓ Good automation and CI/CD`)
  console.log(`   ⚠ Testing practices could be more comprehensive`)
  console.log(`   ⚠ Lead times impacted by compliance requirements`)
  console.log(`\n🌐 View the assessment:`)
  console.log(`   http://localhost:3005/assessments/${assessment.id}/results`)
  console.log('='.repeat(60) + '\n')
}

main()
  .catch((error) => {
    console.error('❌ Error creating assessment:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
