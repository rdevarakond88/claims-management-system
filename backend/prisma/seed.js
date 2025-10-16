const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Providers
  const provider1 = await prisma.provider.upsert({
    where: { npi: '1234567890' },
    update: {},
    create: {
      name: 'Louisville Primary Care Clinic',
      npi: '1234567890',
      city: 'Louisville',
      state: 'KY',
      phone: '(502) 555-0100',
      email: 'contact@lpcc.com'
    }
  });
  console.log('✅ Created provider:', provider1.name);

  const provider2 = await prisma.provider.upsert({
    where: { npi: '0987654321' },
    update: {},
    create: {
      name: 'Memorial Hospital',
      npi: '0987654321',
      city: 'Lexington',
      state: 'KY',
      phone: '(859) 555-0200',
      email: 'contact@memorial.com'
    }
  });
  console.log('✅ Created provider:', provider2.name);

  // Create Payers
  const payer1 = await prisma.payer.upsert({
    where: { payerCode: 'HUM001' },
    update: {},
    create: {
      name: 'Humana Health',
      payerCode: 'HUM001',
      city: 'Louisville',
      state: 'KY',
      phone: '(502) 580-1000',
      email: 'contact@humana.com'
    }
  });
  console.log('✅ Created payer:', payer1.name);

  const payer2 = await prisma.payer.upsert({
    where: { payerCode: 'UHC001' },
    update: {},
    create: {
      name: 'UnitedHealthcare',
      payerCode: 'UHC001',
      city: 'Cincinnati',
      state: 'OH',
      phone: '(513) 555-3000',
      email: 'contact@uhc.com'
    }
  });
  console.log('✅ Created payer:', payer2.name);

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Provider user 1
  const providerUser1 = await prisma.user.upsert({
    where: { email: 'sarah.jones@lpcc.com' },
    update: {},
    create: {
      email: 'sarah.jones@lpcc.com',
      passwordHash,
      role: 'provider_staff',
      providerId: provider1.id,
      firstName: 'Sarah',
      lastName: 'Jones'
    }
  });
  console.log('✅ Created provider user:', providerUser1.email);

  // Provider user 2
  const providerUser2 = await prisma.user.upsert({
    where: { email: 'john.smith@memorial.com' },
    update: {},
    create: {
      email: 'john.smith@memorial.com',
      passwordHash,
      role: 'provider_staff',
      providerId: provider2.id,
      firstName: 'John',
      lastName: 'Smith'
    }
  });
  console.log('✅ Created provider user:', providerUser2.email);

  // Payer user 1
  const payerUser1 = await prisma.user.upsert({
    where: { email: 'marcus.williams@humana.com' },
    update: {},
    create: {
      email: 'marcus.williams@humana.com',
      passwordHash,
      role: 'payer_processor',
      payerId: payer1.id,
      firstName: 'Marcus',
      lastName: 'Williams'
    }
  });
  console.log('✅ Created payer user:', payerUser1.email);

  // Payer user 2
  const payerUser2 = await prisma.user.upsert({
    where: { email: 'lisa.chen@uhc.com' },
    update: {},
    create: {
      email: 'lisa.chen@uhc.com',
      passwordHash,
      role: 'payer_processor',
      payerId: payer2.id,
      firstName: 'Lisa',
      lastName: 'Chen'
    }
  });
  console.log('✅ Created payer user:', payerUser2.email);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Provider: sarah.jones@lpcc.com / password123');
  console.log('Provider: john.smith@memorial.com / password123');
  console.log('Payer: marcus.williams@humana.com / password123');
  console.log('Payer: lisa.chen@uhc.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
