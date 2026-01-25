/**
 * Demo Data Seed Script
 *
 * Creates a demo family with 4 members, 3 bank accounts,
 * and 150+ transactions per account.
 *
 * Run with: npx ts-node demo/seed.ts
 * Or from backend: npm run seed:demo
 */

import { PrismaClient, UserRole, UserStatus, AccountType, CategoryType, TransactionType, BudgetPeriodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Demo password for all users (hashed)
const DEMO_PASSWORD = 'Demo123!';

// Helper to generate random amount within range
function randomAmount(min: number, max: number): Decimal {
  const amount = Math.random() * (max - min) + min;
  return new Decimal(amount.toFixed(2));
}

// Helper to generate random date within last N months
function randomDate(monthsBack: number): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Payee lists for realistic transaction names
const expensePayees = {
  groceries: ['Tesco', 'Lidl', 'Aldi', 'SuperValu', 'Dunnes Stores', 'Centra', 'Spar'],
  dining: ['McDonalds', 'Subway', 'Nandos', 'Pizza Hut', 'Dominos', 'Starbucks', 'Costa Coffee', 'The Local Pub'],
  transport: ['Dublin Bus', 'Luas', 'Irish Rail', 'Circle K Fuel', 'Applegreen', 'Maxol', 'Uber', 'Bolt'],
  utilities: ['Electric Ireland', 'Bord Gais', 'Irish Water', 'Eir', 'Virgin Media', 'Sky Ireland', 'Three Mobile'],
  shopping: ['Penneys', 'H&M', 'Zara', 'TK Maxx', 'Argos', 'Currys', 'Harvey Norman', 'IKEA'],
  entertainment: ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime', 'Odeon Cinema', 'Vue Cinema', 'PlayStation Store'],
  healthcare: ['Boots Pharmacy', 'Lloyds Pharmacy', 'GP Visit', 'VHI Healthcare', 'Laya Healthcare'],
  subscriptions: ['Gym Plus', 'FLYEfit', 'The Irish Times', 'Adobe Creative', 'Microsoft 365'],
};

const incomePayees = ['Monthly Salary', 'Freelance Work', 'Dividend Payment', 'Tax Refund', 'Cashback Reward', 'Gift'];

async function main() {
  console.log('Starting demo data seed...\n');

  // Clean existing demo data (optional - comment out to preserve)
  await cleanDemoData();

  // Create family
  console.log('Creating demo family...');
  const family = await prisma.family.create({
    data: {
      name: 'The Smith Family',
    },
  });
  console.log(`  Created family: ${family.name} (${family.id})`);

  // Hash password
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Create family members (4 members)
  console.log('\nCreating family members...');
  const members = [
    { name: 'John Smith', email: 'john@demo.mybudget.app', role: UserRole.FAMILY_ADMIN },
    { name: 'Jane Smith', email: 'jane@demo.mybudget.app', role: UserRole.MEMBER },
    { name: 'Tom Smith', email: 'tom@demo.mybudget.app', role: UserRole.MEMBER },
    { name: 'Emma Smith', email: 'emma@demo.mybudget.app', role: UserRole.VIEWER },
  ];

  const users: any[] = [];
  for (const member of members) {
    const user = await prisma.user.create({
      data: {
        familyId: family.id,
        email: member.email,
        passwordHash,
        name: member.name,
        role: member.role,
        status: UserStatus.ACTIVE,
      },
    });
    users.push(user);
    console.log(`  Created user: ${user.name} (${user.role})`);
  }

  // Create categories
  console.log('\nCreating categories...');
  const categories = await createCategories(family.id);
  console.log(`  Created ${Object.keys(categories).length} categories`);

  // Create bank accounts (3 accounts)
  console.log('\nCreating bank accounts...');
  const accounts = [
    {
      name: 'AIB Current Account',
      type: AccountType.BANK,
      currency: 'EUR',
      openingBalance: new Decimal('2500.00'),
    },
    {
      name: 'Bank of Ireland Savings',
      type: AccountType.SAVINGS,
      currency: 'EUR',
      openingBalance: new Decimal('15000.00'),
    },
    {
      name: 'Revolut Card',
      type: AccountType.CARD,
      currency: 'EUR',
      openingBalance: new Decimal('500.00'),
    },
  ];

  const createdAccounts: any[] = [];
  for (const acc of accounts) {
    const account = await prisma.account.create({
      data: {
        familyId: family.id,
        ...acc,
      },
    });
    createdAccounts.push(account);
    console.log(`  Created account: ${account.name} (${account.type})`);
  }

  // Create transactions (100+ per account)
  console.log('\nCreating transactions...');
  let totalTransactions = 0;

  for (const account of createdAccounts) {
    const txCount = await createTransactionsForAccount(
      family.id,
      account,
      users,
      categories
    );
    totalTransactions += txCount;
    console.log(`  Created ${txCount} transactions for ${account.name}`);
  }

  console.log(`\n  Total transactions created: ${totalTransactions}`);

  // Create budgets
  console.log('\nCreating budgets...');
  const budgetCount = await createBudgets(family.id, categories);
  console.log(`  Created ${budgetCount} budgets`);

  console.log('\n========================================');
  console.log('Demo data seed completed successfully!');
  console.log('========================================');
  console.log('\nDemo Credentials:');
  console.log('  Admin: john@demo.mybudget.app / Demo123!');
  console.log('  Member: jane@demo.mybudget.app / Demo123!');
  console.log('  Member: tom@demo.mybudget.app / Demo123!');
  console.log('  Viewer: emma@demo.mybudget.app / Demo123!');
  console.log('\nSummary:');
  console.log(`  Family: ${family.name}`);
  console.log(`  Members: ${users.length}`);
  console.log(`  Accounts: ${createdAccounts.length}`);
  console.log(`  Transactions: ${totalTransactions}`);
  console.log(`  Budgets: ${budgetCount}`);
}

async function cleanDemoData() {
  console.log('Cleaning existing demo data...');

  // Find demo family
  const demoFamily = await prisma.family.findFirst({
    where: { name: 'The Smith Family' },
  });

  if (demoFamily) {
    // Delete in order due to foreign keys
    await prisma.transaction.deleteMany({ where: { familyId: demoFamily.id } });
    await prisma.budget.deleteMany({ where: { familyId: demoFamily.id } });
    await prisma.account.deleteMany({ where: { familyId: demoFamily.id } });
    await prisma.category.deleteMany({ where: { familyId: demoFamily.id } });
    await prisma.familyInvitation.deleteMany({ where: { familyId: demoFamily.id } });

    // Delete users (will cascade refresh tokens, etc.)
    await prisma.user.deleteMany({ where: { familyId: demoFamily.id } });

    // Delete family
    await prisma.family.delete({ where: { id: demoFamily.id } });

    console.log('  Removed existing demo data\n');
  } else {
    console.log('  No existing demo data found\n');
  }
}

async function createCategories(familyId: string) {
  const categoryData = [
    // Expense categories
    { name: 'Groceries', type: CategoryType.EXPENSE, color: '#4CAF50', icon: 'shopping-cart' },
    { name: 'Dining Out', type: CategoryType.EXPENSE, color: '#FF9800', icon: 'restaurant' },
    { name: 'Transport', type: CategoryType.EXPENSE, color: '#2196F3', icon: 'car' },
    { name: 'Utilities', type: CategoryType.EXPENSE, color: '#9C27B0', icon: 'bolt' },
    { name: 'Shopping', type: CategoryType.EXPENSE, color: '#E91E63', icon: 'shopping-bag' },
    { name: 'Entertainment', type: CategoryType.EXPENSE, color: '#00BCD4', icon: 'tv' },
    { name: 'Healthcare', type: CategoryType.EXPENSE, color: '#F44336', icon: 'heart' },
    { name: 'Subscriptions', type: CategoryType.EXPENSE, color: '#673AB7', icon: 'repeat' },
    { name: 'Education', type: CategoryType.EXPENSE, color: '#3F51B5', icon: 'book' },
    { name: 'Gifts', type: CategoryType.EXPENSE, color: '#FFEB3B', icon: 'gift' },
    { name: 'Personal Care', type: CategoryType.EXPENSE, color: '#FF5722', icon: 'smile' },
    { name: 'Home', type: CategoryType.EXPENSE, color: '#795548', icon: 'home' },
    { name: 'Insurance', type: CategoryType.EXPENSE, color: '#607D8B', icon: 'shield' },
    { name: 'Miscellaneous', type: CategoryType.EXPENSE, color: '#9E9E9E', icon: 'more-horizontal' },
    // Income categories
    { name: 'Salary', type: CategoryType.INCOME, color: '#4CAF50', icon: 'briefcase' },
    { name: 'Freelance', type: CategoryType.INCOME, color: '#8BC34A', icon: 'laptop' },
    { name: 'Investments', type: CategoryType.INCOME, color: '#CDDC39', icon: 'trending-up' },
    { name: 'Other Income', type: CategoryType.INCOME, color: '#FFC107', icon: 'plus-circle' },
    // Transfer category
    { name: 'Transfer', type: CategoryType.TRANSFER, color: '#00BCD4', icon: 'repeat' },
  ];

  const categories: Record<string, any> = {};

  for (const cat of categoryData) {
    const category = await prisma.category.create({
      data: {
        familyId,
        ...cat,
      },
    });
    categories[cat.name] = category;
  }

  return categories;
}

async function createTransactionsForAccount(
  familyId: string,
  account: any,
  users: any[],
  categories: Record<string, any>
) {
  const transactions: any[] = [];
  const monthsOfData = 12; // Generate 12 months of data

  // Determine transaction distribution based on account type
  // Target: at least 150 transactions per account
  let incomeCount = 0;
  let expenseCount = 0;

  if (account.type === AccountType.SAVINGS) {
    // Savings: mostly income (deposits), some expenses (withdrawals)
    incomeCount = 100;
    expenseCount = 55;
  } else if (account.type === AccountType.CARD) {
    // Card: mostly expenses, some income (refunds/cashback)
    incomeCount = 15;
    expenseCount = 140;
  } else {
    // Current account: balanced mix
    incomeCount = 50;
    expenseCount = 110;
  }

  // Generate income transactions
  for (let i = 0; i < incomeCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const isSalary = i < 12; // First 12 are monthly salaries

    let category, amount, payee, date;

    if (isSalary) {
      category = categories['Salary'];
      amount = randomAmount(3000, 5000);
      payee = 'Monthly Salary';
      // Salary on last day of each month
      const monthsAgo = i;
      date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      date.setDate(28);
    } else {
      const incomeCategories = ['Freelance', 'Investments', 'Other Income'];
      const catName = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      category = categories[catName];
      amount = randomAmount(50, 500);
      payee = incomePayees[Math.floor(Math.random() * incomePayees.length)];
      date = randomDate(monthsOfData);
    }

    transactions.push({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      userId: user.id,
      type: TransactionType.INCOME,
      amount,
      currency: account.currency,
      date,
      payee,
      notes: '',
    });
  }

  // Generate expense transactions
  const expenseCategories = [
    { name: 'Groceries', weight: 20, payees: expensePayees.groceries, minAmount: 15, maxAmount: 150 },
    { name: 'Dining Out', weight: 15, payees: expensePayees.dining, minAmount: 8, maxAmount: 80 },
    { name: 'Transport', weight: 12, payees: expensePayees.transport, minAmount: 5, maxAmount: 100 },
    { name: 'Utilities', weight: 8, payees: expensePayees.utilities, minAmount: 30, maxAmount: 200 },
    { name: 'Shopping', weight: 10, payees: expensePayees.shopping, minAmount: 20, maxAmount: 200 },
    { name: 'Entertainment', weight: 12, payees: expensePayees.entertainment, minAmount: 10, maxAmount: 50 },
    { name: 'Healthcare', weight: 5, payees: expensePayees.healthcare, minAmount: 20, maxAmount: 150 },
    { name: 'Subscriptions', weight: 8, payees: expensePayees.subscriptions, minAmount: 10, maxAmount: 50 },
    { name: 'Personal Care', weight: 5, payees: ['Boots Pharmacy', 'Dunnes Beauty', 'Hair Salon'], minAmount: 15, maxAmount: 80 },
    { name: 'Home', weight: 5, payees: ['IKEA', 'Woodies', 'Home Store'], minAmount: 30, maxAmount: 300 },
  ];

  // Calculate total weight
  const totalWeight = expenseCategories.reduce((sum, c) => sum + c.weight, 0);

  for (let i = 0; i < expenseCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];

    // Select category based on weight
    let random = Math.random() * totalWeight;
    let selectedCategory = expenseCategories[0];
    for (const cat of expenseCategories) {
      random -= cat.weight;
      if (random <= 0) {
        selectedCategory = cat;
        break;
      }
    }

    const category = categories[selectedCategory.name];
    const payee = selectedCategory.payees[Math.floor(Math.random() * selectedCategory.payees.length)];
    const amount = randomAmount(selectedCategory.minAmount, selectedCategory.maxAmount);
    const date = randomDate(monthsOfData);

    transactions.push({
      familyId,
      accountId: account.id,
      categoryId: category.id,
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount,
      currency: account.currency,
      date,
      payee,
      notes: '',
    });
  }

  // Bulk create transactions
  await prisma.transaction.createMany({
    data: transactions,
  });

  return transactions.length;
}

async function createBudgets(familyId: string, categories: Record<string, any>) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgetData = [
    { category: 'Groceries', amount: 600 },
    { category: 'Dining Out', amount: 200 },
    { category: 'Transport', amount: 150 },
    { category: 'Utilities', amount: 300 },
    { category: 'Shopping', amount: 250 },
    { category: 'Entertainment', amount: 100 },
    { category: 'Healthcare', amount: 100 },
    { category: 'Subscriptions', amount: 80 },
  ];

  for (const b of budgetData) {
    await prisma.budget.create({
      data: {
        familyId,
        categoryId: categories[b.category].id,
        periodType: BudgetPeriodType.MONTHLY,
        amount: new Decimal(b.amount),
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
    });
  }

  return budgetData.length;
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
