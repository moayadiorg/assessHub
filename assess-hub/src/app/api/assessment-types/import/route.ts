import { transaction } from '@/lib/sql-helpers'
import { newId } from '@/lib/id'
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
  return await transaction(async (conn) => {
    // Create assessment type
    const typeId = newId()
    await conn.execute(
      `INSERT INTO AssessmentType
       (id, name, description, version, iconColor, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
      [typeId, data.assessmentType, 'Imported from CSV', '1.0', '#3b82f6']
    )

    let categoryCount = 0
    let questionCount = 0

    // Create categories and questions
    for (const catData of data.categories) {
      const catId = newId()
      await conn.execute(
        'INSERT INTO Category (id, assessmentTypeId, name, `order`) VALUES (?, ?, ?, ?)',
        [catId, typeId, catData.name, catData.order]
      )
      categoryCount++

      for (const qData of catData.questions) {
        const qId = newId()
        await conn.execute(
          'INSERT INTO Question (id, categoryId, text, `order`) VALUES (?, ?, ?, ?)',
          [qId, catId, qData.text, qData.order]
        )

        // Create options for this question
        for (const opt of qData.options) {
          await conn.execute(
            'INSERT INTO QuestionOption (id, questionId, score, label, description) VALUES (?, ?, ?, ?, ?)',
            [newId(), qId, opt.score, opt.label, opt.description]
          )
        }

        questionCount++
      }
    }

    return {
      id: typeId,
      name: data.assessmentType,
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
