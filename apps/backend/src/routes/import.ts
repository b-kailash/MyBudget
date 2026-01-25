import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ApiResponse, ImportStatus, ImportFileType, parseCSV, suggestColumnMapping, applyColumnMapping, TransactionType } from '@mybudget/shared';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Configure multer for memory storage with file size limit (5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV, Excel, and financial exchange formats
    const allowedMimes = [
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.ofx', '.qfx', '.qif'];

    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: CSV, XLSX, XLS, OFX, QFX, QIF'));
    }
  },
});

/**
 * Detect file type from extension
 */
function detectFileType(filename: string): ImportFileType {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  switch (ext) {
    case '.csv':
      return ImportFileType.CSV;
    case '.xlsx':
      return ImportFileType.XLSX;
    case '.xls':
      return ImportFileType.XLS;
    case '.ofx':
      return ImportFileType.OFX;
    case '.qfx':
      return ImportFileType.QFX;
    case '.qif':
      return ImportFileType.QIF;
    default:
      return ImportFileType.CSV;
  }
}

/**
 * POST /api/v1/import/upload
 * Upload file and get parsed preview with auto-detected columns
 */
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;

      if (!req.file) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded',
          },
        };
        res.status(400).json(response);
        return;
      }

      const fileType = detectFileType(req.file.originalname);

      // Currently only CSV is supported
      if (fileType !== ImportFileType.CSV) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Currently only CSV files are supported. XLSX, OFX support coming soon.',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Parse CSV content
      const content = req.file.buffer.toString('utf-8');
      const parseResult = parseCSV(content, { maxRows: 1000 });

      if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: `Failed to parse file: ${parseResult.errors[0].message}`,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Auto-suggest column mapping
      const suggestedMapping = suggestColumnMapping(parseResult.headers);

      // Create import batch record
      const importBatch = await prisma.importBatch.create({
        data: {
          familyId,
          userId,
          filename: req.file.originalname,
          fileType,
          status: ImportStatus.PENDING,
          totalRows: parseResult.totalRows,
          columnMapping: suggestedMapping,
        },
      });

      // Store parsed data temporarily (in a real app, might use Redis or temp file)
      // For now, we'll re-parse on preview/commit

      const response: ApiResponse<{
        importId: string;
        filename: string;
        fileType: string;
        headers: string[];
        delimiter: string;
        totalRows: number;
        preview: typeof parseResult.preview;
        suggestedMapping: typeof suggestedMapping;
        errors: typeof parseResult.errors;
      }> = {
        data: {
          importId: importBatch.id,
          filename: req.file.originalname,
          fileType,
          headers: parseResult.headers,
          delimiter: parseResult.delimiter,
          totalRows: parseResult.totalRows,
          preview: parseResult.preview,
          suggestedMapping,
          errors: parseResult.errors,
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Import upload error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process uploaded file',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/import/preview
 * Preview transactions with applied column mapping
 */
router.post(
  '/preview',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { importId, mapping, dateFormat, negativeIsExpense = true } = req.body;

      if (!req.file && !importId) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either file or importId is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      if (!mapping || !mapping.date || !mapping.amount || !mapping.payee) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Column mapping must include date, amount, and payee fields',
          },
        };
        res.status(400).json(response);
        return;
      }

      let content: string;

      if (req.file) {
        content = req.file.buffer.toString('utf-8');
      } else {
        // Get import batch and re-parse (in production, would retrieve cached data)
        const importBatch = await prisma.importBatch.findUnique({
          where: { id: importId, familyId },
        });

        if (!importBatch) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Import batch not found',
            },
          };
          res.status(404).json(response);
          return;
        }

        // For demo purposes, return error since we don't store file content
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please re-upload the file for preview',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Parse and apply mapping
      const parseResult = parseCSV(content);
      const mappedRows = applyColumnMapping(parseResult, {
        ...mapping,
        dateFormat,
        negativeIsExpense,
      });

      // Get existing transactions for duplicate detection
      const existingTransactions = await prisma.transaction.findMany({
        where: {
          familyId,
          isDeleted: false,
        },
        select: {
          date: true,
          amount: true,
          payee: true,
        },
      });

      // Check for potential duplicates
      const duplicateSet = new Set(
        existingTransactions.map(
          (t) => `${t.date.toISOString().split('T')[0]}|${t.amount.toString()}|${t.payee.toLowerCase()}`
        )
      );

      // Validate and mark duplicates
      const preview = mappedRows.map((row) => {
        const errors: string[] = [];
        let isDuplicate = false;

        // Validate date
        const parsedDate = parseDate(row.date, dateFormat);
        if (!parsedDate) {
          errors.push(`Invalid date: ${row.date}`);
        }

        // Validate amount
        const parsedAmount = parseFloat(row.amount.replace(/[^0-9.-]/g, ''));
        if (isNaN(parsedAmount)) {
          errors.push(`Invalid amount: ${row.amount}`);
        }

        // Check for duplicates
        if (parsedDate && !isNaN(parsedAmount)) {
          const key = `${parsedDate.toISOString().split('T')[0]}|${Math.abs(parsedAmount).toFixed(2)}|${row.payee.toLowerCase()}`;
          isDuplicate = duplicateSet.has(key);
        }

        // Determine transaction type
        const type = determineTransactionType(parsedAmount, negativeIsExpense);

        return {
          index: row.index,
          date: row.date,
          parsedDate: parsedDate?.toISOString() || null,
          amount: row.amount,
          parsedAmount: isNaN(parsedAmount) ? null : Math.abs(parsedAmount),
          payee: row.payee,
          notes: row.notes,
          category: row.category,
          type,
          isDuplicate,
          errors,
          isValid: errors.length === 0,
        };
      });

      const validCount = preview.filter((p) => p.isValid && !p.isDuplicate).length;
      const duplicateCount = preview.filter((p) => p.isDuplicate).length;
      const errorCount = preview.filter((p) => !p.isValid).length;

      const response: ApiResponse<{
        preview: typeof preview;
        summary: {
          total: number;
          valid: number;
          duplicates: number;
          errors: number;
        };
      }> = {
        data: {
          preview: preview.slice(0, 100), // Limit preview to 100 rows
          summary: {
            total: preview.length,
            valid: validCount,
            duplicates: duplicateCount,
            errors: errorCount,
          },
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Import preview error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to preview import',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/import/commit
 * Commit import and create transactions
 */
router.post(
  '/commit',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;
      const {
        accountId,
        mapping,
        dateFormat,
        negativeIsExpense = true,
        skipDuplicates = true,
        defaultCategoryId,
      } = req.body;

      if (!req.file) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File is required for commit',
          },
        };
        res.status(400).json(response);
        return;
      }

      if (!accountId) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Account ID is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      if (!mapping || !mapping.date || !mapping.amount || !mapping.payee) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Column mapping must include date, amount, and payee fields',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Verify account belongs to family
      const account = await prisma.account.findFirst({
        where: { id: accountId, familyId, isDeleted: false },
      });

      if (!account) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Account not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Get or create default category
      let categoryId = defaultCategoryId;
      if (!categoryId) {
        // Find or create "Imported" category
        let importCategory = await prisma.category.findFirst({
          where: { familyId, name: 'Imported', isDeleted: false },
        });

        if (!importCategory) {
          importCategory = await prisma.category.create({
            data: {
              familyId,
              name: 'Imported',
              type: 'EXPENSE',
              color: '#9E9E9E',
              icon: 'download',
            },
          });
        }
        categoryId = importCategory.id;
      }

      // Parse file
      const content = req.file.buffer.toString('utf-8');
      const parseResult = parseCSV(content);
      const mappedRows = applyColumnMapping(parseResult, {
        ...mapping,
        dateFormat,
        negativeIsExpense,
      });

      // Get existing transactions for duplicate detection
      const existingTransactions = await prisma.transaction.findMany({
        where: { familyId, isDeleted: false },
        select: { date: true, amount: true, payee: true },
      });

      const duplicateSet = new Set(
        existingTransactions.map(
          (t) => `${t.date.toISOString().split('T')[0]}|${t.amount.toString()}|${t.payee.toLowerCase()}`
        )
      );

      // Create import batch
      const importBatch = await prisma.importBatch.create({
        data: {
          familyId,
          userId,
          filename: req.file.originalname,
          fileType: ImportFileType.CSV,
          status: ImportStatus.PROCESSING,
          totalRows: mappedRows.length,
          columnMapping: mapping,
        },
      });

      // Process rows and create transactions
      const transactionsToCreate: any[] = [];
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errorLog: string[] = [];

      for (const row of mappedRows) {
        const parsedDate = parseDate(row.date, dateFormat);
        const parsedAmount = parseFloat(row.amount.replace(/[^0-9.-]/g, ''));

        // Skip invalid rows
        if (!parsedDate || isNaN(parsedAmount)) {
          errorCount++;
          errorLog.push(`Row ${row.index + 1}: Invalid date or amount`);
          continue;
        }

        // Check for duplicates
        const key = `${parsedDate.toISOString().split('T')[0]}|${Math.abs(parsedAmount).toFixed(2)}|${row.payee.toLowerCase()}`;
        if (skipDuplicates && duplicateSet.has(key)) {
          skippedCount++;
          continue;
        }

        const type = determineTransactionType(parsedAmount, negativeIsExpense);

        transactionsToCreate.push({
          familyId,
          accountId,
          categoryId,
          userId,
          type,
          amount: new Decimal(Math.abs(parsedAmount).toFixed(2)),
          currency: account.currency,
          date: parsedDate,
          payee: row.payee || 'Unknown',
          notes: row.notes || '',
        });

        importedCount++;
      }

      // Bulk create transactions
      if (transactionsToCreate.length > 0) {
        await prisma.transaction.createMany({
          data: transactionsToCreate,
        });
      }

      // Update import batch status
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: ImportStatus.COMPLETED,
          importedCount,
          skippedCount,
          errorCount,
          errorLog: errorLog.join('\n') || null,
          completedAt: new Date(),
        },
      });

      const response: ApiResponse<{
        importId: string;
        imported: number;
        skipped: number;
        errors: number;
        total: number;
      }> = {
        data: {
          importId: importBatch.id,
          imported: importedCount,
          skipped: skippedCount,
          errors: errorCount,
          total: mappedRows.length,
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Import commit error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to commit import',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/import/history
 * Get import history for family
 */
router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;

      const imports = await prisma.importBatch.findMany({
        where: { familyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const response: ApiResponse<typeof imports> = {
        data: imports,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Import history error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve import history',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/import/:id
 * Get import batch details
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { id } = req.params;

      const importBatch = await prisma.importBatch.findUnique({
        where: { id, familyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!importBatch) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Import batch not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof importBatch> = {
        data: importBatch,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Import details error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve import details',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * Helper: Parse date string with various formats
 */
function parseDate(dateStr: string, format?: string): Date | null {
  if (!dateStr) return null;

  // If format is specified, use it
  if (format) {
    const cleaned = dateStr.trim();
    const parts = cleaned.split(/[-/]/);

    if (parts.length === 3) {
      let year: number, month: number, day: number;

      if (format.toLowerCase().startsWith('dd')) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else if (format.toLowerCase().startsWith('mm')) {
        month = parseInt(parts[0], 10) - 1;
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }

      // Handle 2-digit years
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try native parsing as fallback
  const nativeDate = new Date(dateStr);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  return null;
}

/**
 * Helper: Determine transaction type from amount
 */
function determineTransactionType(amount: number, negativeIsExpense: boolean): TransactionType {
  if (negativeIsExpense) {
    return amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  } else {
    return amount > 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  }
}

export default router;
