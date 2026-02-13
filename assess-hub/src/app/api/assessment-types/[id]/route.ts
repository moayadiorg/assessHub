import { query, queryOne, execute } from '@/lib/sql-helpers'
import { NextResponse } from 'next/server'
import type { AssessmentType, Category, Question, QuestionOption } from '@/types/db'

interface AssessmentTypeRow {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: number
  createdAt: Date
  updatedAt: Date
}

interface CategoryRow {
  id: string
  assessmentTypeId: string
  name: string
  order: number
}

interface QuestionRow {
  id: string
  categoryId: string
  text: string
  order: number
}

interface QuestionOptionRow {
  id: string
  questionId: string
  score: number
  label: string
  description: string
}

interface AssessmentCountRow {
  cnt: number
}

/**
 * GET /api/assessment-types/[id]
 * Returns a single assessment type with full nested structure
 * Includes categories, questions, and options
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch the assessment type
    const type = await queryOne<AssessmentTypeRow>(
      'SELECT * FROM AssessmentType WHERE id = ?',
      [id]
    )

    if (!type) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    // 2. Fetch categories
    const categories = await query<CategoryRow>(
      'SELECT * FROM Category WHERE assessmentTypeId = ? ORDER BY `order` ASC',
      [id]
    )

    if (categories.length === 0) {
      // Return type with empty categories array
      return NextResponse.json({
        ...type,
        isActive: !!type.isActive,
        categories: []
      })
    }

    // 3. Fetch all questions for these categories
    const categoryIds = categories.map(c => c.id)
    const questions = await query<QuestionRow>(
      `SELECT * FROM Question WHERE categoryId IN (${categoryIds.map(() => '?').join(',')}) ORDER BY \`order\` ASC`,
      categoryIds
    )

    if (questions.length === 0) {
      // Return type with categories but no questions
      return NextResponse.json({
        ...type,
        isActive: !!type.isActive,
        categories: categories.map(cat => ({
          ...cat,
          questions: []
        }))
      })
    }

    // 4. Fetch all options for these questions
    const questionIds = questions.map(q => q.id)
    const options = await query<QuestionOptionRow>(
      `SELECT * FROM QuestionOption WHERE questionId IN (${questionIds.map(() => '?').join(',')}) ORDER BY score ASC`,
      questionIds
    )

    // 5. Nest the structure: options -> questions -> categories -> type
    const optionsByQuestionId = new Map<string, QuestionOptionRow[]>()
    for (const option of options) {
      if (!optionsByQuestionId.has(option.questionId)) {
        optionsByQuestionId.set(option.questionId, [])
      }
      optionsByQuestionId.get(option.questionId)!.push(option)
    }

    const questionsWithOptions = questions.map(q => ({
      ...q,
      options: optionsByQuestionId.get(q.id) || []
    }))

    const questionsByCategoryId = new Map<string, typeof questionsWithOptions>()
    for (const question of questionsWithOptions) {
      if (!questionsByCategoryId.has(question.categoryId)) {
        questionsByCategoryId.set(question.categoryId, [])
      }
      questionsByCategoryId.get(question.categoryId)!.push(question)
    }

    const categoriesWithQuestions = categories.map(cat => ({
      ...cat,
      questions: questionsByCategoryId.get(cat.id) || []
    }))

    const response = {
      ...type,
      isActive: !!type.isActive,
      categories: categoriesWithQuestions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment type' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/assessment-types/[id]
 * Updates assessment type metadata
 * Body: { name?, description?, version?, iconColor?, isActive? }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if assessment type exists
    const existing = await queryOne<AssessmentTypeRow>(
      'SELECT * FROM AssessmentType WHERE id = ?',
      [id]
    )

    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    // Build dynamic update
    const updates: string[] = []
    const values: any[] = []

    if (body.name !== undefined && body.name?.trim()) {
      updates.push('name = ?')
      values.push(body.name.trim())
    }

    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description?.trim() || null)
    }

    if (body.version !== undefined) {
      updates.push('version = ?')
      values.push(body.version)
    }

    if (body.iconColor !== undefined) {
      updates.push('iconColor = ?')
      values.push(body.iconColor)
    }

    if (body.isActive !== undefined) {
      updates.push('isActive = ?')
      values.push(body.isActive ? 1 : 0)
    }

    if (updates.length === 0) {
      // No fields to update, return existing
      return NextResponse.json({
        ...existing,
        isActive: !!existing.isActive
      })
    }

    updates.push('updatedAt = NOW(3)')
    values.push(id)

    await execute(
      `UPDATE AssessmentType SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Fetch updated record
    const updated = await queryOne<AssessmentTypeRow>(
      'SELECT * FROM AssessmentType WHERE id = ?',
      [id]
    )

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update assessment type' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...updated,
      isActive: !!updated.isActive
    })
  } catch (error) {
    console.error('Error updating assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to update assessment type' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assessment-types/[id]
 * Deletes an assessment type
 * - Soft delete (isActive = false) if assessments exist
 * - Hard delete if no assessments exist
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check for existing assessments
    const [countResult] = await query<AssessmentCountRow>(
      'SELECT COUNT(*) as cnt FROM Assessment WHERE assessmentTypeId = ?',
      [id]
    )

    const assessmentCount = countResult?.cnt || 0

    if (assessmentCount > 0) {
      // Soft delete - mark as inactive
      const result = await execute(
        'UPDATE AssessmentType SET isActive = 0, updatedAt = NOW(3) WHERE id = ?',
        [id]
      )

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Assessment type not found' },
          { status: 404 }
        )
      }

      const updated = await queryOne<AssessmentTypeRow>(
        'SELECT * FROM AssessmentType WHERE id = ?',
        [id]
      )

      return NextResponse.json({
        ...updated,
        isActive: !!updated?.isActive,
        _note: 'Soft deleted due to existing assessments'
      })
    }

    // Hard delete - no assessments exist
    const result = await execute(
      'DELETE FROM AssessmentType WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assessment type:', error)
    return NextResponse.json(
      { error: 'Failed to delete assessment type' },
      { status: 500 }
    )
  }
}
