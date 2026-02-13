import { Box, Card } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeForm } from '@/components/admin/AssessmentTypeForm'
import { queryOne } from '@/lib/sql-helpers'
import type { AssessmentType } from '@/types/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTypePage({ params }: PageProps) {
  const { id } = await params

  const type = await queryOne<AssessmentType>(
    'SELECT * FROM AssessmentType WHERE id = ?',
    [id]
  )

  if (!type) {
    notFound()
  }

  // Convert isActive tinyint(1) to boolean for the form component
  const typeData = {
    ...type,
    isActive: !!type.isActive
  }

  return (
    <Box>
      <Header title={`Edit: ${type.name}`} showNewAssessment={false} />
      <Box p="6">
        <Card style={{ maxWidth: 600 }}>
          <AssessmentTypeForm initialData={typeData} />
        </Card>
      </Box>
    </Box>
  )
}
