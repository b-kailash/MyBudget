/**
 * CSV Parser for transaction imports
 *
 * Features:
 * - Auto-detects delimiter (comma, semicolon, tab)
 * - Handles quoted fields with embedded delimiters
 * - Supports header row detection
 * - Configurable column mapping
 */

export interface ParsedRow {
  /** Original row index (0-based, excluding header) */
  index: number;
  /** Raw values from CSV */
  values: string[];
  /** Mapped values with column names */
  data: Record<string, string>;
}

export interface CSVParseResult {
  /** Detected or specified headers */
  headers: string[];
  /** Detected delimiter */
  delimiter: string;
  /** Total row count (excluding header) */
  totalRows: number;
  /** Parsed rows */
  rows: ParsedRow[];
  /** Preview rows (first 5) */
  preview: ParsedRow[];
  /** Any parsing errors */
  errors: Array<{ row: number; message: string }>;
}

export interface CSVParseOptions {
  /** Override auto-detected delimiter */
  delimiter?: string;
  /** Whether first row contains headers (default: true) */
  hasHeader?: boolean;
  /** Custom headers if hasHeader is false */
  headers?: string[];
  /** Maximum rows to parse (0 = all) */
  maxRows?: number;
  /** Skip empty rows (default: true) */
  skipEmpty?: boolean;
}

/**
 * Column mapping configuration for transaction import
 */
export interface ColumnMapping {
  /** Column index or header name for date */
  date?: string | number;
  /** Column index or header name for amount */
  amount?: string | number;
  /** Column index or header name for payee/description */
  payee?: string | number;
  /** Column index or header name for notes/memo */
  notes?: string | number;
  /** Column index or header name for category (optional) */
  category?: string | number;
  /** Column index or header name for transaction type (optional) */
  type?: string | number;
  /** Date format string (e.g., 'DD/MM/YYYY', 'MM-DD-YYYY') */
  dateFormat?: string;
  /** Whether negative amounts are expenses (default: true) */
  negativeIsExpense?: boolean;
}

/**
 * Detect the most likely delimiter in CSV content
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  const delimiters = [',', ';', '\t', '|'];

  let maxCount = 0;
  let detected = ',';

  for (const delimiter of delimiters) {
    // Count occurrences outside of quoted strings
    let count = 0;
    let inQuotes = false;

    for (const char of firstLine) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }

    if (count > maxCount) {
      maxCount = count;
      detected = delimiter;
    }
  }

  return detected;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(content: string, options: CSVParseOptions = {}): CSVParseResult {
  const {
    delimiter: customDelimiter,
    hasHeader = true,
    headers: customHeaders,
    maxRows = 0,
    skipEmpty = true,
  } = options;

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Detect delimiter
  const delimiter = customDelimiter || detectDelimiter(normalized);

  const errors: Array<{ row: number; message: string }> = [];
  const rows: ParsedRow[] = [];
  let headers: string[] = [];

  // Process header
  let dataStartIndex = 0;
  if (hasHeader && lines.length > 0) {
    headers = parseLine(lines[0], delimiter);
    dataStartIndex = 1;
  } else if (customHeaders) {
    headers = customHeaders;
  }

  // Process data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (skipEmpty && line.trim() === '') {
      continue;
    }

    // Check max rows limit
    if (maxRows > 0 && rows.length >= maxRows) {
      break;
    }

    try {
      const values = parseLine(line, delimiter);

      // Generate headers if not present
      if (headers.length === 0) {
        headers = values.map((_, idx) => `Column ${idx + 1}`);
      }

      // Map values to headers
      const data: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        data[headers[j]] = values[j] || '';
      }

      rows.push({
        index: rows.length,
        values,
        data,
      });
    } catch (error) {
      errors.push({
        row: i,
        message: error instanceof Error ? error.message : 'Parse error',
      });
    }
  }

  return {
    headers,
    delimiter,
    totalRows: rows.length,
    rows,
    preview: rows.slice(0, 5),
    errors,
  };
}

/**
 * Apply column mapping to parsed CSV data
 */
export function applyColumnMapping(
  parseResult: CSVParseResult,
  mapping: ColumnMapping
): Array<{
  index: number;
  date: string;
  amount: string;
  payee: string;
  notes: string;
  category: string;
  type: string;
  raw: Record<string, string>;
}> {
  const { headers, rows } = parseResult;

  // Resolve column index from name or number
  const resolveColumn = (col: string | number | undefined): number => {
    if (col === undefined) return -1;
    if (typeof col === 'number') return col;
    return headers.indexOf(col);
  };

  const dateCol = resolveColumn(mapping.date);
  const amountCol = resolveColumn(mapping.amount);
  const payeeCol = resolveColumn(mapping.payee);
  const notesCol = resolveColumn(mapping.notes);
  const categoryCol = resolveColumn(mapping.category);
  const typeCol = resolveColumn(mapping.type);

  return rows.map((row) => ({
    index: row.index,
    date: dateCol >= 0 ? row.values[dateCol] || '' : '',
    amount: amountCol >= 0 ? row.values[amountCol] || '' : '',
    payee: payeeCol >= 0 ? row.values[payeeCol] || '' : '',
    notes: notesCol >= 0 ? row.values[notesCol] || '' : '',
    category: categoryCol >= 0 ? row.values[categoryCol] || '' : '',
    type: typeCol >= 0 ? row.values[typeCol] || '' : '',
    raw: row.data,
  }));
}

/**
 * Suggest column mapping based on header names
 */
export function suggestColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Date patterns
  const datePatterns = ['date', 'transaction date', 'posted date', 'value date', 'booking date'];
  for (const pattern of datePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx >= 0) {
      mapping.date = headers[idx];
      break;
    }
  }

  // Amount patterns
  const amountPatterns = ['amount', 'value', 'sum', 'debit', 'credit', 'transaction amount'];
  for (const pattern of amountPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx >= 0) {
      mapping.amount = headers[idx];
      break;
    }
  }

  // Payee/Description patterns
  const payeePatterns = ['payee', 'description', 'merchant', 'narrative', 'details', 'name', 'beneficiary'];
  for (const pattern of payeePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx >= 0) {
      mapping.payee = headers[idx];
      break;
    }
  }

  // Notes/Memo patterns
  const notesPatterns = ['notes', 'memo', 'reference', 'comment'];
  for (const pattern of notesPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx >= 0) {
      mapping.notes = headers[idx];
      break;
    }
  }

  // Category patterns
  const categoryPatterns = ['category', 'type', 'classification'];
  for (const pattern of categoryPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (idx >= 0) {
      mapping.category = headers[idx];
      break;
    }
  }

  return mapping;
}
