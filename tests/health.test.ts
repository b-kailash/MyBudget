import axios from 'axios';

if (!process.env.BASE_URL) {
  throw new Error('BASE_URL environment variable is not set. Please create a .env file in the tests directory.');
}

const HEALTH_URL = `${process.env.BASE_URL}/health`;

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

describe('Health Check API', () => {
  test('GET /health - should return a 200 OK status with server status', async () => {
    log('info', '--- Starting Test: GET /health - should return a 200 OK status with server status ---', 'health.test.ts', {
        inputParameters: {
            endpoint: HEALTH_URL,
        }
      });
    try {
      const response = await axios.get(HEALTH_URL);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('ok');
      expect(response.data.timestamp).toBeDefined();

      log('info', 'Pass: Health check successful.', 'health.test.ts', {
        data: {
            statusCode: response.status,
            responseBody: response.data,
        }
      });
    } catch (error: any) {
        log('error', 'Fail: Health check failed.', 'health.test.ts', {
            data: {
                errorMessage: error.response?.data?.error?.message || error.message,
                statusCode: error.response?.status,
            }
          });
      throw error;
    }
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting.', 'health.test.ts');
    await delay(60000);
  });
});