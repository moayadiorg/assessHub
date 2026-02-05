/**
 * Script to view assessment details from the database
 * Usage: npx tsx scripts/view-assessment.ts [assessment-id]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const assessmentId = process.argv[2]

  if (!assessmentId) {
    console.log('Usage: npx tsx scripts/view-assessment.ts [assessment-id]')
    console.log('\nExample: npx tsx scripts/view-assessment.ts cml99llos00023o6iefy8u7yn')
    console.log('\nAvailable assessments:')

    const assessments = await prisma.assessment.findMany({
      include: {
        assessmentType: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    })

    for (const assessment of assessments) {
      console.log(`  - ${assessment.id}`)
      console.log(`    Name: ${assessment.name}`)
      console.log(`    Customer: ${assessment.customerName}`)
      console.log(`    Type: ${assessment.assessmentType.name}`)
      console.log(`    Status: ${assessment.status}`)
      console.log('')
    }
    return
  }

  // Fetch assessment with all related data
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      assessmentType: {
        include: {
          categories: {
            include: {
              questions: {
                include: {
                  options: true
                },
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      },
      customer: true,
      responses: {
        include: {
          question: {
            include: {
              category: true
            }
          }
        }
      }
    }
  })

  if (!assessment) {
    console.error(`❌ Assessment not found: ${assessmentId}`)
    return
  }

  // Display assessment details
  console.log('='.repeat(70))
  console.log('ASSESSMENT DETAILS')
  console.log('='.repeat(70))
  console.log(`Name: ${assessment.name}`)
  console.log(`Customer: ${assessment.customerName}`)
  console.log(`Type: ${assessment.assessmentType.name}`)
  console.log(`Status: ${assessment.status}`)
  console.log(`Created by: ${assessment.createdBy}`)
  console.log(`Created: ${assessment.createdAt.toISOString()}`)
  console.log(`Updated: ${assessment.updatedAt.toISOString()}`)
  console.log('')

  // Calculate statistics
  const totalQuestions = assessment.assessmentType.categories.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  )
  const answeredQuestions = assessment.responses.length
  const totalScore = assessment.responses.reduce((sum, r) => sum + r.score, 0)
  const averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0
  const percentage = (averageScore / 5) * 100

  console.log('OVERALL STATISTICS')
  console.log('='.repeat(70))
  console.log(`Questions answered: ${answeredQuestions}/${totalQuestions}`)
  console.log(`Average score: ${averageScore.toFixed(2)}/5.00`)
  console.log(`Overall maturity: ${percentage.toFixed(1)}%`)
  console.log('')

  // Category breakdown
  console.log('CATEGORY BREAKDOWN')
  console.log('='.repeat(70))

  for (const category of assessment.assessmentType.categories) {
    const categoryResponses = assessment.responses.filter(
      r => r.question.category.id === category.id
    )
    const categoryScore = categoryResponses.length > 0
      ? categoryResponses.reduce((sum, r) => sum + r.score, 0) / categoryResponses.length
      : 0
    const categoryPercentage = (categoryScore / 5) * 100

    console.log(`\n${category.name}`)
    console.log(`Score: ${categoryScore.toFixed(2)}/5.00 (${categoryPercentage.toFixed(1)}%)`)
    console.log(`Questions answered: ${categoryResponses.length}/${category.questions.length}`)
    console.log('-'.repeat(70))

    for (const question of category.questions) {
      const response = assessment.responses.find(r => r.questionId === question.id)
      if (response) {
        console.log(`\nQ: ${question.text}`)
        console.log(`A: Score ${response.score}/5`)
        if (response.commentary) {
          console.log(`   "${response.commentary}"`)
        }
      } else {
        console.log(`\nQ: ${question.text}`)
        console.log(`A: Not answered`)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`View online: http://localhost:3005/assessments/${assessment.id}/results`)
  console.log('='.repeat(70) + '\n')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
