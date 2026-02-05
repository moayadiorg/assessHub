import { Box, Card } from '@radix-ui/themes'
import { Header } from '@/components/layout/Header'
import { AssessmentTypeForm } from '@/components/admin/AssessmentTypeForm'

export default function NewTypePage() {
  return (
    <Box>
      <Header title="Create Assessment Type" showNewAssessment={false} />
      <Box p="6">
        <Card style={{ maxWidth: 600 }}>
          <AssessmentTypeForm />
        </Card>
      </Box>
    </Box>
  )
}
