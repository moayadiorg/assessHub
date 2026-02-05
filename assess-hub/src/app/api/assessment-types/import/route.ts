import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseCSV, transformToImport, generateTemplate, ParsedImport } from '@/lib/csv-parser'

export async function POST(request: Request) {
  try {
    const { csv } = await request.json()

    if (!csv) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      )
    }

    // Parse and validate
    const { data, errors } = parseCSV(csv)

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    // Transform to import structure
    const imports = transformToImport(data)

    // Import each assessment type
    const results = []

    for (const importData of imports) {
      const result = await importAssessmentType(importData)
      results.push(result)
    }

    return NextResponse.json({
      success: true,
      imported: results,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}

async function importAssessmentType(data: ParsedImport) {
  return await prisma.$transaction(async (tx) => {
    // Create assessment type
    const assessmentType = await tx.assessmentType.create({
      data: {
        name: data.assessmentType,
        description: `Imported from CSV`,
        version: '1.0',
      },
    })

    let categoryCount = 0
    let questionCount = 0

    // Create categories and questions
    for (const catData of data.categories) {
      const category = await tx.category.create({
        data: {
          assessmentTypeId: assessmentType.id,
          name: catData.name,
          order: catData.order,
        },
      })
      categoryCount++

      for (const qData of catData.questions) {
        await tx.question.create({
          data: {
            categoryId: category.id,
            text: qData.text,
            order: qData.order,
            options: {
              create: qData.options.map(opt => ({
                score: opt.score,
                label: opt.label,
                description: opt.description,
              })),
            },
          },
        })
        questionCount++
      }
    }

    return {
      id: assessmentType.id,
      name: assessmentType.name,
      categories: categoryCount,
      questions: questionCount,
    }
  })
}

// GET endpoint for template download
export async function GET() {
  const template = generateTemplate()

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="assessment-template.csv"',
    },
  })
}
