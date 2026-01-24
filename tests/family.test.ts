import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;
const AUTH_URL = `${API_URL}/auth`;
const FAMILY_URL = `${API_URL}/family`;

const uniqueId = new Date().getTime();

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
let familyMemberId: string;

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

// --- Test Suite ---

describe('Family Management API', () => {
  // 1. Register the admin user and get their token before starting the tests
  beforeAll(async () => {
    log('info', '--- PRE-TEST: Registering and authenticating the Family Admin ---');
    try {
      // Register the admin user
      await axios.post(`${AUTH_URL}/register`, adminUser);

      // Login as the admin to get the access token
      const response = await axios.post(`${AUTH_URL}/login`, {
        email: adminUser.email,
        password: adminUser.password,
      });
      adminAccessToken = response.data.data.accessToken;
      log('info', 'Family Admin authenticated successfully.');
    } catch (error: any) {
        log('error', 'PRE-TEST FAILED: Could not set up admin user.', {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
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
    log('info', '--- Starting Test: POST /family/invite ---', {
        endpoint: `${FAMILY_URL}/invite`,
        input: invitationPayload,
      });
    try {
      const response = await axios.post(`${FAMILY_URL}/invite`, invitationPayload, {
        headers: { Authorization: `Bearer ${adminAccessToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data.email).toBe(invitedUserEmail);
      expect(response.data.data.id).toBeDefined();
      invitationId = response.data.data.id; // Save for later tests
      log('info', 'Pass: Successfully created invitation.');
    } catch (error: any) {
        log('error', 'Fail: Failed to invite user.', {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
          });
      throw error;
    }
  });
});
