import { prisma as prismaInstance1 } from '../apps/backend/src/lib/prisma';
import { prisma as prismaInstance2 } from '../apps/backend/src/lib/prisma';
import { PrismaClient } from '@prisma/client';

const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

describe('Prisma Client Singleton', () => {

  beforeAll(() => {
    log('info', '--- Testing Prisma Client Singleton Instance ---');
  });

  it('should always return the same instance of PrismaClient', () => {
    log('info', 'Test: should always return the same instance of PrismaClient');
    expect(prismaInstance1).toBe(prismaInstance2);
    log('info', 'Pass: Both imported instances are the same object.');
  });

  it('should be an instance of PrismaClient', () => {
    log('info', 'Test: should be an instance of PrismaClient');
    expect(prismaInstance1).toBeInstanceOf(PrismaClient);
    log('info', 'Pass: The instance is of type PrismaClient.');
  });

  it('should have a functioning database connection method (e.g., $connect)', async () => {
    log('info', 'Test: should have a functioning database connection method');
    try {
      await prismaInstance1.$connect();
      log('info', 'Pass: Successfully connected to the database.');
      await prismaInstance1.$disconnect();
      log('info', 'Pass: Successfully disconnected from the database.');
    } catch (error: any) {
        log('error', 'Fail: Failed to connect or disconnect from the database.', {
            errorMessage: error.message,
          });
      throw error;
    }
  });
});
