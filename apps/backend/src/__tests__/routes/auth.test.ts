import axios from 'axios';
import { execSync } from 'child_process';

const BASE_URL = 'http://192.168.1.235:3000/api/v1/auth';

const uniqueId = new Date().getTime();
const testUser = {
  email: `testuser_${uniqueId}@example.com`,
  password: 'Password123!',
  name: 'Test User',
  familyName: 'Test Family',
};

let accessToken: string;
let refreshToken: string;

// Function to log test results
const log = (message: string) => {
  console.log(`[AUTH TEST] ${new Date().toISOString()}: ${message}`);
};

// Reset the database before running tests
beforeAll(() => {
  try {
    log('Resetting database...');
    execSync('npm run db:reset');
    log('Database reset complete.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
});

describe('Auth API', () => {
  // Test user registration
  test('POST /register - should register a new user', async () => {
    log('--- Testing POST /register ---');
    try {
      const response = await axios.post(`${BASE_URL}/register`, testUser);

      expect(response.status).toBe(201);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('User registration successful.');
    } catch (error: any) {
      log(`Registration test failed: ${error.message}`);
      throw error;
    }
  });

  // Test registration with existing email
  test('POST /register - should not register a user with an existing email', async () => {
    log('--- Testing POST /register with existing email ---');
    try {
      await axios.post(`${BASE_URL}/register`, testUser);
    } catch (error: any) {
      expect(error.response.status).toBe(409);
      expect(error.response.data.error.code).toBe('USER_EXISTS');
      log('Correctly blocked registration with existing email.');
    }
  });

  // Test user login
  test('POST /login - should login the user and return tokens', async () => {
    log('--- Testing POST /login ---');
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();

      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      log('User login successful.');
    } catch (error: any) {
      log(`Login test failed: ${error.message}`);
      throw error;
    }
  });

  // Test login with invalid credentials
  test('POST /login - should not login with invalid password', async () => {
    log('--- Testing POST /login with invalid password ---');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: testUser.email,
        password: 'invalidpassword',
      });
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.error.code).toBe('INVALID_CREDENTIALS');
      log('Correctly blocked login with invalid password.');
    }
  });

  // Test account lockout
  test('POST /login - should lock account after multiple failed attempts', async () => {
    log('--- Testing account lockout ---');
    const loginPromise = async () => {
        try {
            await axios.post(`${BASE_URL}/login`, {
              email: testUser.email,
              password: 'wrongpassword',
            });
          } catch (error: any) {
            // We expect errors here
            return error.response;
          }
    }

    for (let i = 0; i < 5; i++) {
        await loginPromise();
    }

    const response: any = await loginPromise();
    expect(response.status).toBe(429);
    expect(response.data.error.code).toBe('ACCOUNT_LOCKED');
    log('Account lockout successful.');
  });


  // Test getting user profile
  test('GET /me - should return the user profile', async () => {
    log('--- Testing GET /me ---');
    try {
      const response = await axios.get(`${BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.email).toBe(testUser.email);
      log('Get user profile successful.');
    } catch (error: any) {
      log(`Get user profile test failed: ${error.message}`);
      throw error;
    }
  });

  // Test getting user profile without token
  test('GET /me - should not return the user profile without a token', async () => {
    log('--- Testing GET /me without token ---');
    try {
      await axios.get(`${BASE_URL}/me`);
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      log('Correctly blocked access to /me without token.');
    }
  });

  // Test refreshing token
  test('POST /refresh - should refresh the access token', async () => {
    log('--- Testing POST /refresh ---');
    try {
      const response = await axios.post(`${BASE_URL}/refresh`, {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();
      log('Token refresh successful.');
    } catch (error: any) {
      log(`Token refresh test failed: ${error.message}`);
      throw error;
    }
  });

  // Test logout
  test('POST /logout - should logout the user', async () => {
    log('--- Testing POST /logout ---');
    try {
      const response = await axios.post(
        `${BASE_URL}/logout`,
        { refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      log('User logout successful.');
    } catch (error: any) {
      log(`Logout test failed: ${error.message}`);
      throw error;
    }
  });

  // Test that the logged out refresh token is no longer valid
  test('POST /refresh - should not refresh with a logged out token', async () => {
    log('--- Testing POST /refresh with logged out token ---');
    try {
      await axios.post(`${BASE_URL}/refresh`, { refreshToken });
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.error.code).toBe('TOKEN_REVOKED');
      log('Correctly blocked token refresh with logged out token.');
    }
  });
});