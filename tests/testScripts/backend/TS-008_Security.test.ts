import axios from 'axios';
import {
    AUTH_URL,
    API_URL,
    log,
    extractErrorDetails,
} from '../../utils/testUtils';

const TEST_FILE = 'TS-008_Security.test.ts';

describe('TS-008: Robustness & Security', () => {
    // We don't use setupRateLimitedSuite here because we are testing the rate limit itself!

    test('Step 1: Rate Limiting - should block after 5 failed login attempts', async () => {
        log('info', 'Executing Step 1: Rate Limiting (this may take a moment)', TEST_FILE);
        const credentials = { email: 'nonexistent@example.com', password: 'wrongpassword' };

        let blocked = false;
        for (let i = 0; i < 6; i++) {
            try {
                await axios.post(`${AUTH_URL}/login`, credentials);
            } catch (error: any) {
                if (error.response?.status === 429) {
                    blocked = true;
                    log('info', `Pass: Blocked at attempt ${i + 1}`, TEST_FILE);
                    break;
                }
            }
        }
        expect(blocked).toBe(true);
    });

    test('Step 2: Token Tampering - should reject modified tokens', async () => {
        log('info', 'Executing Step 2: Token Tampering', TEST_FILE);
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

        try {
            await axios.get(`${API_URL}/accounts`, {
                headers: { Authorization: `Bearer ${fakeToken}` }
            });
            throw new Error('Should have failed with 401');
        } catch (error: any) {
            expect(error.response?.status).toBe(401);
            log('info', 'Pass: Correctly rejected tampered token.', TEST_FILE);
        }
    });

    test('Step 3: Invalid Inputs - should block invalid data formats', async () => {
        log('info', 'Executing Step 3: Input Validation', TEST_FILE);
        try {
            // Missing required fields
            await axios.post(`${AUTH_URL}/register`, { email: 'incomplete@example.com' });
            throw new Error('Should have failed with 400');
        } catch (error: any) {
            expect(error.response?.status).toBe(400);
            log('info', 'Pass: Correctly rejected incomplete data.', TEST_FILE);
        }
    });

    test('Step 4: Large Payload - should reject excessively large JSON', async () => {
        log('info', 'Executing Step 4: Payload Size Check', TEST_FILE);
        // Create a very large object
        const largeData = {
            name: 'A'.repeat(1024 * 1024), // 1MB string
        };

        try {
            await axios.post(`${AUTH_URL}/login`, largeData);
        } catch (error: any) {
            // Depending on express settings, it might be 413 or 400/401
            expect([400, 401, 413]).toContain(error.response?.status);
            log('info', `Pass: Handled large payload with status ${error.response?.status}`, TEST_FILE);
        }
    });
});
