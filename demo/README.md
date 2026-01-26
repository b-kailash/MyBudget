# MyBudget Demo Data

Sample data for testing and demonstration purposes.

## Quick Start

```bash
# From project root (database must be running)
npm run seed:demo
```

## Demo Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| John Smith | john@demo.mybudget.app | Demo123! | Family Admin |
| Jane Smith | jane@demo.mybudget.app | Demo123! | Member |
| Tom Smith | tom@demo.mybudget.app | Demo123! | Member |
| Emma Smith | emma@demo.mybudget.app | Demo123! | Viewer |

**Family:** The Smith Family

## What's Included

### Bank Accounts

| Account | Type | Opening Balance | Currency |
|---------|------|-----------------|----------|
| AIB Current Account | Bank | 2,500.00 | EUR |
| Bank of Ireland Savings | Savings | 15,000.00 | EUR |
| Revolut Card | Card | 500.00 | EUR |

### Transactions

- **Total:** 300+ transactions
- **Period:** Last 12 months
- **Distribution:**
  - AIB Current: ~110 transactions (mixed income/expenses)
  - BOI Savings: ~105 transactions (deposits/transfers)
  - Revolut Card: ~105 transactions (daily expenses)

### Categories

**Expenses:**
Groceries, Dining Out, Transport, Utilities, Shopping, Entertainment, Healthcare, Subscriptions, Education, Gifts, Personal Care, Home, Insurance, Miscellaneous

**Income:**
Salary, Freelance, Investments, Other Income

**Transfer:**
Transfer (inter-account)

### Budgets

Monthly budgets for current month:

| Category | Budget |
|----------|--------|
| Groceries | 600 |
| Dining Out | 200 |
| Transport | 150 |
| Utilities | 300 |
| Shopping | 250 |
| Entertainment | 100 |
| Healthcare | 100 |
| Subscriptions | 80 |

## Running the Seed Script

### Prerequisites

1. PostgreSQL running (`docker compose -f docker-compose.dev.yml up -d`)
2. Migrations applied (`cd apps/backend && npx prisma migrate dev`)

### Methods

**From project root (recommended):**
```bash
npm run seed:demo
```

**From backend directory:**
```bash
cd apps/backend
npx ts-node ../../demo/seed.ts
```

**Direct execution:**
```bash
npx ts-node --esm demo/seed.ts
```

## Resetting Demo Data

The seed script is idempotent - running it again will:
1. Delete existing demo data (The Smith Family)
2. Create fresh demo data

**To manually delete without re-seeding:**
```sql
-- Connect to database
DELETE FROM transactions WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM budgets WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM accounts WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM categories WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM users WHERE family_id IN (SELECT id FROM families WHERE name = 'The Smith Family');
DELETE FROM families WHERE name = 'The Smith Family';
```

## Transaction Payees

Realistic Irish business names are used:

| Category | Examples |
|----------|----------|
| Groceries | Tesco, Lidl, Aldi, SuperValu, Dunnes, Centra, Spar |
| Dining | McDonalds, Subway, Nandos, Starbucks, Costa |
| Transport | Dublin Bus, Luas, Irish Rail, Circle K, Uber |
| Utilities | Electric Ireland, Bord Gais, Eir, Virgin Media |
| Shopping | Penneys, H&M, Zara, TK Maxx, Currys |
| Entertainment | Netflix, Spotify, Disney+, Amazon Prime |

## Notes

- All passwords meet policy: 8+ chars, uppercase, lowercase, number
- Salaries appear on the 28th of each month
- Transactions are realistically distributed over 12 months
