import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const HEALTH_URL = `${process.env.BASE_URL}/health`;

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('Health Check API', () => {
  test('GET /health - should return a 200 OK status with server status', async () => {
    log('info', '--- Starting Test: GET /health - should return a 200 OK status with server status ---', {
        endpoint: HEALTH_URL,
      });
    try {
      const response = await axios.get(HEALTH_URL);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('ok');
      expect(response.data.timestamp).toBeDefined();

      log('info', 'Pass: Health check successful.', {
        statusCode: response.status,
        responseBody: response.data,
      });
    } catch (error: any) {
        log('error', 'Fail: Health check failed.', {
            errorMessage: error.response?.data?.error?.message || error.message,
            statusCode: error.response?.status,
          });
      throw error;
    }
  });
});
