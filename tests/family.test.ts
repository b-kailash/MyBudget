import axios from 'axios';
import {
  API_URL,
  AUTH_URL,
  log,
  generateUniqueId,
  extractErrorDetails,
  delay,
  RATE_LIMIT_DELAY_MS,
} from './utils/testUtils';

const TEST_FILE = 'family.test.ts';
const FAMILY_URL = `${API_URL}/family`;

const uniqueId = generateUniqueId();

// The user who will be the Family Admin
const adminUser = {
  email: `family_admin_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Family Admin',
  familyName: 'The Admin Family',
};

// The user who will be invited to the family
const invitedUserEmail = `invited_user_${uniqueId}@example.com`;

let adminAccessToken: string;
let invitationId: string;

// --- Test Suite ---

describe('Family Management API', () => {
  // 1. Register the admin user and get their token before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering and authenticating the Family Admin ---', TEST_FILE);
    try {
      // Register the admin user
      await axios.post(`${AUTH_URL}/register`, adminUser);

      // Login as the admin to get the access token
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: adminUser.email,
        password: adminUser.password,
      });
      adminAccessToken = response.data.data.accessToken;
      log('info', 'Family Admin authenticated successfully.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'PRE-TEST FAILED: Could not set up admin user.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 2. Test inviting a new member to the family
  test('POST /family/invite - should allow an admin to invite a new member', async () => {
    const invitationPayload = {
      email: invitedUserEmail,
      role: 'MEMBER',
    };
    log('info', '--- Starting Test: POST /family/invite ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${FAMILY_URL}/invite`,
        invitation: invitationPayload,
      },
    });
    try {
      const response = await axios.post(`${FAMILY_URL}/invite`, invitationPayload, {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.email).toBe(invitedUserEmail);
      expect(response.data.data.id).toBeDefined();
      invitationId = response.data.data.id; // Save for later tests
      log('info', 'Pass: Successfully created invitation.', TEST_FILE);
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to invite user.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 3. Test listing family members
  test('GET /family/members - should list family members', async () => {
    log('info', '--- Starting Test: GET /family/members ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${FAMILY_URL}/members`,
      },
    });
    try {
      const response = await axios.get(`${FAMILY_URL}/members`, {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      log('info', 'Pass: Family members listed successfully.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to list family members.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // 4. Test listing pending invitations
  test('GET /family/invitations - should list pending invitations', async () => {
    log('info', '--- Starting Test: GET /family/invitations ---', TEST_FILE, {
      inputParameters: {
        endpoint: `${FAMILY_URL}/invitations`,
      },
    });
    try {
      const response = await axios.get(`${FAMILY_URL}/invitations`, {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      log('info', 'Pass: Invitations listed successfully.', TEST_FILE, {
        data: { count: response.data.data.length },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Failed to list invitations.', TEST_FILE, {
        data: {
          errorMessage: details.message,
          statusCode: details.statusCode,
        },
      });
      throw error;
    }
  });

  // Rate limit delay after test suite
  afterAll(async () => {
    log('info', 'Test suite complete. Waiting 90 seconds for rate limit cooldown...', TEST_FILE);
    await delay(RATE_LIMIT_DELAY_MS);
    log('info', 'Rate limit cooldown complete.', TEST_FILE);
  });
});
