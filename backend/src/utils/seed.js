require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { subDays, subMonths } = require('date-fns');
const prisma = require('../prisma/client');

const CATEGORIES = [
  'Food & Dining','Transportation','Shopping','Entertainment',
  'Healthcare','Housing','Utilities','Education','Travel',
  'Personal Care','Subscriptions','Other',
];

const SAMPLE_EXPENSES = [
  { title: 'Grocery Store', amount: 85.50, category: 'Food & Dining', paymentMethod: 'debit_card' },
  { title: 'Netflix', amount: 15.99, category: 'Subscriptions', paymentMethod: 'credit_card' },
  { title: 'Gas Station', amount: 55.00, category: 'Transportation', paymentMethod: 'credit_card' },
  { title: 'Restaurant Dinner', amount: 42.80, category: 'Food & Dining', paymentMethod: 'credit_card' },
  { title: 'Electric Bill', amount: 120.00, category: 'Utilities', paymentMethod: 'bank_transfer' },
  { title: 'Amazon Order', amount: 67.99, category: 'Shopping', paymentMethod: 'credit_card' },
  { title: 'Doctor Visit', amount: 25.00, category: 'Healthcare', paymentMethod: 'debit_card' },
  { title: 'Spotify', amount: 9.99, category: 'Subscriptions', paymentMethod: 'credit_card' },
  { title: 'Coffee Shop', amount: 18.50, category: 'Food & Dining', paymentMethod: 'digital_wallet' },
  { title: 'Gym Membership', amount: 40.00, category: 'Personal Care', paymentMethod: 'debit_card' },
  { title: 'Taxi Ride', amount: 22.00, category: 'Transportation', paymentMethod: 'digital_wallet' },
  { title: 'Movie Tickets', amount: 32.00, category: 'Entertainment', paymentMethod: 'credit_card' },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const password = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@expensetracker.com' },
    update: {},
    create: { name: 'Demo User', email: 'demo@expensetracker.com', password, currency: 'USD' },
  });
  console.log('✅ Demo user:', user.email);

  // Create expenses for last 3 months
  let created = 0;
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    for (let i = 0; i < SAMPLE_EXPENSES.length; i++) {
      const exp = SAMPLE_EXPENSES[i];
      const daysBack = monthOffset * 30 + Math.floor(Math.random() * 28);
      await prisma.expense.create({
        data: {
          userId:        user.id,
          title:         exp.title,
          amount:        exp.amount * (0.85 + Math.random() * 0.3), // slight variation
          currency:      'USD',
          category:      exp.category,
          date:          subDays(new Date(), daysBack),
          paymentMethod: exp.paymentMethod,
        },
      });
      created++;
    }
  }
  console.log(`✅ Created ${created} sample expenses`);

  // Create budgets
  const budgets = [
    { category: 'Total',           amount: 2000 },
    { category: 'Food & Dining',   amount: 400 },
    { category: 'Transportation',  amount: 200 },
    { category: 'Shopping',        amount: 300 },
    { category: 'Entertainment',   amount: 100 },
    { category: 'Subscriptions',   amount: 50 },
    { category: 'Utilities',       amount: 150 },
  ];

  for (const b of budgets) {
    await prisma.budget.upsert({
      where: { id: `seed-${user.id}-${b.category}`.replace(/[^a-z0-9-]/gi, '-') },
      update: {},
      create: { id: `seed-${user.id}-${b.category}`.replace(/[^a-z0-9-]/gi, '-'), userId: user.id, ...b, period: 'monthly' },
    }).catch(() => prisma.budget.create({ data: { userId: user.id, ...b, period: 'monthly' } }));
  }
  console.log('✅ Created budgets');

  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@expensetracker.com / demo1234');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
