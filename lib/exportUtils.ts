import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcel({
    data, 
    headers, 
    fileName, 
    reportName 
}: {
    data: any[][];
    headers: string[];
    fileName: string;
    reportName: string;
}) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportName.substring(0, 31));

    // Add Title Row
    const titleRow = sheet.addRow([reportName]);
    titleRow.font = { bold: true, size: 14 };
    sheet.mergeCells(1, 1, 1, headers.length);
    titleRow.getCell(1).alignment = { horizontal: 'center' };

    // Add Headers
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
        };
        cell.border = {
            bottom: { style: 'thin' }
        };
    });

    // Add Data
    data.forEach(rowData => {
        const row = sheet.addRow(rowData);
        row.eachCell((cell) => {
            let val = cell.value;
            // Basic formatting for numbers
            if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '' && !val.startsWith('0')) {
                cell.value = Number(val);
            }
        });
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
        if (!column) return;
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
            if (rowNumber === 1) return; // Skip title row
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 100);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const finalFileName = `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, finalFileName);
}
