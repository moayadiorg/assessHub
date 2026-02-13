export interface AssessmentType {
  id: string
  name: string
  description: string | null
  version: string
  iconColor: string
  isActive: number // tinyint(1): 0 or 1
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  assessmentTypeId: string
  name: string
  description: string | null
  order: number
}

export interface Question {
  id: string
  categoryId: string
  text: string
  description: string | null
  order: number
}

export interface QuestionOption {
  id: string
  questionId: string
  score: number
  label: string
  description: string
}

export interface Customer {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Assessment {
  id: string
  name: string
  customerName: string
  customerId: string | null
  assessmentTypeId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: string
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

export interface DbUser {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  role: string
  isActive: number // tinyint(1): 0 or 1
  createdBy: string | null
  lastLoginAt: Date | null
  createdAt: Date
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
}

export interface VerificationToken {
  identifier: string
  token: string
  expires: Date
}
