/**
 * XLSX/XLS Parser for transaction imports
 *
 * Features:
 * - Parses Excel files (.xlsx, .xls)
 * - Returns same structure as CSV parser for consistency
 * - Handles multiple sheets (uses first or specified sheet)
 * - XXE protection enabled by default
 */

import * as XLSX from 'xlsx';
import type { CSVParseResult, CSVParseOptions, ParsedRow } from './csv';

export interface XLSXParseOptions extends CSVParseOptions {
  /** Sheet name or index to parse (default: 0, first sheet) */
  sheet?: string | number;
}

export interface XLSXParseInfo {
  /** List of available sheet names */
  sheetNames: string[];
  /** Parsed data from selected sheet */
  result: CSVParseResult;
}

/**
 * Parse XLSX/XLS content from a Buffer
 *
 * Security: XXE protection is enabled by default in xlsx library v0.18+
 */
export function parseXLSX(buffer: Buffer, options: XLSXParseOptions = {}): XLSXParseInfo {
  const {
    sheet = 0,
    hasHeader = true,
    headers: customHeaders,
    maxRows = 0,
    skipEmpty = true,
  } = options;

  // Parse workbook with security options
  // Note: xlsx library has XXE protection built-in for versions >= 0.18.0
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    // Disable features that could be security risks
    cellFormula: false, // Don't evaluate formulas
    cellHTML: false, // Don't parse HTML
    cellStyles: false, // Don't parse styles
    cellDates: true, // Parse dates properly
  });

  const sheetNames = workbook.SheetNames;

  // Select sheet
  let selectedSheetName: string;
  if (typeof sheet === 'number') {
    if (sheet >= sheetNames.length) {
      return {
        sheetNames,
        result: {
          headers: [],
          delimiter: '',
          totalRows: 0,
          rows: [],
          preview: [],
          errors: [{ row: 0, message: `Sheet index ${sheet} out of range` }],
        },
      };
    }
    selectedSheetName = sheetNames[sheet];
  } else {
    if (!sheetNames.includes(sheet)) {
      return {
        sheetNames,
        result: {
          headers: [],
          delimiter: '',
          totalRows: 0,
          rows: [],
          preview: [],
          errors: [{ row: 0, message: `Sheet "${sheet}" not found` }],
        },
      };
    }
    selectedSheetName = sheet;
  }

  const worksheet = workbook.Sheets[selectedSheetName];

  // Convert to array of arrays
  const data: (string | number | boolean | Date | null)[][] = XLSX.utils.sheet_to_json(
    worksheet,
    {
      header: 1, // Return array of arrays
      raw: false, // Convert all values to strings
      defval: '', // Default value for empty cells
    }
  );

  if (data.length === 0) {
    return {
      sheetNames,
      result: {
        headers: [],
        delimiter: '',
        totalRows: 0,
        rows: [],
        preview: [],
        errors: [],
      },
    };
  }

  const errors: Array<{ row: number; message: string }> = [];
  const rows: ParsedRow[] = [];
  let headers: string[] = [];

  // Process header
  let dataStartIndex = 0;
  if (hasHeader && data.length > 0) {
    headers = data[0].map((cell) => String(cell ?? '').trim());
    dataStartIndex = 1;
  } else if (customHeaders) {
    headers = customHeaders;
  }

  // Process data rows
  for (let i = dataStartIndex; i < data.length; i++) {
    const rowData = data[i];

    // Skip empty rows
    if (skipEmpty && rowData.every((cell) => cell === '' || cell === null || cell === undefined)) {
      continue;
    }

    // Check max rows limit
    if (maxRows > 0 && rows.length >= maxRows) {
      break;
    }

    try {
      const values = rowData.map((cell) => {
        if (cell === null || cell === undefined) return '';
        if (cell instanceof Date) {
          return cell.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }
        return String(cell);
      });

      // Generate headers if not present
      if (headers.length === 0) {
        headers = values.map((_, idx) => `Column ${idx + 1}`);
      }

      // Ensure values array matches headers length
      while (values.length < headers.length) {
        values.push('');
      }

      // Map values to headers
      const mappedData: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        mappedData[headers[j]] = values[j] || '';
      }

      rows.push({
        index: rows.length,
        values,
        data: mappedData,
      });
    } catch (error) {
      errors.push({
        row: i,
        message: error instanceof Error ? error.message : 'Parse error',
      });
    }
  }

  return {
    sheetNames,
    result: {
      headers,
      delimiter: '', // Not applicable for Excel
      totalRows: rows.length,
      rows,
      preview: rows.slice(0, 5),
      errors,
    },
  };
}

/**
 * Parse XLSX from base64 string
 */
export function parseXLSXBase64(base64: string, options: XLSXParseOptions = {}): XLSXParseInfo {
  const buffer = Buffer.from(base64, 'base64');
  return parseXLSX(buffer, options);
}
