import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../apps/backend/src/middleware/auth';
import { corsMiddleware } from '../apps/backend/src/middleware/cors';
import { errorHandler, ApiError, asyncHandler } from '../apps/backend/src/middleware/errorHandler';
import { notFoundHandler } from '../apps/backend/src/middleware/notFound';
import rateLimit, { MemoryStore } from 'express-rate-limit';
import { requestLogger } from '../apps/backend/src/middleware/requestLogger';
import { validate } from '../apps/backend/src/middleware/validate';
import { z } from 'zod';
import { UserRole } from '../packages/shared/src/types';
import { config } from '../apps/backend/src/config';
import morgan from 'morgan';

// --- MOCKS ---

const mockRequest = (headers: any = {}, user: any = null, body: any = null, ip: string = '127.0.0.1', method: string = 'GET', path: string = '/'): Partial<Request> => ({
    headers,
    user,
    body,
    ip,
    method,
    path
});

const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
};

const mockNext = jest.fn();

jest.mock('../apps/backend/src/utils/jwt', () => ({
    ...jest.requireActual('../apps/backend/src/utils/jwt'),
    verifyAccessToken: jest.fn(),
}));
const mockedVerifyAccessToken = jest.requireMock('../apps/backend/src/utils/jwt').verifyAccessToken;

jest.mock('morgan', () => jest.fn(() => (req: any, res: any, next: any) => next()));
const mockedMorgan = morgan as jest.Mock;

// --- LOGGING ---
const log = (level: 'info' | 'error', message: string, data?: any) => {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    console.log(JSON.stringify(logObject, null, 2));
  };

// --- TESTS ---

describe('Middleware Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Middleware', () => {
        const testPayload = { userId: 'user1', familyId: 'fam1', role: 'MEMBER' as UserRole };

        it('should call next() and attach user to request if token is valid', () => {
            log('info', 'Test: authenticate with valid token');
            const token = 'valid.token';
            mockedVerifyAccessToken.mockReturnValue(testPayload);

            const req = mockRequest({ authorization: `Bearer ${token}` });
            const res = mockResponse();

            authenticate(req as Request, res as Response, mockNext as NextFunction);

            expect(mockedVerifyAccessToken).toHaveBeenCalledWith(token);
            expect((req as any).user).toEqual(testPayload);
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            log('info', 'Pass: Authenticate with valid token.');
        });
    });
});
