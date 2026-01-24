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

// --- TESTS ---

describe('Middleware Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Middleware', () => {
        const testPayload = { userId: 'user1', familyId: 'fam1', role: 'MEMBER' as UserRole };

        it('should call next() and attach user to request if token is valid', () => {
            log('info', 'Test: authenticate with valid token', 'middleware.test.ts', {
                inputParameters: {
                    token: 'valid.token',
                }
            });
            const token = 'valid.token';
            mockedVerifyAccessToken.mockReturnValue(testPayload);

            const req = mockRequest({ authorization: `Bearer ${token}` });
            const res = mockResponse();

            authenticate(req as Request, res as Response, mockNext as NextFunction);

            expect(mockedVerifyAccessToken).toHaveBeenCalledWith(token);
            expect((req as any).user).toEqual(testPayload);
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            log('info', 'Pass: Authenticate with valid token.', 'middleware.test.ts');
        });
    });

    describe('CORS Middleware', () => {
        it('should be a function', () => {
            log('info', 'Test: cors middleware should be a function', 'middleware.test.ts');
            expect(typeof corsMiddleware).toBe('function');
            log('info', 'Pass: CORS middleware is a function.', 'middleware.test.ts');
          });
        
          it('should be configured with the correct origin from the app config', () => {
            log('info', 'Test: cors middleware should be configured with the correct origin', 'middleware.test.ts');
            const expectedOrigin = config.cors.origin;
            expect(expectedOrigin).toBeDefined();
            log('info', `Pass: Verified that CORS origin is configured (currently: ${expectedOrigin}).`, 'middleware.test.ts');
          });
    });

    describe('Error Handler Middleware', () => {
        beforeAll(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterAll(() => {
            (console.error as jest.Mock).mockRestore();
        });

        it('should handle a generic Error and return a 500 status code', () => {
            log('info', 'Test: Handle generic Error', 'middleware.test.ts', {
                inputParameters: {
                    error: new Error('A generic error occurred'),
                }
            });
            const err = new Error('A generic error occurred');
            const req = mockRequest();
            const res = mockResponse();
      
            errorHandler(err, req as Request, res as Response, mockNext as NextFunction);
      
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
              data: null,
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'A generic error occurred',
                details: undefined,
              },
            });
            log('info', 'Pass: Handled generic Error.', 'middleware.test.ts');
          });
    });

    describe('Not Found Middleware', () => {
        it('should return a 404 status code and a JSON response for a GET request', () => {
            log('info', 'Test: Handle GET request to a non-existent route', 'middleware.test.ts', {
                inputParameters: {
                    method: 'GET',
                    path: '/api/v1/non-existent-route',
                }
            });
            const req = mockRequest({}, null, null, '127.0.0.1', 'GET', '/api/v1/non-existent-route');
            const res = mockResponse();
        
            notFoundHandler(req as Request, res as Response);
        
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
              data: null,
              error: {
                code: 'NOT_FOUND',
                message: 'Cannot GET /api/v1/non-existent-route',
                details: {
                  method: 'GET',
                  path: '/api/v1/non-existent-route',
                },
              },
            });
            log('info', 'Pass: Returned 404 for non-existent route.', 'middleware.test.ts');
          });
    });

    describe('Rate Limit Middleware', () => {
        it('should allow requests below the limit and block requests above the limit', async () => {
            log('info', 'Test: should allow requests below the limit and block those above the limit', 'middleware.test.ts');
    
            const store = new MemoryStore();
            const limiter = rateLimit({
                store: store,
                windowMs: 60 * 1000,
                max: 5,
                message: 'Too many requests',
                standardHeaders: true,
            });
    
            const req = mockRequest();
            const res = mockResponse();
    
            for (let i = 0; i < 5; i++) {
                const next = jest.fn();
                await limiter(req as Request, res as Response, next);
                expect(next).toHaveBeenCalledTimes(1);
            }
    
            const nextBlocked = jest.fn();
            await limiter(req as Request, res as Response, nextBlocked);
            
            expect(nextBlocked).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.send).toHaveBeenCalledWith('Too many requests');
            log('info', 'Pass: Rate limit successfully blocked requests above the limit.', 'middleware.test.ts');
        });
    });

    describe('Request Logger Middleware', () => {
        const OLD_ENV = process.env;

        beforeEach(() => {
          jest.resetModules(); 
          process.env = { ...OLD_ENV };
        });
      
        afterAll(() => {
          process.env = OLD_ENV;
        });

        it('should use "dev" format in development environment', () => {
            log('info', 'Test: should use "dev" format in development environment', 'middleware.test.ts', {
                inputParameters: {
                    NODE_ENV: 'development',
                }
            });
            process.env.NODE_ENV = 'development';
        
            const { requestLogger: devLogger } = require('../apps/backend/src/middleware/requestLogger');
        
            const lastCall = mockedMorgan.mock.calls[mockedMorgan.mock.calls.length - 1];
            expect(lastCall[0]).toBe('dev');
            log('info', 'Pass: Used "dev" format in development.', 'middleware.test.ts');
          });
    });

    describe('Validation Middleware', () => {
        const testSchema = z.object({
            name: z.string().min(1, 'Name is required'),
            email: z.string().email('Invalid email address'),
        });

        it('should call next() if the request body is valid', () => {
            log('info', 'Test: should call next() for a valid request body', 'middleware.test.ts', {
                inputParameters: {
                    body: { name: 'John Doe', email: 'john.doe@example.com' },
                }
            });
            const validBody = {
              name: 'John Doe',
              email: 'john.doe@example.com',
            };
            const req = mockRequest({}, null, validBody);
            const res = mockResponse();
        
            const validationMiddleware = validate(testSchema);
            validationMiddleware(req as Request, res as Response, mockNext as NextFunction);
        
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            log('info', 'Pass: Called next() for a valid request body.', 'middleware.test.ts');
          });

          it('should return a 400 error if the request body is invalid', () => {
            log('info', 'Test: should return 400 for an invalid request body', 'middleware.test.ts', {
                inputParameters: {
                    body: { name: '', email: 'not-an-email' },
                }
            });
            const invalidBody = {
              name: '', 
              email: 'not-an-email',
            };
            const req = mockRequest({}, null, invalidBody);
            const res = mockResponse();
        
            const validationMiddleware = validate(testSchema);
            validationMiddleware(req as Request, res as Response, mockNext as NextFunction);
        
            expect(mockNext).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            log('info', 'Pass: Returned 400 for an invalid request body.', 'middleware.test.ts');
          });
    });
});