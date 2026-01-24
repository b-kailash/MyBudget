import axios from 'axios';
import {
  BASE_URL,
  log,
  extractErrorDetails,
  delay,
  RATE_LIMIT_DELAY_MS,
} from './utils/testUtils';

const TEST_FILE = 'health.test.ts';
const HEALTH_URL = `${BASE_URL}/health`;

describe('Health Check API', () => {
  test('GET /health - should return a 200 OK status with server status', async () => {
    log('info', '--- Starting Test: GET /health - should return a 200 OK status with server status ---', TEST_FILE, {
      inputParameters: {
        endpoint: HEALTH_URL,
      },
    });
    try {
      const response = await axios.get(HEALTH_URL);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('ok');
      expect(response.data.timestamp).toBeDefined();

      log('info', 'Pass: Health check successful.', TEST_FILE, {
        data: {
          statusCode: response.status,
          responseBody: response.data,
        },
      });
    } catch (error: unknown) {
      const details = extractErrorDetails(error);
      log('error', 'Fail: Health check failed.', TEST_FILE, {
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
