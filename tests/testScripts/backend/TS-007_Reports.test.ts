import {
    createTestUser,
    authenticateUser,
    createAuthenticatedClient,
    log,
    extractErrorDetails,
    setupRateLimitedSuite,
} from '../../utils/testUtils';

const TEST_FILE = 'TS-007_Reports.test.ts';
const testUser = createTestUser('report_test');

let client: any;
let accountId: string;
let categoryId: string;

describe('TS-007: Reports & Analytics', () => {
    setupRateLimitedSuite(TEST_FILE);

    beforeAll(async () => {
        const authResult = await authenticateUser(testUser, TEST_FILE);
        client = createAuthenticatedClient(authResult.accessToken);

        const accResp = await client.post('/accounts', {
            name: 'Report Test Acc',
            type: 'CASH',
            currency: 'USD',
            openingBalance: 1000,
        });
        accountId = accResp.data.data.id;

        const catResp = await client.post('/categories', {
            name: 'Report Test Cat',
            type: 'EXPENSE',
            color: '#0000FF',
            icon: 'bar_chart',
        });
        categoryId = catResp.data.data.id;

        // Add some data
        await client.post('/transactions', {
            accountId,
            categoryId,
            type: 'EXPENSE',
            amount: 100,
            currency: 'USD',
            date: new Date().toISOString(),
            payee: 'Store A',
        });
    });

    test('Step 1: GET /reports/monthly-summary - should get monthly summary', async () => {
        log('info', 'Executing Step 1: Monthly Summary', TEST_FILE);
        try {
            const response = await client.get('/reports/monthly-summary');
            expect(response.status).toBe(200);
            expect(response.data.data.totalExpenses).toBeGreaterThan(0);
            log('info', `Pass: Monthly expenses: ${response.data.data.totalExpenses}`, TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Monthly summary failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 2: GET /reports/category-breakdown - should get category breakdown', async () => {
        log('info', 'Executing Step 2: Category Breakdown', TEST_FILE);
        try {
            const response = await client.get('/reports/category-breakdown', {
                params: { type: 'expense' },
            });
            expect(response.status).toBe(200);
            expect(response.data.data.breakdown.length).toBeGreaterThan(0);
            log('info', 'Pass: Category breakdown retrieved.', TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Category breakdown failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 3: GET /reports/trend - should get trend data', async () => {
        log('info', 'Executing Step 3: Trend Analysis', TEST_FILE);
        try {
            const response = await client.get('/reports/trend', {
                params: { months: 3 },
            });
            expect(response.status).toBe(200);
            expect(response.data.data.months.length).toBe(3);
            log('info', 'Pass: Trend data retrieved.', TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Trend analysis failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 4: GET /reports/ - should get dashboard summary', async () => {
        log('info', 'Executing Step 4: Dashboard Overview', TEST_FILE);
        try {
            const response = await client.get('/reports/');
            expect(response.status).toBe(200);
            expect(response.data.data.summary).toBeDefined();
            expect(response.data.data.accounts.length).toBeGreaterThan(0);
            log('info', 'Pass: Dashboard data retrieved.', TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Dashboard overview failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 5: GET /reports/monthly-summary - should fail with invalid month', async () => {
        log('info', 'Executing Step 5: Validation Check (Invalid Month)', TEST_FILE);
        try {
            await client.get('/reports/monthly-summary', { params: { month: 13 } });
            throw new Error('Should have failed with 400');
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            if (details.statusCode === 400) {
                log('info', 'Pass: Correctly rejected invalid month.', TEST_FILE);
            } else {
                throw error;
            }
        }
    });
});
