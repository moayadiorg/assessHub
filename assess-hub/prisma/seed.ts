import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    },
  })
  console.log('Created admin user:', adminUser.email)

  // Create a reader user for testing
  const readerUser = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      email: 'reader@example.com',
      name: 'Reader User',
      role: 'reader',
      isActive: true,
    },
  })
  console.log('Created reader user:', readerUser.email)

  // Create an assessor user for testing
  const assessorUser = await prisma.user.upsert({
    where: { email: 'assessor@example.com' },
    update: {},
    create: {
      email: 'assessor@example.com',
      name: 'Assessor User',
      role: 'assessor',
      isActive: true,
    },
  })
  console.log('Created assessor user:', assessorUser.email)

  // Create real admin user for OAuth testing
  const moayadUser = await prisma.user.upsert({
    where: { email: 'moayad.ismail@gmail.com' },
    update: {},
    create: {
      email: 'moayad.ismail@gmail.com',
      name: 'Moayad Ismail',
      role: 'admin',
      isActive: true,
    },
  })
  console.log('Created real admin user:', moayadUser.email)

  console.log('\n✅ Seed completed successfully!')
  console.log('\nYou can now sign in with any of these emails:')
  console.log('  - admin@example.com (admin role)')
  console.log('  - assessor@example.com (assessor role)')
  console.log('  - reader@example.com (reader role)')
  console.log('  - moayad.ismail@gmail.com (admin role - real Google account)')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
