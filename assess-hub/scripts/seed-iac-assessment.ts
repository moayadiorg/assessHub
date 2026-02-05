import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting IaC Maturity Assessment seed...');

  // Step 1: Create or find the customer
  const customer = await prisma.customer.upsert({
    where: { name: 'Acme Corporation' },
    update: {},
    create: {
      name: 'Acme Corporation',
    },
  });
  console.log(`✓ Customer: ${customer.name} (${customer.id})`);

  // Step 2: Create or find the IaC Maturity assessment type
  let assessmentType = await prisma.assessmentType.findFirst({
    where: { name: 'Infrastructure as Code Maturity' },
  });

  if (!assessmentType) {
    assessmentType = await prisma.assessmentType.create({
      data: {
        name: 'Infrastructure as Code Maturity',
        description: 'Evaluate organizational maturity in Infrastructure as Code practices, tooling, and processes',
        version: '1.0',
        iconColor: '#8b5cf6',
        isActive: true,
      },
    });
    console.log(`✓ Created Assessment Type: ${assessmentType.name}`);

    // Step 3: Create categories with questions
    const categoriesData = [
      {
        name: 'Version Control',
        description: 'Source control practices for infrastructure code',
        order: 1,
        questions: [
          {
            text: 'How is infrastructure code version controlled?',
            description: 'Evaluate the use of version control systems for IaC',
            order: 1,
            options: [
              { score: 1, label: 'Ad-hoc', description: 'No version control; infrastructure code stored locally or in shared drives' },
              { score: 2, label: 'Basic', description: 'Some infrastructure code in version control, but inconsistent usage' },
              { score: 3, label: 'Standardized', description: 'All infrastructure code in version control with basic branching strategy' },
              { score: 4, label: 'Managed', description: 'Version control with pull request workflow, code reviews, and branch protection' },
              { score: 5, label: 'Optimized', description: 'Advanced version control with automated workflows, semantic versioning, and release management' },
            ],
          },
          {
            text: 'What is the branching and merging strategy?',
            description: 'Assess branching model and merge practices',
            order: 2,
            options: [
              { score: 1, label: 'Ad-hoc', description: 'No defined branching strategy; changes made directly to main branch' },
              { score: 2, label: 'Basic', description: 'Simple feature branches but inconsistent merge practices' },
              { score: 3, label: 'Standardized', description: 'Defined branching strategy (GitFlow, trunk-based) consistently followed' },
              { score: 4, label: 'Managed', description: 'Advanced branching with automated merge checks and conflict resolution processes' },
              { score: 5, label: 'Optimized', description: 'Sophisticated branching with automated release trains and environment promotion' },
            ],
          },
        ],
      },
      {
        name: 'CI/CD Pipeline',
        description: 'Automation of infrastructure deployment',
        order: 2,
        questions: [
          {
            text: 'How is infrastructure provisioned and deployed?',
            description: 'Evaluate automation level of infrastructure deployment',
            order: 1,
            options: [
              { score: 1, label: 'Manual', description: 'Manual deployment through console or CLI by individuals' },
              { score: 2, label: 'Scripted', description: 'Some automation scripts but require manual execution' },
              { score: 3, label: 'Automated', description: 'CI/CD pipeline for infrastructure deployment to some environments' },
              { score: 4, label: 'Continuous', description: 'Fully automated CI/CD across all environments with approval gates' },
              { score: 5, label: 'Self-service', description: 'Self-service infrastructure provisioning with policy-based automation and rollback capabilities' },
            ],
          },
          {
            text: 'What validation occurs before infrastructure changes are applied?',
            description: 'Pre-deployment validation and testing',
            order: 2,
            options: [
              { score: 1, label: 'None', description: 'No validation; changes applied directly to production' },
              { score: 2, label: 'Manual', description: 'Manual review and validation before deployment' },
              { score: 3, label: 'Basic Automation', description: 'Automated syntax validation and basic checks in pipeline' },
              { score: 4, label: 'Comprehensive', description: 'Automated validation including plan review, cost estimation, and compliance checks' },
              { score: 5, label: 'Predictive', description: 'Advanced validation with impact analysis, drift detection, and predictive testing' },
            ],
          },
        ],
      },
      {
        name: 'Testing Practices',
        description: 'Quality assurance for infrastructure code',
        order: 3,
        questions: [
          {
            text: 'What types of testing are performed on infrastructure code?',
            description: 'Assess testing coverage and practices',
            order: 1,
            options: [
              { score: 1, label: 'None', description: 'No testing; changes validated in production only' },
              { score: 2, label: 'Ad-hoc', description: 'Occasional manual testing in development environments' },
              { score: 3, label: 'Unit Testing', description: 'Automated unit tests for infrastructure modules' },
              { score: 4, label: 'Integration Testing', description: 'Unit and integration tests with automated test environments' },
              { score: 5, label: 'Full Coverage', description: 'Comprehensive testing including unit, integration, compliance, and chaos engineering' },
            ],
          },
          {
            text: 'How is infrastructure drift detected and managed?',
            description: 'Drift detection and remediation practices',
            order: 2,
            options: [
              { score: 1, label: 'Unmanaged', description: 'No drift detection; manual changes common and untracked' },
              { score: 2, label: 'Reactive', description: 'Drift discovered when issues occur; manual investigation' },
              { score: 3, label: 'Periodic Detection', description: 'Scheduled drift detection runs with manual remediation' },
              { score: 4, label: 'Continuous Detection', description: 'Continuous drift detection with alerts and semi-automated remediation' },
              { score: 5, label: 'Prevention', description: 'Drift prevention through policy enforcement and automated remediation' },
            ],
          },
        ],
      },
      {
        name: 'Security Scanning',
        description: 'Security practices for infrastructure code',
        order: 4,
        questions: [
          {
            text: 'How are security vulnerabilities identified in infrastructure code?',
            description: 'Security scanning and vulnerability management',
            order: 1,
            options: [
              { score: 1, label: 'None', description: 'No security scanning; reactive to incidents' },
              { score: 2, label: 'Manual', description: 'Periodic manual security reviews by security team' },
              { score: 3, label: 'Basic Scanning', description: 'Automated security scanning in CI/CD for known vulnerabilities' },
              { score: 4, label: 'Comprehensive', description: 'Multi-layer scanning including SAST, secrets detection, and compliance checks' },
              { score: 5, label: 'Proactive', description: 'Advanced security with policy-as-code, threat modeling, and continuous compliance monitoring' },
            ],
          },
          {
            text: 'How are secrets and sensitive data managed in infrastructure code?',
            description: 'Secrets management practices',
            order: 2,
            options: [
              { score: 1, label: 'Hardcoded', description: 'Secrets hardcoded in infrastructure code or scripts' },
              { score: 2, label: 'Environment Variables', description: 'Secrets in environment variables or configuration files' },
              { score: 3, label: 'Secret Store', description: 'Centralized secret store with manual secret rotation' },
              { score: 4, label: 'Dynamic Secrets', description: 'Dynamic secrets with automated rotation and least privilege access' },
              { score: 5, label: 'Zero Trust', description: 'Zero-trust security model with workload identity and just-in-time access' },
            ],
          },
        ],
      },
      {
        name: 'Documentation',
        description: 'Documentation practices for infrastructure',
        order: 5,
        questions: [
          {
            text: 'How is infrastructure documented?',
            description: 'Documentation quality and maintenance',
            order: 1,
            options: [
              { score: 1, label: 'None', description: 'No documentation; tribal knowledge only' },
              { score: 2, label: 'Ad-hoc', description: 'Scattered documentation in wikis or shared drives, often outdated' },
              { score: 3, label: 'Maintained', description: 'Documentation co-located with code, updated with changes' },
              { score: 4, label: 'Automated', description: 'Auto-generated documentation from infrastructure code and metadata' },
              { score: 5, label: 'Interactive', description: 'Living documentation with diagrams, examples, and automated updates from live environments' },
            ],
          },
          {
            text: 'How are architectural decisions recorded?',
            description: 'Architecture decision records and knowledge sharing',
            order: 2,
            options: [
              { score: 1, label: 'None', description: 'No formal decision recording process' },
              { score: 2, label: 'Informal', description: 'Decisions discussed in meetings but not documented' },
              { score: 3, label: 'Basic ADRs', description: 'Architecture Decision Records (ADRs) maintained for major decisions' },
              { score: 4, label: 'Comprehensive', description: 'All architectural decisions documented with context and rationale' },
              { score: 5, label: 'Knowledge Hub', description: 'Searchable knowledge base with decision history, impact analysis, and lessons learned' },
            ],
          },
        ],
      },
      {
        name: 'Modularity & Reusability',
        description: 'Code organization and reuse practices',
        order: 6,
        questions: [
          {
            text: 'How is infrastructure code organized and modularized?',
            description: 'Code structure and modularity',
            order: 1,
            options: [
              { score: 1, label: 'Monolithic', description: 'Large monolithic files with duplicated code across projects' },
              { score: 2, label: 'Basic Separation', description: 'Some separation by environment or service but high duplication' },
              { score: 3, label: 'Modular', description: 'Reusable modules created for common patterns' },
              { score: 4, label: 'Library', description: 'Internal module library with versioning and documentation' },
              { score: 5, label: 'Platform', description: 'Self-service platform with composition of certified modules and guardrails' },
            ],
          },
          {
            text: 'How are infrastructure modules shared across teams?',
            description: 'Module sharing and governance',
            order: 2,
            options: [
              { score: 1, label: 'None', description: 'No sharing; each team builds from scratch' },
              { score: 2, label: 'Copy-Paste', description: 'Code copied between projects with no version control' },
              { score: 3, label: 'Centralized Repo', description: 'Shared repository of modules with version control' },
              { score: 4, label: 'Module Registry', description: 'Private module registry with semantic versioning and change logs' },
              { score: 5, label: 'Marketplace', description: 'Internal marketplace with certified modules, usage analytics, and automated updates' },
            ],
          },
        ],
      },
    ];

    for (const categoryData of categoriesData) {
      const category = await prisma.category.create({
        data: {
          assessmentTypeId: assessmentType.id,
          name: categoryData.name,
          description: categoryData.description,
          order: categoryData.order,
        },
      });
      console.log(`  ✓ Category: ${category.name}`);

      for (const questionData of categoryData.questions) {
        const question = await prisma.question.create({
          data: {
            categoryId: category.id,
            text: questionData.text,
            description: questionData.description,
            order: questionData.order,
          },
        });

        for (const optionData of questionData.options) {
          await prisma.questionOption.create({
            data: {
              questionId: question.id,
              score: optionData.score,
              label: optionData.label,
              description: optionData.description,
            },
          });
        }
        console.log(`    ✓ Question: ${questionData.text.substring(0, 50)}...`);
      }
    }
  } else {
    console.log(`✓ Assessment Type already exists: ${assessmentType.name}`);
  }

  // Step 4: Get all questions for the assessment type
  const categories = await prisma.category.findMany({
    where: { assessmentTypeId: assessmentType.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  const allQuestions = categories.flatMap(cat => cat.questions);
  console.log(`✓ Found ${allQuestions.length} questions across ${categories.length} categories`);

  // Step 5: Create a completed assessment with moderate maturity (65% target)
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
  console.log(`✓ Created Assessment: ${assessment.name} (${assessment.id})`);

  // Step 6: Create responses with scores targeting ~65% maturity (avg score ~3.25 out of 5)
  // This represents moderate maturity - some automation and standards in place, but room for improvement
  const responseScores = [
    // Version Control - showing good practices (avg 3.5)
    { categoryIndex: 0, questionIndex: 0, score: 4, commentary: 'All IaC code is in GitHub with protected main branch and PR workflow. Code reviews are mandatory.' },
    { categoryIndex: 0, questionIndex: 1, score: 3, commentary: 'We follow GitFlow with main, develop, and feature branches. Merge process is standardized but could be more automated.' },

    // CI/CD Pipeline - moderate automation (avg 3.0)
    { categoryIndex: 1, questionIndex: 0, score: 3, commentary: 'GitHub Actions deploys to dev automatically, staging with approval, prod requires manual trigger. Working toward full automation.' },
    { categoryIndex: 1, questionIndex: 1, score: 3, commentary: 'Pipeline validates syntax, runs linting, and generates Terraform plans for review. Want to add cost estimation.' },

    // Testing - basic coverage (avg 2.5)
    { categoryIndex: 2, questionIndex: 0, score: 3, commentary: 'Unit tests exist for critical modules using Terratest. Integration testing is manual for now.' },
    { categoryIndex: 2, questionIndex: 1, score: 2, commentary: 'Drift is detected when problems occur. No automated scanning yet, but it\'s on the roadmap.' },

    // Security - improving but gaps remain (avg 3.5)
    { categoryIndex: 3, questionIndex: 0, score: 4, commentary: 'We use tfsec and Checkov in CI/CD. Findings are reviewed before merge. Want to add policy-as-code.' },
    { categoryIndex: 3, questionIndex: 1, score: 3, commentary: 'Secrets are in AWS Secrets Manager and HashiCorp Vault. Rotation is mostly manual, working on automating it.' },

    // Documentation - needs improvement (avg 3.0)
    { categoryIndex: 4, questionIndex: 0, score: 3, commentary: 'README files in each repo with usage examples. Documentation is updated with PRs but not auto-generated.' },
    { categoryIndex: 4, questionIndex: 1, score: 3, commentary: 'We started using ADRs 6 months ago for major decisions. Still building the habit across all teams.' },

    // Modularity - good foundation (avg 4.0)
    { categoryIndex: 5, questionIndex: 0, score: 4, commentary: 'Common patterns are in shared modules with clear interfaces. Each service has its own repo referencing these.' },
    { categoryIndex: 5, questionIndex: 1, score: 4, commentary: 'Private Terraform registry with semantic versioning. Usage is growing but not yet universal across teams.' },
  ];

  for (const response of responseScores) {
    const question = categories[response.categoryIndex].questions[response.questionIndex];
    await prisma.response.create({
      data: {
        assessmentId: assessment.id,
        questionId: question.id,
        score: response.score,
        commentary: response.commentary,
      },
    });
  }

  // Calculate and display the average score
  const avgScore = responseScores.reduce((sum, r) => sum + r.score, 0) / responseScores.length;
  const percentScore = (avgScore / 5) * 100;

  console.log(`✓ Created ${responseScores.length} responses`);
  console.log(`\n📊 Assessment Results:`);
  console.log(`   Average Score: ${avgScore.toFixed(2)} / 5.00`);
  console.log(`   Maturity Level: ${percentScore.toFixed(1)}%`);
  console.log(`   Status: ${assessment.status}`);
  console.log(`\n✅ Seed completed successfully!`);
  console.log(`\n🌐 View the assessment at: http://localhost:3005/assessments/${assessment.id}/results`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
