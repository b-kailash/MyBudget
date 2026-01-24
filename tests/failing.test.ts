import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const API_URL = `${process.env.BASE_URL}/api/v1`;

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('Non-Existent Endpoint Test', () => {
  // This test is designed to fail to demonstrate the testing workflow for non-happy paths.
  test('GET /non-existent-endpoint - should return a 404 Not Found error', async () => {
    const endpoint = `${API_URL}/this-endpoint-does-not-exist`;
    log('info', '--- Starting Test: GET /non-existent-endpoint ---', {
      endpoint,
    });
    try {
      await axios.get(endpoint);
      log('error', 'Fail: The request to a non-existent endpoint succeeded unexpectedly.');
      throw new Error('The request to a non-existent endpoint succeeded unexpectedly.');
    } catch (error: any) {
      if (error.response) {
        expect(error.response.status).toBe(404);
        log('info', 'Pass: Successfully received a 404 Not Found error as expected.');
      } else {
        log('error', 'Fail: Request to non-existent endpoint failed without a response.', {
            errorMessage: error.message,
          });
        throw error;
      }
    }
  });

  // This test is designed to fail for a different reason: an incorrect expectation.
  test('GET /health - should fail due to an incorrect expectation', async () => {
    const healthEndpoint = `${API_URL}/health`;
    log('info', '--- Starting Test: GET /health with an incorrect expectation ---', {
      endpoint: healthEndpoint,
    });
    try {
      const response = await axios.get(healthEndpoint);
      expect(response.data.status).toBe('perfect');
      log('error', 'Fail: The test passed with an incorrect expectation.');
    } catch (error: any) {
        log('info', 'Pass: Test failed as expected due to incorrect assertion.', {
            errorMessage: error.message,
          });
      // Re-throw the error to ensure Jest marks the test as failed.
      throw error;
    }
  });
});
