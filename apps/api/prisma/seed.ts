import { Prisma, PrismaClient, Role, SalaryType } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const BCRYPT_COST = 12

async function main(): Promise<void> {
  // ── Owner ──────────────────────────────────────────────────────────────
  const ownerPhone = '9999999999'
  const ownerPassword = 'changeme'
  const ownerHash = await bcrypt.hash(ownerPassword, BCRYPT_COST)

  await prisma.user.upsert({
    where: { phone: ownerPhone },
    update: {},
    create: {
      phone: ownerPhone,
      passwordHash: ownerHash,
      name: 'Factory Owner',
      role: Role.OWNER,
    },
  })
  console.log(`✓ owner: phone=${ownerPhone} password=${ownerPassword}`)

  // ── 3 sample employees with linked STAFF user accounts ─────────────────
  const samples = [
    { name: 'Ramesh Kumar', phone: '9111100001', designation: 'Machine Operator', basicSalary: '15000.00' },
    { name: 'Sita Devi', phone: '9111100002', designation: 'Packer', basicSalary: '12000.00' },
    { name: 'Arjun Patnaik', phone: '9111100003', designation: 'Helper', basicSalary: '10000.00' },
  ]

  let seq = 1
  for (const s of samples) {
    const empCode = `EMP2026${String(seq).padStart(4, '0')}`
    seq += 1

    const employee = await prisma.employee.upsert({
      where: { empCode },
      update: {},
      create: {
        empCode,
        name: s.name,
        phone: s.phone,
        designation: s.designation,
        dateOfJoining: new Date('2026-04-01'),
        salaryType: SalaryType.MONTHLY,
        basicSalary: new Prisma.Decimal(s.basicSalary),
        hra: new Prisma.Decimal('1500.00'),
        allowances: [
          { name: 'Travel', amount: '500.00', alwaysFull: true },
        ],
        fixedDeductions: [
          { name: 'PT', amount: '200.00' },
        ],
      },
    })

    // STAFF login uses default password "changeme" so the seed is usable end-to-end.
    const staffHash = await bcrypt.hash('changeme', BCRYPT_COST)
    await prisma.user.upsert({
      where: { phone: s.phone },
      update: { employeeId: employee.id },
      create: {
        phone: s.phone,
        passwordHash: staffHash,
        name: s.name,
        role: Role.STAFF,
        employeeId: employee.id,
      },
    })

    console.log(`✓ employee: ${empCode} ${s.name} (login phone=${s.phone} password=changeme)`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
