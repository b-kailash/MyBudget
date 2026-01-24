# MyBudget Demo Data

This directory contains demo data and seed scripts for testing and demonstration purposes.

## Demo Data Overview

The seed script creates a complete demo environment with:

### Family
- **Name:** The Smith Family

### Members (4 total)
| Name | Email | Role | Password |
|------|-------|------|----------|
| John Smith | john@demo.mybudget.app | Family Admin | Demo123! |
| Jane Smith | jane@demo.mybudget.app | Member | Demo123! |
| Tom Smith | tom@demo.mybudget.app | Member | Demo123! |
| Emma Smith | emma@demo.mybudget.app | Viewer | Demo123! |

### Bank Accounts (3 total)
| Account Name | Type | Opening Balance | Currency |
|--------------|------|-----------------|----------|
| AIB Current Account | Bank | €2,500.00 | EUR |
| Bank of Ireland Savings | Savings | €15,000.00 | EUR |
| Revolut Card | Card | €500.00 | EUR |

### Transactions
- **Total:** 300+ transactions across all accounts
- **Date Range:** Last 12 months
- **Distribution:**
  - AIB Current: ~110 transactions (balanced income/expenses)
  - BOI Savings: ~105 transactions (mostly deposits)
  - Revolut Card: ~105 transactions (mostly expenses)

### Categories
**Expense Categories:**
- Groceries, Dining Out, Transport, Utilities
- Shopping, Entertainment, Healthcare, Subscriptions
- Education, Gifts, Personal Care, Home
- Insurance, Miscellaneous

**Income Categories:**
- Salary, Freelance, Investments, Other Income

**Transfer Category:**
- Transfer (for inter-account transfers)

### Budgets
Monthly budgets for current month:
- Groceries: €600
- Dining Out: €200
- Transport: €150
- Utilities: €300
- Shopping: €250
- Entertainment: €100
- Healthcare: €100
- Subscriptions: €80

## Running the Seed Script

### Prerequisites
1. PostgreSQL database running
2. Backend dependencies installed
3. Prisma client generated

### Option 1: From project root
```bash
# Ensure database is running
docker-compose -f docker-compose.dev.yml up -d

# Run migrations (if not already done)
npm run migrate --workspace=apps/backend

# Run demo seed
npm run seed:demo
```

### Option 2: From backend directory
```bash
cd apps/backend
npx ts-node ../../demo/seed.ts
```

### Option 3: Direct execution
```bash
# From project root
npx ts-node --esm demo/seed.ts
```

## Resetting Demo Data

The seed script automatically cleans existing demo data before creating new data. Simply run the seed script again to reset.

To manually clean demo data without re-seeding:
```bash
# Connect to database and run:
DELETE FROM transactions WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM budgets WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM accounts WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM categories WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM users WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM families WHERE name = 'The Smith Family';
```

## Transaction Payees

The demo data uses realistic Irish business names:

**Groceries:** Tesco, Lidl, Aldi, SuperValu, Dunnes Stores, Centra, Spar

**Dining:** McDonalds, Subway, Nandos, Starbucks, Costa Coffee, The Local Pub

**Transport:** Dublin Bus, Luas, Irish Rail, Circle K, Uber, Bolt

**Utilities:** Electric Ireland, Bord Gais, Eir, Virgin Media, Three Mobile

**Shopping:** Penneys, H&M, Zara, TK Maxx, Currys, Harvey Norman

**Entertainment:** Netflix, Spotify, Disney+, Amazon Prime, Odeon Cinema

## Notes

- All demo passwords meet the application's password policy (8+ chars, uppercase, lowercase, number)
- Transactions are distributed realistically across the 12-month period
- Monthly salaries appear on the 28th of each month
- The seed script is idempotent - running it multiple times will reset the demo data
