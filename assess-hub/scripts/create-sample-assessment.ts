/**
 * Script to create a sample Infrastructure as Code Maturity assessment
 * for TechStart Industries - a startup just beginning their IaC journey
 *
 * This creates a LOW maturity assessment (around 35% / score 1.75)
 * showing they're just getting started with basic version control but
 * lacking in CI/CD, testing, and security practices.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IaC Maturity Assessment Structure
const IAC_ASSESSMENT = {
  name: 'Infrastructure as Code Maturity',
  description: 'Assess your organization\'s Infrastructure as Code practices, automation, and maturity',
  version: '1.0',
  iconColor: '#10b981', // emerald color for IaC
  categories: [
    {
      name: 'Version Control & Code Quality',
      description: 'How infrastructure code is stored, versioned, and maintained',
      questions: [
        {
          text: 'How is your infrastructure code stored and versioned?',
          description: 'Evaluate your version control practices for infrastructure code',
          options: [
            { score: 1, label: 'No Version Control', description: 'Infrastructure code is not version controlled or stored in shared locations' },
            { score: 2, label: 'Basic VCS', description: 'Code is in version control but with minimal branching strategy or review process' },
            { score: 3, label: 'Structured VCS', description: 'Clear branching strategy, basic code reviews, some documentation' },
            { score: 4, label: 'Advanced VCS', description: 'PR-based workflow, mandatory reviews, automated checks, comprehensive documentation' },
            { score: 5, label: 'Optimized VCS', description: 'GitOps practices, automated compliance checks, policy as code, full auditability' }
          ]
        },
        {
          text: 'What code quality practices are applied to infrastructure code?',
          description: 'Assess linting, formatting, and code quality standards',
          options: [
            { score: 1, label: 'None', description: 'No code quality standards or checks' },
            { score: 2, label: 'Manual Reviews', description: 'Code quality relies on manual peer review' },
            { score: 3, label: 'Basic Linting', description: 'Linting tools used but not enforced' },
            { score: 4, label: 'Enforced Standards', description: 'Automated linting, formatting, and security scanning in CI/CD' },
            { score: 5, label: 'Comprehensive Quality', description: 'Full automated quality gates, custom rules, complexity analysis, security scanning' }
          ]
        }
      ]
    },
    {
      name: 'Automation & CI/CD',
      description: 'Level of automation in infrastructure deployment and management',
      questions: [
        {
          text: 'How is infrastructure deployed and updated?',
          description: 'Evaluate your deployment automation practices',
          options: [
            { score: 1, label: 'Manual Deployment', description: 'Infrastructure changes are applied manually through console or CLI' },
            { score: 2, label: 'Script-Based', description: 'Deployment scripts exist but are run manually' },
            { score: 3, label: 'Basic Pipeline', description: 'CI/CD pipeline for some environments, manual promotion' },
            { score: 4, label: 'Full Automation', description: 'Automated pipeline for all environments with approval gates' },
            { score: 5, label: 'Self-Service Platform', description: 'Platform engineering approach with self-service infrastructure provisioning' }
          ]
        },
        {
          text: 'How do you handle infrastructure state management?',
          description: 'Assess state management and drift detection practices',
          options: [
            { score: 1, label: 'No State Tracking', description: 'No systematic tracking of infrastructure state' },
            { score: 2, label: 'Local State', description: 'State files stored locally or in version control' },
            { score: 3, label: 'Remote State', description: 'Centralized remote state storage with locking' },
            { score: 4, label: 'State Management', description: 'Remote state with backup, versioning, and basic drift detection' },
            { score: 5, label: 'Advanced State Management', description: 'GitOps with automated drift detection, reconciliation, and alerting' }
          ]
        }
      ]
    },
    {
      name: 'Testing & Validation',
      description: 'Testing practices for infrastructure code',
      questions: [
        {
          text: 'What testing is performed on infrastructure code?',
          description: 'Evaluate testing practices and coverage',
          options: [
            { score: 1, label: 'No Testing', description: 'Infrastructure code is not tested before deployment' },
            { score: 2, label: 'Manual Testing', description: 'Manual validation in non-production environments' },
            { score: 3, label: 'Basic Automated Tests', description: 'Some automated validation and syntax checking' },
            { score: 4, label: 'Comprehensive Testing', description: 'Unit tests, integration tests, and policy validation' },
            { score: 5, label: 'Full Test Coverage', description: 'Complete test suite including contract testing, chaos engineering, and compliance validation' }
          ]
        },
        {
          text: 'How do you validate infrastructure changes before production?',
          description: 'Assess pre-production validation and preview capabilities',
          options: [
            { score: 1, label: 'No Validation', description: 'Changes are applied directly to production' },
            { score: 2, label: 'Manual Review', description: 'Manual review of proposed changes' },
            { score: 3, label: 'Plan/Preview', description: 'Automated plan/preview of changes before apply' },
            { score: 4, label: 'Staged Rollout', description: 'Changes validated in non-prod environments first' },
            { score: 5, label: 'Advanced Validation', description: 'Automated change impact analysis, cost estimation, security validation, and rollback planning' }
          ]
        }
      ]
    },
    {
      name: 'Security & Compliance',
      description: 'Security practices and compliance in infrastructure management',
      questions: [
        {
          text: 'How are secrets and sensitive data managed in infrastructure code?',
          description: 'Evaluate secrets management practices',
          options: [
            { score: 1, label: 'Hardcoded', description: 'Secrets are hardcoded in infrastructure code or config files' },
            { score: 2, label: 'Environment Variables', description: 'Secrets stored as environment variables or config files outside version control' },
            { score: 3, label: 'Secret Store', description: 'Basic secrets manager integration with manual secret rotation' },
            { score: 4, label: 'Automated Secrets', description: 'Secrets manager with automated rotation and access controls' },
            { score: 5, label: 'Zero-Trust Secrets', description: 'Dynamic secrets, just-in-time access, full encryption, automated rotation, and audit logging' }
          ]
        },
        {
          text: 'What security scanning and compliance checks are performed?',
          description: 'Assess security scanning and policy enforcement',
          options: [
            { score: 1, label: 'No Scanning', description: 'No security scanning or compliance checks' },
            { score: 2, label: 'Manual Reviews', description: 'Manual security reviews performed occasionally' },
            { score: 3, label: 'Basic Scanning', description: 'Automated security scanning in CI/CD pipeline' },
            { score: 4, label: 'Policy Enforcement', description: 'Policy as code with automated enforcement and blocking' },
            { score: 5, label: 'Comprehensive Security', description: 'Full security lifecycle with continuous compliance monitoring, automated remediation, and threat modeling' }
          ]
        }
      ]
    },
    {
      name: 'Monitoring & Observability',
      description: 'Observability and monitoring of infrastructure',
      questions: [
        {
          text: 'How do you monitor infrastructure changes and drift?',
          description: 'Evaluate infrastructure monitoring and alerting',
          options: [
            { score: 1, label: 'No Monitoring', description: 'Infrastructure changes are not monitored' },
            { score: 2, label: 'Basic Logging', description: 'Basic logs of infrastructure changes' },
            { score: 3, label: 'Change Tracking', description: 'Automated tracking of infrastructure changes with notifications' },
            { score: 4, label: 'Drift Detection', description: 'Automated drift detection with alerting and reporting' },
            { score: 5, label: 'Full Observability', description: 'Complete observability with change impact analysis, cost tracking, and predictive alerting' }
          ]
        },
        {
          text: 'What visibility do you have into infrastructure costs?',
          description: 'Assess cost visibility and optimization practices',
          options: [
            { score: 1, label: 'No Visibility', description: 'No systematic tracking of infrastructure costs' },
            { score: 2, label: 'Manual Tracking', description: 'Manual monthly cost reviews' },
            { score: 3, label: 'Basic Tagging', description: 'Resource tagging with basic cost allocation' },
            { score: 4, label: 'Cost Analytics', description: 'Automated cost tracking with budgets and alerts' },
            { score: 5, label: 'FinOps Practice', description: 'Full FinOps practice with cost optimization, forecasting, and showback/chargeback' }
          ]
        }
      ]
    },
    {
      name: 'Modularity & Reusability',
      description: 'Code organization, modularity, and reusability',
      questions: [
        {
          text: 'How is infrastructure code organized and modularized?',
          description: 'Evaluate code organization and module structure',
          options: [
            { score: 1, label: 'Monolithic', description: 'All infrastructure code in single files or minimal organization' },
            { score: 2, label: 'Basic Organization', description: 'Code organized by environment or service' },
            { score: 3, label: 'Modular', description: 'Reusable modules with basic documentation' },
            { score: 4, label: 'Well-Structured', description: 'Comprehensive module library with versioning and documentation' },
            { score: 5, label: 'Enterprise Modules', description: 'Private module registry, semantic versioning, automated testing, and governance' }
          ]
        },
        {
          text: 'How are infrastructure patterns standardized and shared?',
          description: 'Assess standardization and knowledge sharing',
          options: [
            { score: 1, label: 'No Standards', description: 'No standardized patterns or practices' },
            { score: 2, label: 'Informal Standards', description: 'Informal patterns shared through documentation' },
            { score: 3, label: 'Templates', description: 'Basic templates or blueprints for common patterns' },
            { score: 4, label: 'Pattern Library', description: 'Comprehensive pattern library with examples and best practices' },
            { score: 5, label: 'Platform Engineering', description: 'Self-service platform with standardized golden paths and automated provisioning' }
          ]
        }
      ]
    }
  ]
}

// Low maturity responses for TechStart Industries
// Target: ~35% maturity (average score 1.75)
// Distribution: mostly 1s and 2s, a couple of 3s showing some progress
const TECHSTART_RESPONSES = [
  // Category 1: Version Control & Code Quality
  { questionIndex: 0, score: 2, commentary: 'We have code in GitHub but no formal branching strategy yet. Team members commit directly to main.' },
  { questionIndex: 1, score: 1, commentary: 'No automated code quality checks. We rely on manual reviews when someone remembers to do them.' },

  // Category 2: Automation & CI/CD
  { questionIndex: 2, score: 1, commentary: 'Infrastructure changes are still applied manually using AWS console or CLI commands. We have some scripts but they are not integrated.' },
  { questionIndex: 3, score: 2, commentary: 'Using Terraform with local state files checked into Git (probably not best practice but works for now).' },

  // Category 3: Testing & Validation
  { questionIndex: 4, score: 1, commentary: 'We test changes by applying them to our dev environment and hoping for the best. No formal testing process.' },
  { questionIndex: 5, score: 2, commentary: 'We run terraform plan before applying changes, but that is the extent of our validation.' },

  // Category 4: Security & Compliance
  { questionIndex: 6, score: 1, commentary: 'Secrets are currently stored in .env files that are excluded from Git. Looking to improve this soon.' },
  { questionIndex: 7, score: 2, commentary: 'We manually check for obvious security issues during code review, but no automated scanning in place yet.' },

  // Category 5: Monitoring & Observability
  { questionIndex: 8, score: 1, commentary: 'We do not have any drift detection or monitoring. We discover changes when something breaks.' },
  { questionIndex: 9, score: 2, commentary: 'We review AWS billing monthly and tag some resources, but it is not comprehensive.' },

  // Category 6: Modularity & Reusability
  { questionIndex: 10, score: 2, commentary: 'Code is organized by environment (dev/staging/prod) but there is significant duplication across environments.' },
  { questionIndex: 11, score: 1, commentary: 'Each team member codes infrastructure their own way. No standardized patterns or templates yet.' }
]

async function main() {
  console.log('Starting sample assessment creation for TechStart Industries...\n')

  // 1. Find or create the IaC Maturity assessment type
  console.log('Step 1: Checking for Infrastructure as Code assessment type...')
  let assessmentType = await prisma.assessmentType.findFirst({
    where: { name: IAC_ASSESSMENT.name }
  })

  if (assessmentType) {
    console.log(`✓ Found existing assessment type: ${assessmentType.name} (${assessmentType.id})`)
  } else {
    console.log('Creating new assessment type...')
    assessmentType = await prisma.assessmentType.create({
      data: {
        name: IAC_ASSESSMENT.name,
        description: IAC_ASSESSMENT.description,
        version: IAC_ASSESSMENT.version,
        iconColor: IAC_ASSESSMENT.iconColor,
        isActive: true
      }
    })
    console.log(`✓ Created assessment type: ${assessmentType.name} (${assessmentType.id})`)

    // Create categories and questions
    console.log('\nStep 2: Creating categories and questions...')

    for (let catIndex = 0; catIndex < IAC_ASSESSMENT.categories.length; catIndex++) {
      const categoryData = IAC_ASSESSMENT.categories[catIndex]

      const category = await prisma.category.create({
        data: {
          assessmentTypeId: assessmentType.id,
          name: categoryData.name,
          description: categoryData.description,
          order: catIndex
        }
      })
      console.log(`  ✓ Created category: ${category.name}`)

      for (let qIndex = 0; qIndex < categoryData.questions.length; qIndex++) {
        const questionData = categoryData.questions[qIndex]

        const question = await prisma.question.create({
          data: {
            categoryId: category.id,
            text: questionData.text,
            description: questionData.description,
            order: qIndex
          }
        })

        // Create question options (maturity levels)
        for (const optionData of questionData.options) {
          await prisma.questionOption.create({
            data: {
              questionId: question.id,
              score: optionData.score,
              label: optionData.label,
              description: optionData.description
            }
          })
        }

        console.log(`    ✓ Created question: ${questionData.text.substring(0, 50)}...`)
      }
    }
  }

  // 2. Find or create customer
  console.log('\nStep 3: Finding or creating customer "TechStart Industries"...')
  let customer = await prisma.customer.findUnique({
    where: { name: 'TechStart Industries' }
  })

  if (customer) {
    console.log(`✓ Found existing customer: ${customer.name} (${customer.id})`)
  } else {
    customer = await prisma.customer.create({
      data: { name: 'TechStart Industries' }
    })
    console.log(`✓ Created customer: ${customer.name} (${customer.id})`)
  }

  // 3. Get all questions for the assessment type
  console.log('\nStep 4: Loading assessment questions...')
  const categories = await prisma.category.findMany({
    where: { assessmentTypeId: assessmentType.id },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  })

  const allQuestions = categories.flatMap(cat => cat.questions)
  console.log(`✓ Loaded ${allQuestions.length} questions`)

  // 4. Create the assessment
  console.log('\nStep 5: Creating sample assessment...')
  const assessment = await prisma.assessment.create({
    data: {
      name: 'Q4 2025 IaC Maturity Assessment',
      customerName: customer.name,
      customerId: customer.id,
      assessmentTypeId: assessmentType.id,
      createdBy: 'system',
      status: 'completed'
    }
  })
  console.log(`✓ Created assessment: ${assessment.name} (${assessment.id})`)

  // 5. Add responses
  console.log('\nStep 6: Adding responses (showing low maturity ~35%)...')
  let totalScore = 0

  for (const responseData of TECHSTART_RESPONSES) {
    const question = allQuestions[responseData.questionIndex]

    if (!question) {
      console.warn(`⚠ Warning: Could not find question at index ${responseData.questionIndex}`)
      continue
    }

    await prisma.response.create({
      data: {
        assessmentId: assessment.id,
        questionId: question.id,
        score: responseData.score,
        commentary: responseData.commentary
      }
    })

    totalScore += responseData.score
  }

  const avgScore = totalScore / TECHSTART_RESPONSES.length
  const maturityPercent = ((avgScore - 1) / 4 * 100).toFixed(1) // Convert 1-5 scale to 0-100%

  console.log(`✓ Added ${TECHSTART_RESPONSES.length} responses`)
  console.log(`\n📊 Assessment Summary:`)
  console.log(`   Customer: TechStart Industries`)
  console.log(`   Assessment: Q4 2025 IaC Maturity Assessment`)
  console.log(`   Average Score: ${avgScore.toFixed(2)} / 5.0`)
  console.log(`   Maturity Level: ${maturityPercent}%`)
  console.log(`   Status: Completed`)
  console.log(`\n✅ Sample assessment created successfully!`)
  console.log(`\nYou can view it at: http://localhost:3005/assessments/${assessment.id}/results`)
}

main()
  .catch((e) => {
    console.error('Error creating sample assessment:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
