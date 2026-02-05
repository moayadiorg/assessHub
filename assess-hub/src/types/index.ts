// TypeScript type definitions for the Assessment Platform

export interface AssessmentType {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  categories?: Category[]
  assessments?: Assessment[]
}

export interface Category {
  id: string
  assessmentTypeId: string
  name: string
  description: string | null
  order: number
  questions?: Question[]
}

export interface Question {
  id: string
  categoryId: string
  text: string
  description: string | null
  order: number
  options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  questionId: string
  score: number
  label: string
  description: string
}

export interface Assessment {
  id: string
  name: string
  customerName: string
  assessmentTypeId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'in-progress' | 'completed'
  responses?: Response[]
  assessmentType?: AssessmentType
}

export interface Response {
  id: string
  assessmentId: string
  questionId: string
  score: number
  commentary: string | null
  createdAt: Date
  updatedAt: Date
}

// CMM Maturity Levels
export const MATURITY_LEVELS = {
  1: { label: 'Initial', description: 'Ad-hoc, chaotic, no defined processes' },
  2: { label: 'Managed', description: 'Basic processes established, reactive' },
  3: { label: 'Defined', description: 'Standardized processes across organization' },
  4: { label: 'Quantitative', description: 'Measured and controlled' },
  5: { label: 'Optimizing', description: 'Continuous improvement, innovative' },
} as const

export type MaturityLevel = keyof typeof MATURITY_LEVELS

// Score colors for visualization
export const SCORE_COLORS = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#84cc16', // lime
  5: '#22c55e', // green
} as const

// Category score calculation
export interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
}

// Assessment results summary
export interface AssessmentResults {
  overallScore: number
  categoryScores: CategoryScore[]
  totalQuestions: number
  answeredQuestions: number
}

// CSV Import types
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

export interface ParsedCSVData {
  assessmentType: string
  categories: Map<string, {
    name: string
    order: number
    questions: Array<{
      text: string
      order: number
      options: Array<{
        score: number
        label: string
        description: string
      }>
    }>
  }>
}
