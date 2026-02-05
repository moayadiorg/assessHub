import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assessment, Response, CategoryScore, AssessmentResults } from '@/types'

interface AssessmentState {
  // Current assessment being conducted
  currentAssessment: Assessment | null
  currentResponses: Map<string, Response>

  // Actions
  setCurrentAssessment: (assessment: Assessment | null) => void
  setResponse: (questionId: string, score: number, commentary?: string) => void
  clearCurrentAssessment: () => void

  // Computed values
  getResponse: (questionId: string) => Response | undefined
  calculateCategoryScores: (
    categories: Array<{ id: string; name: string; questions: Array<{ id: string }> }>
  ) => CategoryScore[]
  calculateOverallScore: (categoryScores: CategoryScore[]) => number
  getAssessmentResults: (
    categories: Array<{ id: string; name: string; questions: Array<{ id: string }> }>
  ) => AssessmentResults
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      currentAssessment: null,
      currentResponses: new Map(),

      setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),

      setResponse: (questionId, score, commentary) => {
        const responses = new Map(get().currentResponses)
        const existing = responses.get(questionId)

        responses.set(questionId, {
          id: existing?.id || `temp-${questionId}`,
          assessmentId: get().currentAssessment?.id || '',
          questionId,
          score,
          commentary: commentary || existing?.commentary || null,
          createdAt: existing?.createdAt || new Date(),
          updatedAt: new Date(),
        })

        set({ currentResponses: responses })
      },

      clearCurrentAssessment: () => set({
        currentAssessment: null,
        currentResponses: new Map()
      }),

      getResponse: (questionId) => get().currentResponses.get(questionId),

      calculateCategoryScores: (categories) => {
        const responses = get().currentResponses

        return categories.map((category) => {
          const questionIds = category.questions.map(q => q.id)
          const categoryResponses = questionIds
            .map(id => responses.get(id))
            .filter((r): r is Response => r !== undefined)

          const totalScore = categoryResponses.reduce((sum, r) => sum + r.score, 0)
          const avgScore = categoryResponses.length > 0
            ? totalScore / categoryResponses.length
            : 0

          return {
            categoryId: category.id,
            categoryName: category.name,
            score: Math.round(avgScore * 10) / 10,
            answeredQuestions: categoryResponses.length,
            totalQuestions: questionIds.length,
          }
        })
      },

      calculateOverallScore: (categoryScores) => {
        const validScores = categoryScores.filter(cs => cs.answeredQuestions > 0)
        if (validScores.length === 0) return 0

        const total = validScores.reduce((sum, cs) => sum + cs.score, 0)
        return Math.round((total / validScores.length) * 10) / 10
      },

      getAssessmentResults: (categories) => {
        const categoryScores = get().calculateCategoryScores(categories)
        const overallScore = get().calculateOverallScore(categoryScores)

        const totalQuestions = categories.reduce(
          (sum, c) => sum + c.questions.length,
          0
        )
        const answeredQuestions = categoryScores.reduce(
          (sum, cs) => sum + cs.answeredQuestions,
          0
        )

        return {
          overallScore,
          categoryScores,
          totalQuestions,
          answeredQuestions,
        }
      },
    }),
    {
      name: 'assessment-storage',
      partialize: (state) => ({
        currentAssessment: state.currentAssessment,
        currentResponses: Array.from(state.currentResponses.entries()),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as {
          currentAssessment?: Assessment | null
          currentResponses?: [string, Response][]
        }
        return {
          ...current,
          currentAssessment: persistedState?.currentAssessment ?? null,
          currentResponses: new Map(persistedState?.currentResponses ?? []),
        }
      },
    }
  )
)
