import { prisma as prismaInstance1 } from '../../../apps/backend/src/lib/prisma';
import { prisma as prismaInstance2 } from '../../../apps/backend/src/lib/prisma';
import { PrismaClient } from '@prisma/client';

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

describe('Prisma Client Singleton', () => {

  beforeAll(() => {
    log('info', '--- Testing Prisma Client Singleton Instance ---', 'prisma.test.ts');
  });

  afterEach(async () => {
    log('info', 'Pausing for 1 minute to respect rate limiting (if applicable).', 'prisma.test.ts');
    await delay(60000);
  });

  it('should always return the same instance of PrismaClient', () => {
    log('info', 'Test: should always return the same instance of PrismaClient', 'prisma.test.ts');
    expect(prismaInstance1).toBe(prismaInstance2);
    log('info', 'Pass: Both imported instances are the same object.', 'prisma.test.ts');
  });

  it('should be an instance of PrismaClient', () => {
    log('info', 'Test: should be an instance of PrismaClient', 'prisma.test.ts');
    expect(prismaInstance1).toBeInstanceOf(PrismaClient);
    log('info', 'Pass: The instance is of type PrismaClient.', 'prisma.test.ts');
  });

  it('should have a functioning database connection method (e.g., $connect)', async () => {
    log('info', 'Test: should have a functioning database connection method', 'prisma.test.ts');
    try {
      await prismaInstance1.$connect();
      log('info', 'Pass: Successfully connected to the database.', 'prisma.test.ts');
      await prismaInstance1.$disconnect();
      log('info', 'Pass: Successfully disconnected from the database.', 'prisma.test.ts');
    } catch (error: any) {
        log('error', 'Fail: Failed to connect or disconnect from the database.', 'prisma.test.ts', {
            data: {
                errorMessage: error.message,
            }
          });
      throw error;
    }
  });
});