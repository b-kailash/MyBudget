import {
    createTestUser,
    authenticateUser,
    createAuthenticatedClient,
    log,
    extractErrorDetails,
    setupRateLimitedSuite,
    API_URL,
} from '../../utils/testUtils';
import axios from 'axios';

const TEST_FILE = 'TS-006_Import.test.ts';
const testUser = createTestUser('import_test');

let accessToken: string;
let client: any;
let accountId: string;
let importId: string;

describe('TS-006: Data Import', () => {
    setupRateLimitedSuite(TEST_FILE);

    beforeAll(async () => {
        const authResult = await authenticateUser(testUser, TEST_FILE);
        accessToken = authResult.accessToken;
        client = createAuthenticatedClient(accessToken);

        const accResp = await client.post('/accounts', {
            name: 'Import Test Acc',
            type: 'CASH',
            currency: 'USD',
            openingBalance: 0,
        });
        accountId = accResp.data.data.id;
    });

    test('Step 1: POST /import/upload - should upload and parse CSV', async () => {
        log('info', 'Executing Step 1: Upload CSV', TEST_FILE);

        const csvContent = 'Date,Description,Amount\n2024-01-01,Grocery Store,-50.00\n2024-01-02,Salary,3000.00';
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test.csv');

        try {
            const response = await axios.post(`${API_URL}/import/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.data.headers).toContain('Date');
            importId = response.data.data.importId;
            log('info', `Pass: CSV uploaded, Import ID: ${importId}`, TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Upload failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 2: POST /import/preview - should preview mapped data', async () => {
        log('info', 'Executing Step 2: Preview Import', TEST_FILE);

        const csvContent = 'Date,Description,Amount\n2024-01-01,Grocery Store,-50.00\n2024-01-02,Salary,3000.00';
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test.csv');
        formData.append('importId', importId);
        formData.append('mapping', JSON.stringify({ date: 'Date', payee: 'Description', amount: 'Amount' }));
        formData.append('dateFormat', 'YYYY-MM-DD');

        try {
            const response = await axios.post(`${API_URL}/import/preview`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.data.summary.total).toBe(2);
            log('info', 'Pass: Preview generated successfully.', TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Preview failed.', TEST_FILE, { data: details });
            throw error;
        }
    });

    test('Step 3: POST /import/commit - should commit transactions', async () => {
        log('info', 'Executing Step 3: Commit Import', TEST_FILE);

        const csvContent = 'Date,Description,Amount\n2024-01-01,Grocery Store,-50.00\n2024-01-02,Salary,3000.00';
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test.csv');
        formData.append('accountId', accountId);
        formData.append('mapping', JSON.stringify({ date: 'Date', payee: 'Description', amount: 'Amount' }));
        formData.append('dateFormat', 'YYYY-MM-DD');

        try {
            const response = await axios.post(`${API_URL}/import/commit`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.data.imported).toBe(2);
            log('info', 'Pass: Transactions imported.', TEST_FILE);
        } catch (error: unknown) {
            const details = extractErrorDetails(error);
            log('error', 'Fail: Commit failed.', TEST_FILE, { data: details });
            throw error;
        }
    });
});
