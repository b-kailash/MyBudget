import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;

const log = (level: 'info' | 'error' | 'warning', message: string, testScriptFile: string, data?: any) => {
    const logObject: any = {
        level,
        timestamp: new Date().toISOString(),
        "Test Script File": testScriptFile,
        message,
    };

    if (data?.inputParameters) {
        logObject["Input Parameters"] = data.inputParameters;
    }
    if (data?.data) {
        logObject["data"] = data.data;
    }

    console.log(JSON.stringify(logObject, null, 2));
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Non-Existent Endpoint Test', () => {
  // This test is designed to fail to demonstrate the testing workflow for non-happy paths.
  test('GET /non-existent-endpoint - should return a 404 Not Found error', async () => {
    const endpoint = `${API_URL}/this-endpoint-does-not-exist`;
    log('info', '--- Starting Test: GET /non-existent-endpoint ---', 'failing.test.ts', {
      inputParameters: {
        endpoint,
      }
    });
    try {
      await axios.get(endpoint);
      log('error', 'Fail: The request to a non-existent endpoint succeeded unexpectedly.', 'failing.test.ts');
      throw new Error('The request to a non-existent endpoint succeeded unexpectedly.');
    } catch (error: any) {
      if (error.response) {
        expect(error.response.status).toBe(404);
        log('info', 'Pass: Successfully received a 404 Not Found error as expected.', 'failing.test.ts');
      } else {
        log('error', 'Fail: Request to non-existent endpoint failed without a response.', 'failing.test.ts', {
            data: {
                errorMessage: error.message,
            }
          });
        throw error;
      }
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'failing.test.ts');
    await delay(60000);
  });

  // This test is designed to fail for a different reason: an incorrect expectation.
  test('GET /health - should fail due to an incorrect expectation', async () => {
    const healthEndpoint = `${API_URL}/health`;
    log('info', '--- Starting Test: GET /health with an incorrect expectation ---', 'failing.test.ts', {
      inputParameters: {
        endpoint: healthEndpoint,
      }
    });
    try {
      const response = await axios.get(healthEndpoint);
      expect(response.data.status).toBe('perfect');
      log('error', 'Fail: The test passed with an incorrect expectation.', 'failing.test.ts');
    } catch (error: any) {
        log('info', 'Pass: Test failed as expected due to incorrect assertion.', 'failing.test.ts', {
            data: {
                errorMessage: error.message,
            }
          });
      // Re-throw the error to ensure Jest marks the test as failed.
      throw error;
    }
  });
});