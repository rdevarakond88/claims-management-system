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

  const provider3 = await prisma.provider.upsert({
    where: { npi: '1122334455' },
    update: {},
    create: {
      name: 'Lakeview Primary Care Clinic',
      npi: '1122334455',
      city: 'Louisville',
      state: 'KY',
      phone: '(502) 555-0300',
      email: 'contact@primarycare.com'
    }
  });
  console.log('✅ Created provider:', provider3.name);

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

  // Create Users with role-specific passwords matching TEST_CREDENTIALS.md
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const providerPasswordHash = await bcrypt.hash('Provider123!', 10);
  const payerPasswordHash = await bcrypt.hash('Payer123!', 10);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cms.com' },
    update: { passwordHash: adminPasswordHash, isFirstLogin: false },
    create: {
      email: 'admin@cms.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Provider user 1
  const providerUser1 = await prisma.user.upsert({
    where: { email: 'sarah.jones@lpcc.com' },
    update: { passwordHash: providerPasswordHash, isFirstLogin: false },
    create: {
      email: 'sarah.jones@lpcc.com',
      passwordHash: providerPasswordHash,
      role: 'provider_staff',
      providerId: provider1.id,
      firstName: 'Sarah',
      lastName: 'Jones',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created provider user:', providerUser1.email);

  // Provider user 2
  const providerUser2 = await prisma.user.upsert({
    where: { email: 'john.smith@memorial.com' },
    update: { passwordHash: providerPasswordHash, isFirstLogin: false },
    create: {
      email: 'john.smith@memorial.com',
      passwordHash: providerPasswordHash,
      role: 'provider_staff',
      providerId: provider2.id,
      firstName: 'John',
      lastName: 'Smith',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created provider user:', providerUser2.email);

  // Provider user 3
  const providerUser3 = await prisma.user.upsert({
    where: { email: 'doctor.smith@primarycare.com' },
    update: { passwordHash: providerPasswordHash, isFirstLogin: false },
    create: {
      email: 'doctor.smith@primarycare.com',
      passwordHash: providerPasswordHash,
      role: 'provider_staff',
      providerId: provider3.id,
      firstName: 'John',
      lastName: 'Smith',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created provider user:', providerUser3.email);

  // Payer user 1
  const payerUser1 = await prisma.user.upsert({
    where: { email: 'marcus.williams@humana.com' },
    update: { passwordHash: payerPasswordHash, isFirstLogin: false },
    create: {
      email: 'marcus.williams@humana.com',
      passwordHash: payerPasswordHash,
      role: 'payer_processor',
      payerId: payer1.id,
      firstName: 'Marcus',
      lastName: 'Williams',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created payer user:', payerUser1.email);

  // Payer user 2
  const payerUser2 = await prisma.user.upsert({
    where: { email: 'lisa.chen@uhc.com' },
    update: { passwordHash: payerPasswordHash, isFirstLogin: false },
    create: {
      email: 'lisa.chen@uhc.com',
      passwordHash: payerPasswordHash,
      role: 'payer_processor',
      payerId: payer2.id,
      firstName: 'Lisa',
      lastName: 'Chen',
      isFirstLogin: false,
      isActive: true
    }
  });
  console.log('✅ Created payer user:', payerUser2.email);

  // Create Claims with realistic priorities
  console.log('\n📋 Creating sample claims with AI-style priorities...');

  // URGENT CLAIMS - Emergency procedures, critical diagnoses, high cost
  const urgentClaim1 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251015-0001',
      providerId: provider2.id,
      submittedByUserId: providerUser2.id,
      status: 'submitted',
      priority: 'URGENT',
      priorityConfidence: 0.95,
      priorityReasoning: 'Emergency department visit for acute myocardial infarction (heart attack) with high cost',
      patientFirstName: 'Robert',
      patientLastName: 'Johnson',
      patientDob: new Date('1965-03-15'),
      patientMemberId: 'MEM987654321',
      cptCode: '99285', // Emergency department visit, high severity
      icd10Code: 'I21.9', // Acute myocardial infarction
      serviceDate: new Date('2025-10-15'),
      billedAmount: 8500.00,
      submittedAt: new Date('2025-10-15T14:30:00Z')
    }
  });
  console.log('✅ Created URGENT claim:', urgentClaim1.claimNumber);

  const urgentClaim2 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251020-0002',
      providerId: provider2.id,
      submittedByUserId: providerUser2.id,
      status: 'submitted',
      priority: 'URGENT',
      priorityConfidence: 0.92,
      priorityReasoning: 'Emergency visit for severe trauma with multiple procedures required',
      patientFirstName: 'Maria',
      patientLastName: 'Garcia',
      patientDob: new Date('1978-08-22'),
      patientMemberId: 'MEM123456789',
      cptCode: '99284', // Emergency department visit, high severity
      icd10Code: 'S72.001A', // Fracture of femur, initial encounter
      serviceDate: new Date('2025-10-20'),
      billedAmount: 12500.00,
      submittedAt: new Date('2025-10-20T16:45:00Z')
    }
  });
  console.log('✅ Created URGENT claim:', urgentClaim2.claimNumber);

  const urgentClaim3 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251025-0003',
      providerId: provider1.id,
      submittedByUserId: providerUser1.id,
      status: 'submitted',
      priority: 'URGENT',
      priorityConfidence: 0.88,
      priorityReasoning: 'High-cost surgical procedure for critical condition',
      patientFirstName: 'James',
      patientLastName: 'Wilson',
      patientDob: new Date('1952-11-30'),
      patientMemberId: 'MEM555666777',
      cptCode: '27447', // Total knee arthroplasty
      icd10Code: 'M17.11', // Unilateral primary osteoarthritis, right knee
      serviceDate: new Date('2025-10-25'),
      billedAmount: 25000.00,
      submittedAt: new Date('2025-10-25T09:15:00Z')
    }
  });
  console.log('✅ Created URGENT claim:', urgentClaim3.claimNumber);

  // STANDARD CLAIMS - Routine hospitalizations, moderate procedures
  const standardClaim1 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251018-0004',
      providerId: provider1.id,
      submittedByUserId: providerUser1.id,
      status: 'submitted',
      priority: 'STANDARD',
      priorityConfidence: 0.85,
      priorityReasoning: 'Diagnostic imaging procedure with moderate cost, non-urgent condition',
      patientFirstName: 'Emily',
      patientLastName: 'Brown',
      patientDob: new Date('1990-05-12'),
      patientMemberId: 'MEM111222333',
      cptCode: '70450', // CT scan of head without contrast
      icd10Code: 'R51', // Headache
      serviceDate: new Date('2025-10-18'),
      billedAmount: 850.00,
      submittedAt: new Date('2025-10-18T11:20:00Z')
    }
  });
  console.log('✅ Created STANDARD claim:', standardClaim1.claimNumber);

  const standardClaim2 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251022-0005',
      providerId: provider3.id,
      submittedByUserId: providerUser3.id,
      status: 'submitted',
      priority: 'STANDARD',
      priorityConfidence: 0.82,
      priorityReasoning: 'Established patient office visit for chronic condition management',
      patientFirstName: 'Michael',
      patientLastName: 'Davis',
      patientDob: new Date('1968-07-08'),
      patientMemberId: 'MEM444555666',
      cptCode: '99214', // Office visit, established patient, moderate complexity
      icd10Code: 'E11.9', // Type 2 diabetes without complications
      serviceDate: new Date('2025-10-22'),
      billedAmount: 175.00,
      submittedAt: new Date('2025-10-22T10:30:00Z')
    }
  });
  console.log('✅ Created STANDARD claim:', standardClaim2.claimNumber);

  const standardClaim3 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251024-0006',
      providerId: provider2.id,
      submittedByUserId: providerUser2.id,
      status: 'approved',
      priority: 'STANDARD',
      priorityConfidence: 0.79,
      priorityReasoning: 'Laboratory tests for ongoing treatment monitoring',
      patientFirstName: 'Jennifer',
      patientLastName: 'Martinez',
      patientDob: new Date('1985-02-18'),
      patientMemberId: 'MEM777888999',
      cptCode: '80053', // Comprehensive metabolic panel
      icd10Code: 'I10', // Essential hypertension
      serviceDate: new Date('2025-10-24'),
      billedAmount: 125.00,
      approvedAmount: 125.00,
      adjudicatedByUserId: payerUser1.id,
      adjudicatedAt: new Date('2025-10-26T14:00:00Z'),
      submittedAt: new Date('2025-10-24T13:45:00Z')
    }
  });
  console.log('✅ Created STANDARD claim (approved):', standardClaim3.claimNumber);

  // ROUTINE CLAIMS - Preventive care, annual checkups, low-cost procedures
  const routineClaim1 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251016-0007',
      providerId: provider1.id,
      submittedByUserId: providerUser1.id,
      status: 'approved',
      priority: 'ROUTINE',
      priorityConfidence: 0.91,
      priorityReasoning: 'Preventive annual wellness visit, standard screening',
      patientFirstName: 'Sarah',
      patientLastName: 'Anderson',
      patientDob: new Date('1975-09-25'),
      patientMemberId: 'MEM222333444',
      cptCode: '99395', // Periodic comprehensive preventive medicine, age 40-64
      icd10Code: 'Z00.00', // Encounter for general adult medical examination
      serviceDate: new Date('2025-10-16'),
      billedAmount: 200.00,
      approvedAmount: 200.00,
      adjudicatedByUserId: payerUser1.id,
      adjudicatedAt: new Date('2025-10-18T10:00:00Z'),
      submittedAt: new Date('2025-10-16T09:00:00Z')
    }
  });
  console.log('✅ Created ROUTINE claim (approved):', routineClaim1.claimNumber);

  const routineClaim2 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251019-0008',
      providerId: provider3.id,
      submittedByUserId: providerUser3.id,
      status: 'submitted',
      priority: 'ROUTINE',
      priorityConfidence: 0.94,
      priorityReasoning: 'Basic office visit for minor acute condition, low cost',
      patientFirstName: 'David',
      patientLastName: 'Thompson',
      patientDob: new Date('1995-12-05'),
      patientMemberId: 'MEM666777888',
      cptCode: '99213', // Office visit, established patient, low to moderate complexity
      icd10Code: 'J06.9', // Acute upper respiratory infection
      serviceDate: new Date('2025-10-19'),
      billedAmount: 150.00,
      submittedAt: new Date('2025-10-19T15:30:00Z')
    }
  });
  console.log('✅ Created ROUTINE claim:', routineClaim2.claimNumber);

  const routineClaim3 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251021-0009',
      providerId: provider1.id,
      submittedByUserId: providerUser1.id,
      status: 'submitted',
      priority: 'ROUTINE',
      priorityConfidence: 0.89,
      priorityReasoning: 'Preventive vaccination service, very low cost',
      patientFirstName: 'Lisa',
      patientLastName: 'White',
      patientDob: new Date('1988-04-14'),
      patientMemberId: 'MEM333444555',
      cptCode: '90471', // Immunization administration
      icd10Code: 'Z23', // Encounter for immunization
      serviceDate: new Date('2025-10-21'),
      billedAmount: 45.00,
      submittedAt: new Date('2025-10-21T14:15:00Z')
    }
  });
  console.log('✅ Created ROUTINE claim:', routineClaim3.claimNumber);

  const routineClaim4 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-20251023-0010',
      providerId: provider3.id,
      submittedByUserId: providerUser3.id,
      status: 'denied',
      priority: 'ROUTINE',
      priorityConfidence: 0.87,
      priorityReasoning: 'Follow-up visit for resolved minor condition',
      patientFirstName: 'Kevin',
      patientLastName: 'Lee',
      patientDob: new Date('2000-06-30'),
      patientMemberId: 'MEM888999000',
      cptCode: '99212', // Office visit, established patient, straightforward
      icd10Code: 'L60.0', // Ingrown nail
      serviceDate: new Date('2025-10-23'),
      billedAmount: 95.00,
      denialReasonCode: 'CO-16',
      denialExplanation: 'Claim lacks information needed for adjudication',
      adjudicatedByUserId: payerUser2.id,
      adjudicatedAt: new Date('2025-10-25T11:30:00Z'),
      submittedAt: new Date('2025-10-23T08:45:00Z')
    }
  });
  console.log('✅ Created ROUTINE claim (denied):', routineClaim4.claimNumber);

  // Generate additional 30-day historical claims for analytics dashboard
  console.log('\n📊 Generating 30-day historical claims for analytics dashboard...');

  const today = new Date();
  const claimsToCreate = [];
  let claimCounter = 100; // Start from CLM-20251001-0100

  // Helper function to generate random date within last 30 days
  const getRandomDate = (daysAgo) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    return date;
  };

  // Sample data for realistic claims
  const urgentProcedures = [
    { cpt: '99285', icd: 'I21.9', desc: 'Emergency dept - heart attack', amount: [7000, 12000], confidence: [0.90, 0.96] },
    { cpt: '99284', icd: 'S06.0X1A', desc: 'Emergency dept - head trauma', amount: [5000, 9000], confidence: [0.88, 0.94] },
    { cpt: '99291', icd: 'J96.01', desc: 'Critical care - respiratory failure', amount: [8000, 15000], confidence: [0.92, 0.97] },
    { cpt: '43235', icd: 'K92.1', desc: 'Emergency endoscopy - GI bleeding', amount: [4000, 8000], confidence: [0.85, 0.92] },
    { cpt: '27447', icd: 'S72.001A', desc: 'Emergency surgery - femur fracture', amount: [10000, 20000], confidence: [0.89, 0.95] },
  ];

  const standardProcedures = [
    { cpt: '70553', icd: 'G44.1', desc: 'MRI brain with contrast', amount: [1500, 3000], confidence: [0.75, 0.88] },
    { cpt: '29881', icd: 'M23.91', desc: 'Knee arthroscopy', amount: [3000, 6000], confidence: [0.78, 0.87] },
    { cpt: '45378', icd: 'K63.5', desc: 'Diagnostic colonoscopy', amount: [1200, 2500], confidence: [0.80, 0.89] },
    { cpt: '97110', icd: 'M79.3', desc: 'Physical therapy', amount: [150, 300], confidence: [0.72, 0.85] },
    { cpt: '93306', icd: 'I50.9', desc: 'Echocardiogram', amount: [800, 1500], confidence: [0.76, 0.86] },
  ];

  const routineProcedures = [
    { cpt: '99213', icd: 'Z00.00', desc: 'Office visit - wellness', amount: [100, 250], confidence: [0.85, 0.93] },
    { cpt: '90658', icd: 'Z23', desc: 'Flu vaccination', amount: [25, 50], confidence: [0.88, 0.95] },
    { cpt: '99395', icd: 'Z00.00', desc: 'Annual physical exam', amount: [150, 300], confidence: [0.87, 0.94] },
    { cpt: '82947', icd: 'E11.9', desc: 'Glucose test - diabetes follow-up', amount: [30, 80], confidence: [0.82, 0.91] },
    { cpt: '92015', icd: 'H52.4', desc: 'Routine eye examination', amount: [75, 150], confidence: [0.84, 0.92] },
  ];

  const providers = [provider1.id, provider2.id, provider3.id];
  const providerUsers = [providerUser1.id, providerUser2.id, providerUser3.id];
  const payerUsers = [payerUser1.id, payerUser2.id];

  const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'James', 'Elizabeth', 'Joseph', 'Susan', 'Charles', 'Jessica', 'Thomas', 'Sarah', 'Daniel', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  // Generate 23 URGENT claims (15% of total, targeting ~150 claims)
  for (let i = 0; i < 23; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const submittedAt = getRandomDate(daysAgo);
    const proc = urgentProcedures[Math.floor(Math.random() * urgentProcedures.length)];
    const billedAmount = proc.amount[0] + Math.random() * (proc.amount[1] - proc.amount[0]);
    const confidence = proc.confidence[0] + Math.random() * (proc.confidence[1] - proc.confidence[0]);

    // Urgent claims are mostly adjudicated quickly (80% adjudicated)
    const isAdjudicated = Math.random() < 0.80;
    const status = isAdjudicated ? (Math.random() < 0.90 ? 'approved' : 'denied') : 'submitted';

    let adjudicatedAt = null;
    let approvedAmount = null;
    let adjudicatedByUserId = null;
    let denialReasonCode = null;
    let denialExplanation = null;

    if (isAdjudicated) {
      // Urgent claims are adjudicated in 12-36 hours
      const hoursToAdjudicate = 12 + Math.random() * 24;
      adjudicatedAt = new Date(submittedAt.getTime() + hoursToAdjudicate * 60 * 60 * 1000);
      adjudicatedByUserId = payerUsers[Math.floor(Math.random() * payerUsers.length)];

      if (status === 'approved') {
        // Approved amount is 85-100% of billed amount
        approvedAmount = billedAmount * (0.85 + Math.random() * 0.15);
      } else {
        denialReasonCode = 'MISSING_DOC';
        denialExplanation = 'Missing required pre-authorization for emergency procedure';
      }
    }

    claimsToCreate.push({
      claimNumber: `CLM-${submittedAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(claimCounter++).padStart(4, '0')}`,
      providerId: providers[Math.floor(Math.random() * providers.length)],
      submittedByUserId: providerUsers[Math.floor(Math.random() * providerUsers.length)],
      status,
      priority: 'URGENT',
      priorityConfidence: parseFloat(confidence.toFixed(2)),
      priorityReasoning: proc.desc + ' - high severity and immediate attention required',
      patientFirstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      patientLastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      patientDob: new Date(1940 + Math.floor(Math.random() * 60), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
      patientMemberId: `MEM${Math.floor(Math.random() * 1000000000)}`,
      cptCode: proc.cpt,
      icd10Code: proc.icd,
      serviceDate: new Date(submittedAt.getTime() - 24 * 60 * 60 * 1000), // Day before submission
      billedAmount: parseFloat(billedAmount.toFixed(2)),
      approvedAmount: approvedAmount ? parseFloat(approvedAmount.toFixed(2)) : null,
      submittedAt,
      adjudicatedAt,
      adjudicatedByUserId,
      denialReasonCode,
      denialExplanation,
    });
  }

  // Generate 85 STANDARD claims (57% of total)
  for (let i = 0; i < 85; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const submittedAt = getRandomDate(daysAgo);
    const proc = standardProcedures[Math.floor(Math.random() * standardProcedures.length)];
    const billedAmount = proc.amount[0] + Math.random() * (proc.amount[1] - proc.amount[0]);
    const confidence = proc.confidence[0] + Math.random() * (proc.confidence[1] - proc.confidence[0]);

    // Standard claims adjudicated 65% of the time
    const isAdjudicated = daysAgo > 5 ? Math.random() < 0.70 : Math.random() < 0.40;
    const status = isAdjudicated ? (Math.random() < 0.88 ? 'approved' : 'denied') : 'submitted';

    let adjudicatedAt = null;
    let approvedAmount = null;
    let adjudicatedByUserId = null;
    let denialReasonCode = null;
    let denialExplanation = null;

    if (isAdjudicated) {
      // Standard claims adjudicated in 24-96 hours
      const hoursToAdjudicate = 24 + Math.random() * 72;
      adjudicatedAt = new Date(submittedAt.getTime() + hoursToAdjudicate * 60 * 60 * 1000);
      adjudicatedByUserId = payerUsers[Math.floor(Math.random() * payerUsers.length)];

      if (status === 'approved') {
        approvedAmount = billedAmount * (0.80 + Math.random() * 0.15);
      } else {
        const denialReasons = [
          { code: 'NOT_COVERED', text: 'Service not covered under current plan' },
          { code: 'MISSING_DOC', text: 'Missing required documentation' },
          { code: 'DUPLICATE', text: 'Duplicate claim submission' },
        ];
        const denial = denialReasons[Math.floor(Math.random() * denialReasons.length)];
        denialReasonCode = denial.code;
        denialExplanation = denial.text;
      }
    }

    claimsToCreate.push({
      claimNumber: `CLM-${submittedAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(claimCounter++).padStart(4, '0')}`,
      providerId: providers[Math.floor(Math.random() * providers.length)],
      submittedByUserId: providerUsers[Math.floor(Math.random() * providerUsers.length)],
      status,
      priority: 'STANDARD',
      priorityConfidence: parseFloat(confidence.toFixed(2)),
      priorityReasoning: proc.desc + ' - moderate complexity, standard processing timeline',
      patientFirstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      patientLastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      patientDob: new Date(1940 + Math.floor(Math.random() * 60), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
      patientMemberId: `MEM${Math.floor(Math.random() * 1000000000)}`,
      cptCode: proc.cpt,
      icd10Code: proc.icd,
      serviceDate: new Date(submittedAt.getTime() - 24 * 60 * 60 * 1000),
      billedAmount: parseFloat(billedAmount.toFixed(2)),
      approvedAmount: approvedAmount ? parseFloat(approvedAmount.toFixed(2)) : null,
      submittedAt,
      adjudicatedAt,
      adjudicatedByUserId,
      denialReasonCode,
      denialExplanation,
    });
  }

  // Generate 42 ROUTINE claims (28% of total)
  for (let i = 0; i < 42; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const submittedAt = getRandomDate(daysAgo);
    const proc = routineProcedures[Math.floor(Math.random() * routineProcedures.length)];
    const billedAmount = proc.amount[0] + Math.random() * (proc.amount[1] - proc.amount[0]);
    const confidence = proc.confidence[0] + Math.random() * (proc.confidence[1] - proc.confidence[0]);

    // Routine claims adjudicated 70% of the time (faster for preventive)
    const isAdjudicated = daysAgo > 7 ? Math.random() < 0.75 : Math.random() < 0.50;
    const status = isAdjudicated ? (Math.random() < 0.92 ? 'approved' : 'denied') : 'submitted';

    let adjudicatedAt = null;
    let approvedAmount = null;
    let adjudicatedByUserId = null;
    let denialReasonCode = null;
    let denialExplanation = null;

    if (isAdjudicated) {
      // Routine claims adjudicated in 48-168 hours (2-7 days)
      const hoursToAdjudicate = 48 + Math.random() * 120;
      adjudicatedAt = new Date(submittedAt.getTime() + hoursToAdjudicate * 60 * 60 * 1000);
      adjudicatedByUserId = payerUsers[Math.floor(Math.random() * payerUsers.length)];

      if (status === 'approved') {
        // Preventive care often covered 100%
        approvedAmount = billedAmount * (0.95 + Math.random() * 0.05);
      } else {
        denialReasonCode = 'ANNUAL_LIMIT';
        denialExplanation = 'Annual preventive care limit exceeded';
      }
    }

    claimsToCreate.push({
      claimNumber: `CLM-${submittedAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(claimCounter++).padStart(4, '0')}`,
      providerId: providers[Math.floor(Math.random() * providers.length)],
      submittedByUserId: providerUsers[Math.floor(Math.random() * providerUsers.length)],
      status,
      priority: 'ROUTINE',
      priorityConfidence: parseFloat(confidence.toFixed(2)),
      priorityReasoning: proc.desc + ' - preventive/routine care, standard processing acceptable',
      patientFirstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      patientLastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      patientDob: new Date(1940 + Math.floor(Math.random() * 60), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
      patientMemberId: `MEM${Math.floor(Math.random() * 1000000000)}`,
      cptCode: proc.cpt,
      icd10Code: proc.icd,
      serviceDate: new Date(submittedAt.getTime() - 24 * 60 * 60 * 1000),
      billedAmount: parseFloat(billedAmount.toFixed(2)),
      approvedAmount: approvedAmount ? parseFloat(approvedAmount.toFixed(2)) : null,
      submittedAt,
      adjudicatedAt,
      adjudicatedByUserId,
      denialReasonCode,
      denialExplanation,
    });
  }

  // Sort claims by submitted date
  claimsToCreate.sort((a, b) => a.submittedAt - b.submittedAt);

  // Create all claims
  for (const claimData of claimsToCreate) {
    await prisma.claim.create({ data: claimData });
  }

  console.log(`✅ Created ${claimsToCreate.length} additional claims for analytics dashboard`);
  console.log(`   - ${claimsToCreate.filter(c => c.priority === 'URGENT').length} URGENT claims`);
  console.log(`   - ${claimsToCreate.filter(c => c.priority === 'STANDARD').length} STANDARD claims`);
  console.log(`   - ${claimsToCreate.filter(c => c.priority === 'ROUTINE').length} ROUTINE claims`);
  console.log(`   - ${claimsToCreate.filter(c => c.status === 'approved').length} approved`);
  console.log(`   - ${claimsToCreate.filter(c => c.status === 'denied').length} denied`);
  console.log(`   - ${claimsToCreate.filter(c => c.status === 'submitted').length} pending`);

  // Create audit logs for adjudicated claims
  await prisma.auditLog.createMany({
    data: [
      {
        claimId: standardClaim3.id,
        userId: payerUser1.id,
        action: 'claim_approved',
        oldStatus: 'submitted',
        newStatus: 'approved',
        details: { approvedAmount: 125.00, note: 'All documentation provided' }
      },
      {
        claimId: routineClaim1.id,
        userId: payerUser1.id,
        action: 'claim_approved',
        oldStatus: 'submitted',
        newStatus: 'approved',
        details: { approvedAmount: 200.00, note: 'Preventive care covered' }
      },
      {
        claimId: routineClaim4.id,
        userId: payerUser2.id,
        action: 'claim_denied',
        oldStatus: 'submitted',
        newStatus: 'denied',
        details: { denialReason: 'Missing required documentation' }
      }
    ]
  });
  console.log('✅ Created audit logs for adjudicated claims');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📝 Test Credentials (matches TEST_CREDENTIALS.md):');
  console.log('Admin: admin@cms.com / Admin123!');
  console.log('Provider: sarah.jones@lpcc.com / Provider123!');
  console.log('Provider: john.smith@memorial.com / Provider123!');
  console.log('Provider: doctor.smith@primarycare.com / Provider123!');
  console.log('Payer: marcus.williams@humana.com / Payer123!');
  console.log('Payer: lisa.chen@uhc.com / Payer123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
