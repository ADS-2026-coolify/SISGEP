export interface SpreadsheetColumn {
  key: string;
  header: string;
  width: number;
  numberFormat?: string;
}

export interface SpreadsheetSummaryItem {
  label: string;
  value: string | number;
  numberFormat?: string;
}

interface SpreadsheetOptions {
  filename: string;
  title: string;
  subtitle: string;
  worksheetName: string;
  columns: SpreadsheetColumn[];
  rows: Record<string, string | number | Date | null>[];
  summary?: SpreadsheetSummaryItem[];
  totals?: {
    label: string;
    labelKey: string;
    sumKeys: string[];
  };
}

const COLORS = {
  navy: '17324D',
  teal: '0F766E',
  lightTeal: 'CCFBF1',
  slate: 'F1F5F9',
  white: 'FFFFFF',
  border: 'CBD5E1',
  text: '334155',
  muted: '64748B',
};

export async function downloadExcel(options: SpreadsheetOptions) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SISGEP';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = options.title;
  workbook.title = options.title;

  const worksheet = workbook.addWorksheet(options.worksheetName, {
    properties: { defaultRowHeight: 22 },
    views: [{ state: 'frozen', ySplit: options.summary?.length ? 7 : 4 }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      showGridLines: false,
    },
  });

  worksheet.columns = options.columns.map(({ key, width }) => ({ key, width }));
  const lastColumn = options.columns.length;

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = options.title;
  titleCell.font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: COLORS.white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
  titleCell.alignment = { vertical: 'middle' };
  worksheet.getRow(1).height = 36;
  for (let column = 1; column <= lastColumn; column += 1) {
    worksheet.getCell(1, column).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.navy },
    };
  }

  worksheet.mergeCells(2, 1, 2, lastColumn);
  const subtitleCell = worksheet.getCell(2, 1);
  subtitleCell.value = `${options.subtitle}  |  Gerado em ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())}`;
  subtitleCell.font = { name: 'Aptos', size: 10, color: { argb: COLORS.muted }, italic: true };
  subtitleCell.alignment = { vertical: 'middle' };

  let tableHeaderRow = 4;
  const summaryItems = options.summary ?? [];
  if (summaryItems.length > 0) {
    const groupWidth = Math.floor(lastColumn / summaryItems.length);
    let startColumn = 1;
    summaryItems.forEach((item, index) => {
      const endColumn = index === summaryItems.length - 1
        ? lastColumn
        : Math.min(lastColumn, startColumn + groupWidth - 1);
      worksheet.mergeCells(4, startColumn, 4, endColumn);
      worksheet.mergeCells(5, startColumn, 5, endColumn);

      const labelCell = worksheet.getCell(4, startColumn);
      labelCell.value = item.label.toLocaleUpperCase('pt-BR');
      labelCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: COLORS.muted } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.slate } };
      labelCell.alignment = { vertical: 'middle' };

      const valueCell = worksheet.getCell(5, startColumn);
      valueCell.value = item.value;
      valueCell.font = { name: 'Aptos Display', size: 15, bold: true, color: { argb: COLORS.navy } };
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightTeal } };
      valueCell.alignment = { vertical: 'middle' };
      if (item.numberFormat) valueCell.numFmt = item.numberFormat;

      for (let column = startColumn; column <= endColumn; column += 1) {
        for (const rowNumber of [4, 5]) {
          worksheet.getCell(rowNumber, column).border = {
            top: { style: 'thin', color: { argb: COLORS.border } },
            bottom: { style: 'thin', color: { argb: COLORS.border } },
            left: { style: 'thin', color: { argb: COLORS.border } },
            right: { style: 'thin', color: { argb: COLORS.border } },
          };
        }
      }
      startColumn = endColumn + 1;
    });
    worksheet.getRow(4).height = 22;
    worksheet.getRow(5).height = 34;
    tableHeaderRow = 8;
  }

  const header = worksheet.getRow(tableHeaderRow);
  options.columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.value = column.header;
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: COLORS.teal } } };
  });
  header.height = 30;

  const firstDataRow = tableHeaderRow + 1;
  options.rows.forEach((data, index) => {
    const row = worksheet.addRow(data);
    row.height = 25;
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const column = options.columns[columnNumber - 1];
      cell.font = { name: 'Aptos', size: 10, color: { argb: COLORS.text } };
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.border = { bottom: { style: 'hair', color: { argb: COLORS.border } } };
      if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      }
      if (column?.numberFormat) cell.numFmt = column.numberFormat;
      if (column?.key === 'status' && typeof cell.value === 'string') {
        const released = cell.value.toLocaleLowerCase('pt-BR') === 'liberado';
        cell.font = {
          name: 'Aptos',
          size: 10,
          bold: true,
          color: { argb: released ? '166534' : '9A3412' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: released ? 'DCFCE7' : 'FFEDD5' },
        };
      }
      if (column?.key === 'totalCost') {
        cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.navy } };
      }
    });
  });

  const lastDataRow = firstDataRow + options.rows.length - 1;
  if (options.rows.length > 0) {
    worksheet.autoFilter = {
      from: { row: tableHeaderRow, column: 1 },
      to: { row: lastDataRow, column: lastColumn },
    };
  }
  worksheet.headerFooter.oddFooter = '&LSISGEP&C&P de &N';

  if (options.totals && options.rows.length > 0) {
    const totalRow = worksheet.addRow({});
    totalRow.height = 28;
    const labelColumnIndex = options.columns.findIndex((column) => column.key === options.totals!.labelKey) + 1;
    const labelCell = totalRow.getCell(Math.max(1, labelColumnIndex));
    labelCell.value = options.totals.label;
    options.totals.sumKeys.forEach((key) => {
      const columnIndex = options.columns.findIndex((column) => column.key === key) + 1;
      if (columnIndex > 0) {
        const columnLetter = worksheet.getColumn(columnIndex).letter;
        const cell = totalRow.getCell(columnIndex);
        cell.value = { formula: `SUM(${columnLetter}${firstDataRow}:${columnLetter}${lastDataRow})` };
        cell.numFmt = options.columns[columnIndex - 1].numberFormat ?? '#,##0.00';
      }
    });
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.navy } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightTeal } };
      cell.border = { top: { style: 'medium', color: { argb: COLORS.teal } } };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getLocalDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
