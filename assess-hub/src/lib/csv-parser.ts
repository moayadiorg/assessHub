import * as Papa from 'papaparse'

export interface CSVRow {
  assessment_type: string
  category: string
  category_order: string
  question: string
  question_order: string
  level_1: string
  level_2: string
  level_3: string
  level_4: string
  level_5: string
}

export interface ValidationError {
  row: number
  column: string
  message: string
}

export interface ParsedImport {
  assessmentType: string
  categories: {
    name: string
    order: number
    questions: {
      text: string
      order: number
      options: { score: number; label: string; description: string }[]
    }[]
  }[]
}

const REQUIRED_COLUMNS = [
  'assessment_type',
  'category',
  'category_order',
  'question',
  'question_order',
  'level_1',
  'level_2',
  'level_3',
  'level_4',
  'level_5',
]

const LEVEL_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Managed',
  3: 'Defined',
  4: 'Quantitatively Managed',
  5: 'Optimizing',
}

export function parseCSV(csvString: string): {
  data: CSVRow[]
  errors: ValidationError[]
} {
  const result = Papa.parse<CSVRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const errors: ValidationError[] = []

  // Check for required columns
  const headers = result.meta.fields || []
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({
        row: 0,
        column: col,
        message: `Missing required column: ${col}`,
      })
    }
  }

  // Validate each row
  result.data.forEach((row, index) => {
    const rowNum = index + 2 // Account for header row + 1-indexed

    // Required fields
    if (!row.assessment_type?.trim()) {
      errors.push({ row: rowNum, column: 'assessment_type', message: 'Assessment type is required' })
    }
    if (!row.category?.trim()) {
      errors.push({ row: rowNum, column: 'category', message: 'Category is required' })
    }
    if (!row.question?.trim()) {
      errors.push({ row: rowNum, column: 'question', message: 'Question is required' })
    }

    // Order fields must be numbers
    if (isNaN(parseInt(row.category_order))) {
      errors.push({ row: rowNum, column: 'category_order', message: 'Category order must be a number' })
    }
    if (isNaN(parseInt(row.question_order))) {
      errors.push({ row: rowNum, column: 'question_order', message: 'Question order must be a number' })
    }

    // Level descriptions required
    for (let i = 1; i <= 5; i++) {
      const key = `level_${i}` as keyof CSVRow
      if (!row[key]?.trim()) {
        errors.push({ row: rowNum, column: key, message: `Level ${i} description is required` })
      }
    }
  })

  return { data: result.data, errors }
}

export function transformToImport(rows: CSVRow[]): ParsedImport[] {
  const typeMap = new Map<string, ParsedImport>()

  for (const row of rows) {
    const typeName = row.assessment_type.trim()

    if (!typeMap.has(typeName)) {
      typeMap.set(typeName, {
        assessmentType: typeName,
        categories: [],
      })
    }

    const typeData = typeMap.get(typeName)!
    const categoryName = row.category.trim()
    const categoryOrder = parseInt(row.category_order)

    let category = typeData.categories.find(c => c.name === categoryName)
    if (!category) {
      category = {
        name: categoryName,
        order: categoryOrder,
        questions: [],
      }
      typeData.categories.push(category)
    }

    category.questions.push({
      text: row.question.trim(),
      order: parseInt(row.question_order),
      options: [1, 2, 3, 4, 5].map(score => ({
        score,
        label: LEVEL_LABELS[score],
        description: row[`level_${score}` as keyof CSVRow]?.trim() || '',
      })),
    })
  }

  // Sort categories and questions by order
  const result: ParsedImport[] = []
  typeMap.forEach((type) => {
    type.categories.sort((a, b) => a.order - b.order)
    for (const cat of type.categories) {
      cat.questions.sort((a, b) => a.order - b.order)
    }
    result.push(type)
  })

  return result
}

export function generateTemplate(): string {
  const rows = [
    REQUIRED_COLUMNS.join(','),
    'Cloud Maturity,Infrastructure,1,How automated is your infrastructure provisioning?,1,Manual provisioning,Some scripts,IaC templates,Full IaC with CI/CD,Self-service platform',
    'Cloud Maturity,Infrastructure,1,How do you manage infrastructure state?,2,No tracking,Spreadsheets,Basic state files,Centralized state management,GitOps with drift detection',
    'Cloud Maturity,Security,2,How are secrets managed?,1,Hardcoded,Environment variables,Vault with manual rotation,Automated rotation,Zero-trust dynamic secrets',
  ]
  return rows.join('\n')
}
