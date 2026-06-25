/**
 * Excel Parser
 * Utility to parse Excel/CSV files into structured data
 */

import ExcelJS from 'exceljs';

export interface ParsedExcelData {
    headers: string[];
    rows: any[][];
    metadata: {
        totalRows: number;
        totalColumns: number;
        fileName?: string;
    };
}

function cellToString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value !== null && 'text' in value) {
        return String((value as { text?: string }).text ?? '').trim();
    }
    if (value instanceof Date) return value.toISOString();
    return String(value).trim();
}

export class ExcelParser {
    /**
     * Parse Excel or CSV file buffer
     */
    async parse(buffer: Buffer): Promise<ParsedExcelData> {
        const fileType = this.detectFileType(buffer);
        if (fileType === 'csv') {
            return this.parseCSV(buffer);
        }

        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No data found in Excel file');
            }

            const rawData: string[][] = [];
            worksheet.eachRow((row) => {
                const values = row.values as ExcelJS.CellValue[];
                const cells = (values.slice(1) ?? []).map(cellToString);
                if (cells.some((cell) => cell !== '')) {
                    rawData.push(cells);
                }
            });

            if (rawData.length === 0) {
                throw new Error('No data found in Excel file');
            }

            const headers = rawData[0];
            const rows = rawData.slice(1);

            return {
                headers,
                rows,
                metadata: {
                    totalRows: rows.length,
                    totalColumns: headers.length,
                },
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to parse Excel file: ${message}`);
        }
    }

    /**
     * Parse CSV specifically (alternative implementation)
     */
    async parseCSV(buffer: Buffer, delimiter: string = ','): Promise<ParsedExcelData> {
        const text = buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        const headers = this.parseCSVLine(lines[0], delimiter);
        const rows = lines.slice(1).map(line => this.parseCSVLine(line, delimiter));

        return {
            headers,
            rows,
            metadata: {
                totalRows: rows.length,
                totalColumns: headers.length
            }
        };
    }

    /**
     * Parse a single CSV line handling quoted fields
     */
    private parseCSVLine(line: string, delimiter: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    /**
     * Detect file type from buffer
     */
    detectFileType(buffer: Buffer): 'xlsx' | 'xls' | 'csv' | 'unknown' {
        if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
            return 'xlsx';
        }
        if (buffer[0] === 0xD0 && buffer[1] === 0xCF) {
            return 'xls';
        }

        try {
            buffer.toString('utf-8');
            return 'csv';
        } catch {
            return 'unknown';
        }
    }
}
