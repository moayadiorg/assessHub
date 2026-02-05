export interface CategoryInput {
  assessmentTypeId: string
  name: string
  description?: string
  order?: number
}

export interface QuestionInput {
  categoryId: string
  text: string
  description?: string
  order?: number
  options: {
    label?: string
    description: string
  }[]
}

export interface QuestionOptionInput {
  id?: string  // For updates
  label: string
  description: string
}

// Assessment Results Types
export interface AssessmentResults {
  assessmentId: string
  assessmentName: string
  customerName: string
  status: string
  overallScore: number
  maturityLevel: {
    level: number
    name: string
  }
  categoryScores: CategoryScore[]
  totalQuestions: number
  answeredQuestions: number
}

export interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
  answeredQuestions: number
  totalQuestions: number
  questionScores: {
    questionId: string
    questionText: string
    score: number | null
    commentary: string | null
  }[]
}
