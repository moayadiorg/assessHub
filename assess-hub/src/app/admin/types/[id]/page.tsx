import { Box, Card } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeForm } from '@/components/admin/AssessmentTypeForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTypePage({ params }: PageProps) {
  const { id } = await params

  const type = await prisma.assessmentType.findUnique({
    where: { id },
  })

  if (!type) {
    notFound()
  }

  return (
    <Box>
      <Header title={`Edit: ${type.name}`} showNewAssessment={false} />
      <Box p="6">
        <Card style={{ maxWidth: 600 }}>
          <AssessmentTypeForm initialData={type} />
        </Card>
      </Box>
    </Box>
  )
}
