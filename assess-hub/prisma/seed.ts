import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MATURITY_LABELS = ['Initial', 'Managed', 'Defined', 'Quantitative', 'Optimizing']

function maturityOption(score: number, description: string) {
  return { score, label: MATURITY_LABELS[score - 1], description }
}

const IAC_MATURITY_LABELS = ['Ad Hoc', 'Developing', 'Defined', 'Managed', 'Optimized']

function iacOption(score: number, description: string) {
  return { score, label: IAC_MATURITY_LABELS[score - 1], description }
}

async function main() {
  // ── Users ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin User', role: 'admin', isActive: true },
  })

  const readerUser = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: { email: 'reader@example.com', name: 'Reader User', role: 'reader', isActive: true },
  })

  const assessorUser = await prisma.user.upsert({
    where: { email: 'assessor@example.com' },
    update: {},
    create: { email: 'assessor@example.com', name: 'Assessor User', role: 'sa', isActive: true },
  })

  const moayadUser = await prisma.user.upsert({
    where: { email: 'moayad.ismail@gmail.com' },
    update: {},
    create: { email: 'moayad.ismail@gmail.com', name: 'Moayad Ismail', role: 'admin', isActive: true },
  })

  console.log('✅ Users created')

  // ── Customers ──────────────────────────────────────────────────────
  const customers = await Promise.all(
    [
      'Acme Corp',
      'TechStart Inc',
      'GlobalBank',
      'HealthFirst Solutions',
      'RetailMax',
    ].map((name) =>
      prisma.customer.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )
  console.log('✅ Customers created:', customers.length)

  // Helper: create assessment type only if it doesn't exist
  async function findOrCreateType(
    name: string,
    data: Parameters<typeof prisma.assessmentType.create>[0]['data']
  ) {
    const existing = await prisma.assessmentType.findFirst({
      where: { name },
      include: { categories: { include: { questions: true } } },
    })
    if (existing) {
      console.log(`⏭️  Assessment Type already exists: ${name}`)
      return existing
    }
    const created = await prisma.assessmentType.create({
      data,
      include: { categories: { include: { questions: true } } },
    })
    console.log(`✅ Assessment Type created: ${name}`)
    return created
  }

  // Helper: create assessment only if it doesn't exist (by name + customer)
  async function findOrCreateAssessment(
    name: string,
    customerName: string,
    data: Parameters<typeof prisma.assessment.create>[0]['data']
  ) {
    const existing = await prisma.assessment.findFirst({
      where: { name, customerName },
    })
    if (existing) {
      console.log(`⏭️  Assessment already exists: ${customerName} - ${name}`)
      return existing
    }
    const created = await prisma.assessment.create({ data })
    console.log(`✅ Assessment created: ${customerName} - ${name}`)
    return created
  }

  // ── Assessment Type 1: Cloud Infrastructure Maturity ───────────────
  const cloudType = await findOrCreateType('Cloud Infrastructure Maturity', {
    name: 'Cloud Infrastructure Maturity',
    description: 'Evaluate cloud infrastructure practices including IaC, CI/CD, monitoring, security, and cost management.',
    version: '2.0',
    iconColor: '#3b82f6',
    categories: {
      create: [
        {
          name: 'Infrastructure as Code',
          description: 'Maturity of infrastructure automation and codification practices.',
          order: 1,
          questions: {
            create: [
              {
                text: 'How is infrastructure provisioned?',
                description: 'Evaluate the level of automation in infrastructure provisioning.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'All infrastructure is provisioned manually via console/portal.'),
                    maturityOption(2, 'Some scripts exist but are not version-controlled or standardized.'),
                    maturityOption(3, 'IaC tools (Terraform, CloudFormation) are used for most resources with version control.'),
                    maturityOption(4, 'All infrastructure is codified, peer-reviewed, and deployed via CI/CD pipelines.'),
                    maturityOption(5, 'Self-service platforms with policy-as-code guardrails; drift detection and auto-remediation.'),
                  ],
                },
              },
              {
                text: 'How are IaC modules managed and shared?',
                description: 'Evaluate reusability and governance of infrastructure modules.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'No modules; everything is copy-pasted or written inline.'),
                    maturityOption(2, 'Some shared scripts/templates exist but are not versioned.'),
                    maturityOption(3, 'Versioned module registry with documented modules for common patterns.'),
                    maturityOption(4, 'Internal module marketplace with automated testing and semantic versioning.'),
                    maturityOption(5, 'Composable platform with golden paths; modules auto-tested, published, and discoverable.'),
                  ],
                },
              },
              {
                text: 'How is infrastructure state managed?',
                description: 'Evaluate state management practices for IaC.',
                order: 3,
                options: {
                  create: [
                    maturityOption(1, 'No state tracking; infrastructure is imperatively managed.'),
                    maturityOption(2, 'Local state files with manual backups.'),
                    maturityOption(3, 'Remote state backend (S3, GCS) with locking.'),
                    maturityOption(4, 'State is segmented by environment/team with access controls and encryption.'),
                    maturityOption(5, 'Automated state management with drift detection, import tooling, and disaster recovery.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'CI/CD Pipelines',
          description: 'Maturity of continuous integration and deployment practices.',
          order: 2,
          questions: {
            create: [
              {
                text: 'How are application deployments handled?',
                description: 'Evaluate the deployment process maturity.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'Manual deployments via SSH, FTP, or console uploads.'),
                    maturityOption(2, 'Basic scripts automate some deployment steps.'),
                    maturityOption(3, 'CI/CD pipelines automate build, test, and deploy for most services.'),
                    maturityOption(4, 'Canary/blue-green deployments with automated rollback on failure.'),
                    maturityOption(5, 'Progressive delivery with feature flags, A/B testing, and automated promotion.'),
                  ],
                },
              },
              {
                text: 'How is pipeline security enforced?',
                description: 'Evaluate security practices within CI/CD.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'No security scanning in pipelines.'),
                    maturityOption(2, 'Ad-hoc security checks run manually before releases.'),
                    maturityOption(3, 'SAST/DAST/SCA integrated into pipelines for all projects.'),
                    maturityOption(4, 'Security gates block deployments; secrets scanning and SBOM generation.'),
                    maturityOption(5, 'Supply chain security with signed artifacts, attestations, and SLSA compliance.'),
                  ],
                },
              },
              {
                text: 'What is the deployment frequency?',
                description: 'How often do teams deploy to production?',
                order: 3,
                options: {
                  create: [
                    maturityOption(1, 'Quarterly or less frequent releases.'),
                    maturityOption(2, 'Monthly release cycles with manual coordination.'),
                    maturityOption(3, 'Bi-weekly or weekly releases with automated pipelines.'),
                    maturityOption(4, 'Daily deployments with high confidence and low failure rate.'),
                    maturityOption(5, 'On-demand deployments multiple times per day; trunk-based development.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Observability & Monitoring',
          description: 'Maturity of monitoring, logging, and observability practices.',
          order: 3,
          questions: {
            create: [
              {
                text: 'How is application monitoring handled?',
                description: 'Evaluate monitoring and alerting maturity.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'No monitoring; issues found by users or manual checks.'),
                    maturityOption(2, 'Basic uptime checks and server-level metrics.'),
                    maturityOption(3, 'APM, structured logging, and dashboards for key services.'),
                    maturityOption(4, 'Full observability stack (metrics, logs, traces) with SLOs and error budgets.'),
                    maturityOption(5, 'AIOps with anomaly detection, auto-remediation, and predictive alerting.'),
                  ],
                },
              },
              {
                text: 'How are incidents managed?',
                description: 'Evaluate incident response maturity.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'No incident process; fire-fighting approach.'),
                    maturityOption(2, 'Basic on-call rotation with manual escalation.'),
                    maturityOption(3, 'Defined incident process with runbooks and post-mortems.'),
                    maturityOption(4, 'Automated incident detection, routing, and communication with SLA tracking.'),
                    maturityOption(5, 'Chaos engineering practices; incidents drive systemic improvements.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Security & Compliance',
          description: 'Maturity of cloud security and compliance practices.',
          order: 4,
          questions: {
            create: [
              {
                text: 'How is identity and access managed?',
                description: 'Evaluate IAM practices.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'Shared credentials; root/admin accounts used directly.'),
                    maturityOption(2, 'Individual accounts exist but with broad permissions.'),
                    maturityOption(3, 'RBAC implemented with SSO; regular access reviews.'),
                    maturityOption(4, 'Least-privilege enforced via policy-as-code; just-in-time access.'),
                    maturityOption(5, 'Zero-trust architecture with continuous verification and automated rotation.'),
                  ],
                },
              },
              {
                text: 'How are compliance requirements managed?',
                description: 'Evaluate compliance automation.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'Compliance is handled manually with spreadsheets.'),
                    maturityOption(2, 'Some compliance checks exist but are periodic and manual.'),
                    maturityOption(3, 'Compliance-as-code for key frameworks (SOC2, ISO27001).'),
                    maturityOption(4, 'Continuous compliance monitoring with automated evidence collection.'),
                    maturityOption(5, 'Real-time compliance dashboards; automated remediation and audit trails.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Cost Management',
          description: 'Maturity of cloud cost optimization practices.',
          order: 5,
          questions: {
            create: [
              {
                text: 'How is cloud spending tracked?',
                description: 'Evaluate cost visibility and allocation.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'No cost tracking; bills are paid without analysis.'),
                    maturityOption(2, 'Monthly bill review by finance; no team-level allocation.'),
                    maturityOption(3, 'Cost allocation tags; team-level dashboards and budgets.'),
                    maturityOption(4, 'Showback/chargeback model with anomaly detection and forecasting.'),
                    maturityOption(5, 'FinOps practice with real-time optimization, unit economics, and automated rightsizing.'),
                  ],
                },
              },
              {
                text: 'How are resources rightsized?',
                description: 'Evaluate resource optimization practices.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'Resources are over-provisioned with no review.'),
                    maturityOption(2, 'Occasional manual review of large resources.'),
                    maturityOption(3, 'Regular rightsizing reviews using cloud provider tools.'),
                    maturityOption(4, 'Automated recommendations with scheduled optimization cycles.'),
                    maturityOption(5, 'Autonomous scaling and optimization with ML-based prediction.'),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  })

  // ── Assessment Type 2: DevOps Practices ────────────────────────────
  const devopsType = await findOrCreateType('DevOps Practices', {
    name: 'DevOps Practices',
    description: 'Assess DevOps culture, automation, and collaboration practices across the organization.',
    version: '1.0',
    iconColor: '#8b5cf6',
    categories: {
      create: [
        {
          name: 'Culture & Collaboration',
          description: 'Team culture, communication, and cross-functional collaboration.',
          order: 1,
          questions: {
            create: [
              {
                text: 'How do development and operations teams collaborate?',
                description: 'Evaluate cross-functional teamwork.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'Siloed teams with handoffs via tickets; blame culture.'),
                    maturityOption(2, 'Some joint meetings but separate goals and metrics.'),
                    maturityOption(3, 'Shared responsibilities; dev teams participate in on-call.'),
                    maturityOption(4, '"You build it, you run it" model; shared OKRs and retrospectives.'),
                    maturityOption(5, 'Fully integrated product teams with embedded SRE; learning culture.'),
                  ],
                },
              },
              {
                text: 'How is knowledge shared across teams?',
                description: 'Evaluate documentation and knowledge sharing.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'Knowledge lives in individuals\' heads; tribal knowledge.'),
                    maturityOption(2, 'Some wikis exist but are outdated and fragmented.'),
                    maturityOption(3, 'Centralized documentation with regular updates; tech talks.'),
                    maturityOption(4, 'Inner-source model; communities of practice; documentation-as-code.'),
                    maturityOption(5, 'Learning organization with structured knowledge bases, mentorship, and innovation time.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Version Control & Branching',
          description: 'Source control practices and branching strategies.',
          order: 2,
          questions: {
            create: [
              {
                text: 'What version control practices are used?',
                description: 'Evaluate source control maturity.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'No version control or inconsistent use.'),
                    maturityOption(2, 'Git used but with long-lived branches and rare merges.'),
                    maturityOption(3, 'Git flow or similar strategy; PRs with code reviews.'),
                    maturityOption(4, 'Trunk-based development with short-lived branches and automated checks.'),
                    maturityOption(5, 'Continuous integration to main with feature flags; automated quality gates.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Testing Practices',
          description: 'Automated testing and quality assurance.',
          order: 3,
          questions: {
            create: [
              {
                text: 'What level of automated testing exists?',
                description: 'Evaluate test automation maturity.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'No automated tests; all testing is manual.'),
                    maturityOption(2, 'Some unit tests exist but coverage is low and inconsistent.'),
                    maturityOption(3, 'Unit, integration, and e2e tests with >70% coverage targets.'),
                    maturityOption(4, 'TDD/BDD practices; contract testing; performance testing in CI.'),
                    maturityOption(5, 'Comprehensive test pyramid; mutation testing; testing in production.'),
                  ],
                },
              },
              {
                text: 'How are test environments managed?',
                description: 'Evaluate test environment practices.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'Shared, long-lived test environments that are often broken.'),
                    maturityOption(2, 'Dedicated environments per team but manually maintained.'),
                    maturityOption(3, 'Environments created on-demand via IaC; cleaned up regularly.'),
                    maturityOption(4, 'Ephemeral environments per PR/branch; production-like data seeding.'),
                    maturityOption(5, 'Full production parity with service virtualization and synthetic data.'),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  })

  // ── Assessment Type 3: Data Platform Maturity ──────────────────────
  const dataType = await findOrCreateType('Data Platform Maturity', {
    name: 'Data Platform Maturity',
    description: 'Evaluate data engineering, governance, and analytics capabilities.',
    version: '1.0',
    iconColor: '#f59e0b',
    categories: {
      create: [
        {
          name: 'Data Governance',
          description: 'Data quality, cataloging, and stewardship.',
          order: 1,
          questions: {
            create: [
              {
                text: 'How is data quality managed?',
                description: 'Evaluate data quality practices.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'No data quality checks; issues found downstream.'),
                    maturityOption(2, 'Ad-hoc validation scripts run occasionally.'),
                    maturityOption(3, 'Data quality framework with automated checks in pipelines.'),
                    maturityOption(4, 'Data contracts between producers and consumers; SLAs for data quality.'),
                    maturityOption(5, 'ML-powered anomaly detection; data quality scores visible across the org.'),
                  ],
                },
              },
              {
                text: 'How is data cataloged and discoverable?',
                description: 'Evaluate data discoverability.',
                order: 2,
                options: {
                  create: [
                    maturityOption(1, 'No catalog; people ask around to find data.'),
                    maturityOption(2, 'Spreadsheet-based inventory of key datasets.'),
                    maturityOption(3, 'Data catalog tool with metadata and search.'),
                    maturityOption(4, 'Automated lineage tracking; business glossary; data owners assigned.'),
                    maturityOption(5, 'Self-service data marketplace with quality scores, usage metrics, and recommendations.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Data Pipelines',
          description: 'ETL/ELT, orchestration, and data processing.',
          order: 2,
          questions: {
            create: [
              {
                text: 'How are data pipelines built and managed?',
                description: 'Evaluate pipeline engineering practices.',
                order: 1,
                options: {
                  create: [
                    maturityOption(1, 'Manual data extracts and spreadsheet transformations.'),
                    maturityOption(2, 'Cron jobs and scripts with minimal error handling.'),
                    maturityOption(3, 'Orchestration tool (Airflow, Dagster) with version-controlled pipelines.'),
                    maturityOption(4, 'Declarative pipelines with data contracts, testing, and monitoring.'),
                    maturityOption(5, 'Real-time and batch unified platform with self-service pipeline creation.'),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  })

  // ── Assessment Type 4: HashiCorp IaC Capability Maturity ───────────
  const iacType = await findOrCreateType('HashiCorp IaC Capability Maturity', {
    name: 'HashiCorp IaC Capability Maturity',
    description: 'Assess IaC capability maturity across automation workflows, quality standards, security & compliance, lifecycle management, and operational excellence. Aligned to HashiCorp\'s Infrastructure Lifecycle Management framework.',
    version: '1.0',
    iconColor: '#7B42BC',
    categories: {
      create: [
        {
          name: 'Automation Workflows',
          description: 'Architect standardized IaC workflows to ensure consistent releases across environments, maximize efficiency and foster collaboration.',
          order: 1,
          questions: {
            create: [
              {
                text: 'IaC Workflow',
                description: 'Evaluate the maturity of IaC workflow and release processes.',
                order: 1,
                options: {
                  create: [
                    iacOption(1, 'No defined IaC workflow. Manual infrastructure changes. Infrastructure changes initiated by user using developer driven plan and apply.'),
                    iacOption(2, 'Basic Git structure defined. Inconsistent branching strategy, duplication of code with unclear release process across environments. Releases may require manual code intervention or copy changes due to unstructured release workflow.'),
                    iacOption(3, 'Documented IaC workflow. Basic branching strategy. Using common code with environment specific variables.'),
                    iacOption(4, 'Automated GitOps driven IaC. Enforced branch protection. Consistently structured repos and consistent release process across environments.'),
                    iacOption(5, 'Standardized GitOps driven IaC. Git structure is provided via self-service using IaC and integrated with secrets management without additional consumer integration effort. Branch protect rules are enforced and git approval required by policy for critical workloads.'),
                  ],
                },
              },
              {
                text: 'Collaboration',
                description: 'Evaluate team alignment, module sharing, and RBAC for IaC.',
                order: 2,
                options: {
                  create: [
                    iacOption(1, 'No team alignment for IaC. No shared module library. Lack of RBAC consideration. Local state management.'),
                    iacOption(2, 'Some team structure around IaC. Ad-hoc module sharing. Basic RBAC.'),
                    iacOption(3, 'Defined team roles for IaC. Shared module library initiated. RBAC implemented.'),
                    iacOption(4, 'IaC-aligned team structure. Managed shared modules. RBAC considers self-service consumption with guard rails.'),
                    iacOption(5, 'Cross-functional IaC teams. Shared optimized module library managed as a product with continual improvement and collaborative feedback. RBAC considers self-service consumption with guard rails. Module consumption enforced through policy controls.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Quality Standards',
          description: 'Implement and enforce IaC development and testing standards across the organization to ensure consistent quality.',
          order: 2,
          questions: {
            create: [
              {
                text: 'Testing',
                description: 'Evaluate IaC testing framework and practices.',
                order: 1,
                options: {
                  create: [
                    iacOption(1, 'No testing framework in place; testing is manual and developer initiated through via plan and apply. Tests not written for modules.'),
                    iacOption(2, 'Inconsistent application of testing, using terraform test in parts.'),
                    iacOption(3, 'Consistent test approach defined but not fully implemented.'),
                    iacOption(4, 'Documented Test Framework. Testing is leveraged during module development process. Not yet integrated into module publishing to gate release quality.'),
                    iacOption(5, 'Automated testing integrated to publishing process, negative testing for input validation; test process also encompasses consumer example tests with policy; module testing includes provider constraint ranges.'),
                  ],
                },
              },
              {
                text: 'Publishing',
                description: 'Evaluate module publishing processes and standards.',
                order: 2,
                options: {
                  create: [
                    iacOption(1, 'Not publishing modules to a private registry, sourced from git or use of local modules using latest version.'),
                    iacOption(2, 'Manual module publishing process to a private registry, inconsistent publishing standards (example usage of docs and examples), not all consumers using version constraints.'),
                    iacOption(3, 'Documented publishing process, some attempts at automation but not fully integrated.'),
                    iacOption(4, 'Publishing process is mostly automated and integrated with CI/CD pipelines; manual overrides minimal, but testing not enforced in publishing.'),
                    iacOption(5, 'Automated and efficient publishing process, testing enforced as part of publishing process through CI/CD, ensuring consistent and high quality releases. Publishing reviews enforced through branch protection and approvals.'),
                  ],
                },
              },
              {
                text: 'Versioning',
                description: 'Evaluate versioning strategy for modules.',
                order: 3,
                options: {
                  create: [
                    iacOption(1, 'No versioning strategy, left to individual developer.'),
                    iacOption(2, 'Initial versioning attempts are inconsistent; some teams use semantic versioning but with no enforcement. Consumers not provided clear guidelines on use of constraints.'),
                    iacOption(3, 'Use of versioning is defined and follows semantic versioning. Use of version constraints by consumers inconsistent.'),
                    iacOption(4, 'Consistent use of semantic versioning, with standards in place for module producers and consumers. Consumer module lifecycle and deprecation not tracked over time.'),
                    iacOption(5, 'Consistent use of semantic versioning, with standards in place for module producers and consumers. Module lifecycle and deprecation monitored and tracked with active comms to consumers for uplift.'),
                  ],
                },
              },
              {
                text: 'Standards',
                description: 'Evaluate coding standards and style guidelines.',
                order: 4,
                options: {
                  create: [
                    iacOption(1, 'No established coding standards or guidelines.'),
                    iacOption(2, 'Some initial coding standards introduced, but adoption and enforcement are inconsistent.'),
                    iacOption(3, 'Coding standards are documented and beginning to be enforced; not all teams are aligned.'),
                    iacOption(4, 'Documented internal code style guide. Consistently applied.'),
                    iacOption(5, 'Documented internal code style guide, best practices are continuously refined, ensuring rigorous adherence across teams. Automated documentation to standard. Consumer module consumption enforced through policy.'),
                  ],
                },
              },
              {
                text: 'Templates',
                description: 'Evaluate template usage and management.',
                order: 5,
                options: {
                  create: [
                    iacOption(1, 'No templates exist for module or policy development; all configurations are ad hoc.'),
                    iacOption(2, 'Initial templates created for modules, but usage is inconsistent, and they lack any integration.'),
                    iacOption(3, 'Templates for modules are defined and used, but integration into development workflows is incomplete; teams use them inconsistently.'),
                    iacOption(4, 'Standardized templates are used across teams for modules and policies; partially integrated into publishing processes.'),
                    iacOption(5, 'Git templates covering consumer, module and policy repositories, templates are consumed self-service and integrated with secrets management (Vault) using dynamic secrets for tokens.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Security & Compliance',
          description: 'Establish and enforce robust security measures and compliance guardrails to proactively mitigate risks and ensure policy adherence.',
          order: 3,
          questions: {
            create: [
              {
                text: 'Cloud Credentials',
                description: 'Evaluate cloud credential management approach.',
                order: 1,
                options: {
                  create: [
                    iacOption(1, 'Lack of standardised approach to cloud credentials. Use of secrets in sensitive variables. Distributed secrets management left to consumers with lack of central control.'),
                    iacOption(2, 'Using static secrets in environment variables. Credential inherited through machine identity for runners of agent, but traversal risks due to shared runners and identity.'),
                    iacOption(3, 'Centrally controlled secrets. Use of static secrets in environment variables, though rotation not considered or irregular.'),
                    iacOption(4, 'Cloud credentials are managed through secret management tools though authentication approach relies on environment variables; additionally some credentials are stored in state through use of datasources.'),
                    iacOption(5, 'Cloud credentials are managed through centralized secret management tool. Authentication to secrets managed tools via trusted identity auth flow. Credentials are just-in-time dynamic credentials, no credentials stored in state.'),
                  ],
                },
              },
              {
                text: 'Pipeline Secrets',
                description: 'Evaluate pipeline secret management.',
                order: 2,
                options: {
                  create: [
                    iacOption(1, 'Decentralised static credentials in pipeline secrets, lack of centralised control.'),
                    iacOption(2, 'Secrets are centrally managed in secrets management tool. Though consumption is not standardised or enforced. Each team is self-governed as to how they utilised secrets within their pipelines.'),
                    iacOption(3, 'Pipeline credentials are centrally managed in secrets management and synchronized to pipelines, though rotation not considered.'),
                    iacOption(4, 'Pipeline credentials are centrally managed in secrets management and synchronized to pipelines and rotated on regular interval.'),
                    iacOption(5, 'Pipeline secrets centrally managed in secrets management; authenticating via trusted pipeline identity with no stored credentials.'),
                  ],
                },
              },
              {
                text: 'Secret Scanning',
                description: 'Evaluate secret scanning controls and standards.',
                order: 3,
                options: {
                  create: [
                    iacOption(1, 'No controls or standards.'),
                    iacOption(2, 'General guidelines documented enforced through manual code review only.'),
                    iacOption(3, 'General guidelines documented. Some automated scanning tools in place, alert based only.'),
                    iacOption(4, 'General guidelines documented. Some automated scanning tools in place across the git organisation. Incident based integration, remediation.'),
                    iacOption(5, 'Proactive secret scanning, preventing secrets being committed to code. Security incident integration and automatic remediation where possible.'),
                  ],
                },
              },
              {
                text: 'Policy Controls',
                description: 'Evaluate IaC policy enforcement.',
                order: 4,
                options: {
                  create: [
                    iacOption(1, 'No policy controls in place.'),
                    iacOption(2, 'Basic IaC policies exist but are not consistently enforced; manual reviews are common.'),
                    iacOption(3, 'Policies are documented and enforced through manual processes.'),
                    iacOption(4, 'Policies are enforced automatically using tools. Hard policy requirements are enforced.'),
                    iacOption(5, 'Fully automated policy enforcement with continuous monitoring and improvement. Modules factor in organization policy where there are hard requirements. IaC policy controls consider cloud but also cloud agnostic consumption controls.'),
                  ],
                },
              },
              {
                text: 'Cost Controls',
                description: 'Evaluate cost management integration with IaC.',
                order: 5,
                options: {
                  create: [
                    iacOption(1, 'No cost controls in place.'),
                    iacOption(2, 'Basic cost monitoring, but not integrated into IaC workflow.'),
                    iacOption(3, 'Cost reporting and basic budgeting defined but yet to integrate into IaC workflow.'),
                    iacOption(4, 'Cost controls defined and integrated into IaC workflow, with automated budget alerts.'),
                    iacOption(5, 'Advanced cost optimization strategies, including predictive analysis and automated optimization, fully integrated into IaC workflow.'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Lifecycle Management',
          description: 'Streamline Day 2 IaC operations to enhance operational efficiency and elevate user experience.',
          order: 4,
          questions: {
            create: [
              {
                text: 'IaC Lifecycle',
                description: 'Evaluate drift management and IaC lifecycle processes.',
                order: 1,
                options: {
                  create: [
                    iacOption(1, 'No formal process for managing IaC drift.'),
                    iacOption(2, 'Manual processes to detect drift; corrections are reactive.'),
                    iacOption(3, 'Documented processes for drift management; some automation in place.'),
                    iacOption(4, 'Automated detection and correction of drift; integrated into workflow.'),
                    iacOption(5, 'Continuous improvement; proactive drift management; fully integrated alerting and notifications.'),
                  ],
                },
              },
              {
                text: 'Module Lifecycle',
                description: 'Evaluate module consumption tracking and deprecation.',
                order: 2,
                options: {
                  create: [
                    iacOption(1, 'No tracking of module consumption.'),
                    iacOption(2, 'Basic tracking of module usage; no formal deprecation process.'),
                    iacOption(3, 'Defined process for module lifecycle management, including deprecation policies.'),
                    iacOption(4, 'Automated tracking and management of module lifecycle; regular audits.'),
                    iacOption(5, 'Advanced analytics for module usage; proactive lifecycle management. Defined policies around module lifecycle, standardised communication channels to manage module deprecation and consumer notifications.'),
                  ],
                },
              },
              {
                text: 'Platform Lifecycle (TFE)',
                description: 'Evaluate TFE/TFC platform upgrade processes.',
                order: 3,
                options: {
                  create: [
                    iacOption(1, 'No formal process for platform upgrades.'),
                    iacOption(2, 'Manual upgrades with some documentation; inconsistent practices.'),
                    iacOption(3, 'Documented upgrade process; manual but consistent execution.'),
                    iacOption(4, 'Automated upgrade processes; minimal downtime. Irregular cadence.'),
                    iacOption(5, 'Automated upgrade processes; minimal downtime; Regular cadence (usually adoption new version within 3 months).'),
                  ],
                },
              },
            ],
          },
        },
        {
          name: 'Operational Excellence',
          description: 'Design and implement streamlined onboarding and enablement processes to accelerate IaC adoption and optimize time-to-value.',
          order: 5,
          questions: {
            create: [
              {
                text: 'Tenant Onboarding',
                description: 'Evaluate tenant onboarding automation and self-service.',
                order: 1,
                options: {
                  create: [
                    iacOption(1, 'Manual onboarding process. No automation. No self-service options. Request based then manually configured.'),
                    iacOption(2, 'Partially automated onboarding process. Some manual steps remain.'),
                    iacOption(3, 'Fully documented onboarding process. Some automation, but not fully self-service.'),
                    iacOption(4, 'Mostly automated onboarding process. Self-service options available.'),
                    iacOption(5, 'Fully automated, self-service onboarding process. IaC-driven. Single integrated onboarding process where possible across cloud, IaC and Secrets management (assuming greenfields consumer).'),
                  ],
                },
              },
              {
                text: 'Tenant Enablement & Communications',
                description: 'Evaluate training, documentation, and feedback processes.',
                order: 2,
                options: {
                  create: [
                    iacOption(1, 'No formal induction or training. Limited or no documentation available.'),
                    iacOption(2, 'Basic induction provided. Limited documentation and training resources.'),
                    iacOption(3, 'Structured introduction process. Comprehensive documentation available.'),
                    iacOption(4, 'Comprehensive training resources. Regular cadence with consumer to capture feedback and prioritise features and bugfixes.'),
                    iacOption(5, 'Comprehensive training resources. Regular cadence with consumers to capture feedback and prioritise features and bugfixes. Community and inner sourcing model established to share thought leadership within the organisation. IaC platform managed as a product with dedicated product owner.'),
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  })

  // ── Sample Assessments with Responses ──────────────────────────────
  // Helper to get all questions for an assessment type
  async function getQuestions(typeId: string) {
    return prisma.question.findMany({
      where: { category: { assessmentTypeId: typeId } },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    })
  }

  const cloudQuestions = await getQuestions(cloudType.id)
  const devopsQuestions = await getQuestions(devopsType.id)
  const dataQuestions = await getQuestions(dataType.id)
  const iacQuestions = await getQuestions(iacType.id)

  // Assessment 1: Completed Cloud Assessment for Acme Corp
  await findOrCreateAssessment('Cloud Infrastructure Review Q4 2025', 'Acme Corp', {
    name: 'Cloud Infrastructure Review Q4 2025',
    customerName: 'Acme Corp',
    customerId: customers[0].id,
    assessmentTypeId: cloudType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: cloudQuestions.map((q, i) => ({
        questionId: q.id,
        score: [3, 4, 3, 4, 3, 5, 4, 3, 4, 2, 3, 4][i] || 3,
        commentary: [
          'Using Terraform for most resources but some legacy CloudFormation remains.',
          'Internal registry established with good adoption across teams.',
          'S3 backend with DynamoDB locking in place for all projects.',
          'GitHub Actions pipelines with staging and production stages.',
          'Snyk and Trivy integrated; working on SBOM generation.',
          'Multiple deploys daily with automated rollback.',
          'Datadog APM and logging fully deployed; SLOs defined for tier-1 services.',
          'PagerDuty integrated; runbooks for top 20 incidents. Post-mortems are blameless.',
          'Okta SSO with SCIM provisioning; quarterly access reviews automated.',
          'Annual compliance audits; working on continuous monitoring.',
          'Cost allocation tags enforced via OPA policies; team dashboards live.',
          'Using AWS Compute Optimizer; monthly rightsizing reviews.',
        ][i] || null,
      })),
    },
  })

  // Assessment 2: In-progress DevOps for TechStart
  await findOrCreateAssessment('DevOps Assessment Q1 2026', 'TechStart Inc', {
    name: 'DevOps Assessment Q1 2026',
    customerName: 'TechStart Inc',
    customerId: customers[1].id,
    assessmentTypeId: devopsType.id,
    createdBy: assessorUser.id,
    status: 'in-progress',
    responses: {
      create: devopsQuestions.slice(0, 3).map((q, i) => ({
        questionId: q.id,
        score: [2, 2, 3][i],
        commentary: [
          'Teams are starting to collaborate but still have separate sprint cycles.',
          'Wiki exists but most knowledge is in Slack threads.',
          'Moved to trunk-based last quarter; PRs required for all changes.',
        ][i] || null,
      })),
    },
  })

  // Assessment 3: Completed Cloud Assessment for GlobalBank
  await findOrCreateAssessment('Cloud Security & Infrastructure Audit', 'GlobalBank', {
    name: 'Cloud Security & Infrastructure Audit',
    customerName: 'GlobalBank',
    customerId: customers[2].id,
    assessmentTypeId: cloudType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: cloudQuestions.map((q, i) => ({
        questionId: q.id,
        score: [4, 4, 5, 3, 4, 3, 3, 4, 5, 5, 4, 3][i] || 3,
        commentary: [
          'All infrastructure in Terraform; migration from legacy ARM templates complete.',
          'Central platform team maintains golden modules with automated testing.',
          'State management is exemplary with workspace isolation and encryption.',
          'Jenkins pipelines being migrated to GitHub Actions; dual running.',
          'Strong security gates; SBOM generation for all containers.',
          'Weekly releases for most services; moving toward continuous deployment.',
          'ELK stack with Grafana dashboards; migrating to OpenTelemetry.',
          'Mature incident process with automated escalation and war rooms.',
          'Zero-trust implementation in progress; JIT access via CyberArk.',
          'PCI-DSS and SOC2 continuous compliance monitoring with Prisma Cloud.',
          'FinOps team established; showback model with quarterly optimization reviews.',
          'Starting automated rightsizing; reserved instances cover 60% of stable workloads.',
        ][i] || null,
      })),
    },
  })

  // Assessment 4: Draft Data Platform for HealthFirst
  await findOrCreateAssessment('Data Platform Readiness Assessment', 'HealthFirst Solutions', {
    name: 'Data Platform Readiness Assessment',
    customerName: 'HealthFirst Solutions',
    customerId: customers[3].id,
    assessmentTypeId: dataType.id,
    createdBy: assessorUser.id,
    status: 'draft',
  })

  // Assessment 5: Completed DevOps for RetailMax
  await findOrCreateAssessment('DevOps Transformation Baseline', 'RetailMax', {
    name: 'DevOps Transformation Baseline',
    customerName: 'RetailMax',
    customerId: customers[4].id,
    assessmentTypeId: devopsType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: devopsQuestions.map((q, i) => ({
        questionId: q.id,
        score: [1, 2, 2, 1, 2][i] || 1,
        commentary: [
          'Dev and ops are fully separate departments with adversarial relationship.',
          'Confluence pages exist but nobody maintains them.',
          'Still using SVN for some projects; Git adoption is partial.',
          'Only smoke tests; no automated test suite.',
          'One shared staging environment that breaks weekly.',
        ][i] || null,
      })),
    },
  })

  // Assessment 6: Another Cloud assessment for Acme (for trend/comparison)
  await findOrCreateAssessment('Cloud Infrastructure Review Q1 2026', 'Acme Corp', {
    name: 'Cloud Infrastructure Review Q1 2026',
    customerName: 'Acme Corp',
    customerId: customers[0].id,
    assessmentTypeId: cloudType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: cloudQuestions.map((q, i) => ({
        questionId: q.id,
        score: [4, 4, 4, 5, 4, 5, 5, 4, 5, 3, 4, 4][i] || 4,
        commentary: [
          'Fully migrated to Terraform; self-service modules for common patterns.',
          'Module registry with automated testing and release pipeline.',
          'Added drift detection with weekly reconciliation runs.',
          'Argo CD-based GitOps deployment for all Kubernetes workloads.',
          'SLSA Level 2 achieved; signed container images.',
          'On-demand deployments; average 8 deploys/day across teams.',
          'Full OpenTelemetry migration complete; custom dashboards with SLO tracking.',
          'Chaos engineering started; GameDay exercises quarterly.',
          'Zero-trust rollout complete; all access is JIT.',
          'Continuous compliance for SOC2; ISO27001 gap analysis in progress.',
          'FinOps dashboards with unit cost tracking per feature team.',
          'Automated rightsizing deployed; saved 23% on compute costs.',
        ][i] || null,
      })),
    },
  })

  // ── IaC Capability Maturity Assessments ────────────────────────────

  // IaC Assessment 7: Acme Corp - Balanced Achiever (~3.5 avg)
  await findOrCreateAssessment('IaC Maturity Baseline Q1 2026', 'Acme Corp', {
    name: 'IaC Maturity Baseline Q1 2026',
    customerName: 'Acme Corp',
    customerId: customers[0].id,
    assessmentTypeId: iacType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: iacQuestions.map((q, i) => ({
        questionId: q.id,
        score: [4, 3, 3, 4, 4, 3, 3, 4, 3, 3, 4, 3, 4, 3, 4, 4, 3][i] || 3,
        commentary: [
          'GitOps workflow with GitHub Actions driving Terraform runs. Branch protection enforced across all repos.',
          'Dedicated IaC team with shared module library. RBAC aligned to team structure in TFE.',
          'Terraform test adopted for core modules; integration tests run on PR. Coverage growing steadily.',
          'Modules published to private registry via CI pipeline. Docs generated automatically from examples.',
          'Semantic versioning enforced via CI checks. Consumer constraint guidelines documented.',
          'Internal style guide covers naming, structure, and documentation. Linting in pre-commit hooks.',
          'Standardized module and consumer repo templates. Teams use them for new projects.',
          'Vault with dynamic AWS credentials for production. Staging still uses static keys in some cases.',
          'Pipeline secrets managed in Vault, synced to GitHub Actions. Rotation on 90-day cycle.',
          'GitHub Advanced Security enabled. Pre-commit hooks catch most issues. Alert-based remediation.',
          'Sentinel policies enforce tagging, instance sizes, and region restrictions. Hard and soft policies defined.',
          'Infracost integrated into PR workflow. Budget alerts configured per workspace.',
          'TFE health checks detect drift daily. Auto-remediation for tagged workspaces.',
          'Module usage tracked in TFE. Deprecation notices sent manually for major version bumps.',
          'TFE upgraded quarterly. Automated process with staging validation before production.',
          'Self-service workspace provisioning via ServiceNow integration. Onboarding takes <1 day.',
          'Monthly IaC office hours. Confluence knowledge base maintained by platform team.',
        ][i] || null,
      })),
    },
  })

  // IaC Assessment 8: TechStart Inc - Early Adopter (~2.0 avg)
  await findOrCreateAssessment('IaC Capability Discovery', 'TechStart Inc', {
    name: 'IaC Capability Discovery',
    customerName: 'TechStart Inc',
    customerId: customers[1].id,
    assessmentTypeId: iacType.id,
    createdBy: assessorUser.id,
    status: 'completed',
    responses: {
      create: iacQuestions.map((q, i) => ({
        questionId: q.id,
        score: [2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 3, 2, 3][i] || 2,
        commentary: [
          'Basic Git repos for Terraform code. Developers run plan/apply locally. No consistent branching strategy.',
          'Small team exploring IaC. Module sharing via git clone. Basic workspace-level RBAC in TFC.',
          'Some terraform test files exist but only for a few modules. Most testing is manual plan review.',
          'Modules sourced from git tags. No private registry yet. Exploring TFC private registry.',
          'Inconsistent versioning. Some modules use semver, others use git commits. No consumer guidance.',
          'Informal coding conventions. Starting to document standards in a wiki page.',
          'No templates. Each project starts from scratch or copies from another repo.',
          'Static AWS access keys stored in environment variables. Exploring Vault for credential management.',
          'GitHub Actions secrets used directly. No central management. Teams manage their own secrets.',
          'Manual code review catches some secret exposure. No automated scanning tools yet.',
          'A few basic Sentinel policies exist but are advisory only. Manual reviews for compliance.',
          'No cost integration with IaC. Cloud bills reviewed monthly by engineering manager.',
          'No drift detection. Teams notice drift when deployments fail unexpectedly.',
          'Basic awareness of module versions used. No formal deprecation or upgrade tracking.',
          'TFC managed by HashiCorp. Agent upgrades handled promptly.',
          'Partially automated onboarding. New workspaces created via Terraform but VCS setup is manual.',
          'Onboarding docs in Notion. Monthly Terraform learning sessions started recently.',
        ][i] || null,
      })),
    },
  })

  // IaC Assessment 9: GlobalBank - Security First (~4.2 avg)
  await findOrCreateAssessment('IaC Security & Compliance Review', 'GlobalBank', {
    name: 'IaC Security & Compliance Review',
    customerName: 'GlobalBank',
    customerId: customers[2].id,
    assessmentTypeId: iacType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: iacQuestions.map((q, i) => ({
        questionId: q.id,
        score: [4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4][i] || 4,
        commentary: [
          'Fully automated GitOps with TFE. Strict branch protection and mandatory PR reviews. Consistent repo structure.',
          'Dedicated IaC platform team with clear RBAC. Shared modules consumed via private registry with guard rails.',
          'Comprehensive test framework using terraform test. Tests required for all module changes. Provider constraint testing.',
          'Automated publishing via CI/CD. All modules go through security review before registry publication.',
          'Strict semantic versioning. Consumer constraint policies enforced via Sentinel. Lifecycle tracking in place.',
          'Detailed internal code style guide enforced via linters and CI checks. Regular style guide reviews.',
          'Standardized templates for all repo types. Integrated with Vault for dynamic secret injection.',
          'Vault with dynamic credentials across all environments. Trusted identity auth via OIDC. No static credentials.',
          'Pipeline identity via Vault JWT auth. No stored credentials in any pipeline. Full audit trail.',
          'GitHub Advanced Security with push protection. Pre-commit hooks mandatory. Automated remediation for exposed secrets.',
          'Comprehensive Sentinel policies for PCI-DSS and SOC2. Hard enforcement on all production workspaces. Regular policy reviews.',
          'Infracost and custom Sentinel cost policies. Budget enforcement per business unit. Quarterly optimization reviews.',
          'Automated drift detection with scheduled TFE runs. Drift alerts routed to on-call team. Auto-remediation for critical resources.',
          'Full module lifecycle tracking. Automated deprecation notices. Consumer upgrade path documentation maintained.',
          'Automated TFE upgrades with blue-green deployment. Quarterly cadence with staging validation.',
          'Self-service onboarding portal. Full automation including VCS, Vault, and workspace provisioning.',
          'Comprehensive training programme. Quarterly IaC community meetups. Feedback loop drives platform roadmap.',
        ][i] || null,
      })),
    },
  })

  // IaC Assessment 10: HealthFirst Solutions - Compliance Focused (~3.0 avg)
  await findOrCreateAssessment('IaC Compliance Readiness Assessment', 'HealthFirst Solutions', {
    name: 'IaC Compliance Readiness Assessment',
    customerName: 'HealthFirst Solutions',
    customerId: customers[3].id,
    assessmentTypeId: iacType.id,
    createdBy: assessorUser.id,
    status: 'completed',
    responses: {
      create: iacQuestions.map((q, i) => ({
        questionId: q.id,
        score: [3, 3, 3, 3, 3, 3, 2, 4, 4, 4, 4, 3, 2, 2, 2, 3, 3][i] || 3,
        commentary: [
          'Documented IaC workflow with basic branching strategy. Environment-specific variables managed via workspaces.',
          'Defined team roles for IaC. Shared module library growing. RBAC implemented in TFE.',
          'Test approach defined and documented. Adoption inconsistent across teams. Working toward full coverage.',
          'Publishing process documented. Some CI automation but manual steps remain for approvals.',
          'Semantic versioning followed. Consumer constraint usage improving but not yet consistent.',
          'Coding standards documented in Confluence. Beginning to enforce via CI linting.',
          'Basic templates exist for common module patterns. Not integrated into workflows yet.',
          'Vault manages cloud credentials with dynamic secrets for HIPAA-regulated environments. Strong access controls.',
          'Pipeline credentials managed in Vault with regular rotation. Synchronized to CI/CD systems.',
          'Automated secret scanning across all repos. Alert-based remediation with SIEM integration.',
          'Sentinel policies enforce HIPAA and SOC2 compliance requirements. Hard enforcement on PHI workspaces.',
          'Cost reporting integrated with budgeting. Not yet embedded in IaC workflow.',
          'Manual drift detection via scheduled plans. Reactive corrections. No automation yet.',
          'Basic module usage tracking. No formal deprecation process. Upgrades communicated via email.',
          'Manual TFE upgrades. Documented process but inconsistent cadence. Aiming for quarterly.',
          'Documented onboarding process. Some automation via Terraform. VCS and Vault setup partially manual.',
          'Training materials available. Structured onboarding for new IaC consumers. Quarterly feedback surveys.',
        ][i] || null,
      })),
    },
  })

  // IaC Assessment 11: RetailMax - Legacy Transformation (~2.5 avg)
  await findOrCreateAssessment('IaC Transformation Baseline', 'RetailMax', {
    name: 'IaC Transformation Baseline',
    customerName: 'RetailMax',
    customerId: customers[4].id,
    assessmentTypeId: iacType.id,
    createdBy: moayadUser.id,
    status: 'completed',
    responses: {
      create: iacQuestions.map((q, i) => ({
        questionId: q.id,
        score: [3, 2, 2, 3, 3, 2, 2, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3][i] || 2,
        commentary: [
          'Documented IaC workflow established. Branching strategy defined but not consistently followed across all teams.',
          'Some team structure forming around IaC. Ad-hoc module sharing between teams. Basic RBAC in TFE.',
          'Terraform test used for newer modules. Legacy modules lack tests. Working toward consistent coverage.',
          'Publishing to private registry documented. CI automation partially implemented. Manual steps remain.',
          'Semantic versioning adopted for new modules. Legacy modules still use arbitrary tags.',
          'Initial coding standards drafted. Adoption varies by team. No automated enforcement yet.',
          'Basic module templates created. Teams aware but adoption is inconsistent.',
          'Vault deployed for credential management. Some workloads still use static credentials in transition.',
          'Pipeline secrets migrating to Vault. GitHub Actions secrets still used for some pipelines.',
          'Manual code review is primary secret scanning method. Evaluating GitHub Advanced Security.',
          'Sentinel policies defined for basic guardrails. Enforcement gradually expanding to more workspaces.',
          'Basic cost monitoring via cloud provider tools. No integration with IaC workflow.',
          'Drift detection via scheduled Terraform plans. Documented remediation process. Some automation.',
          'Basic module inventory maintained. No formal lifecycle or deprecation process.',
          'TFE upgrade process documented. Consistent manual execution. Working toward automation.',
          'Onboarding process partially documented. Mostly manual workspace and VCS configuration.',
          'Training resources growing. Quarterly brown bag sessions. Feedback collected informally.',
        ][i] || null,
      })),
    },
  })

  // ── Delete the old empty "WARM Assessment" type if it exists ────────
  try {
    await prisma.assessmentType.deleteMany({
      where: { name: 'WARM Assessment', categories: { none: {} } },
    })
    console.log('🧹 Cleaned up empty WARM Assessment type')
  } catch {
    // Ignore if it doesn't exist or has data
  }

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  Users: 4 (admin, sa, reader, moayad)')
  console.log('  Customers: 5')
  console.log('  Assessment Types: 4')
  console.log(`    - Cloud Infrastructure Maturity (${cloudQuestions.length} questions)`)
  console.log(`    - DevOps Practices (${devopsQuestions.length} questions)`)
  console.log(`    - Data Platform Maturity (${dataQuestions.length} questions)`)
  console.log(`    - HashiCorp IaC Capability Maturity (${iacQuestions.length} questions)`)
  console.log('  Assessments: 11')
  console.log('    - 9 completed, 1 in-progress, 1 draft')
  console.log('\n🔑 Sign in with:')
  console.log('  - admin@example.com (admin)')
  console.log('  - assessor@example.com (sa/assessor)')
  console.log('  - reader@example.com (reader)')
  console.log('  - moayad.ismail@gmail.com (admin - Google OAuth)')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
