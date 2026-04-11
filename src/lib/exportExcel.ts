import * as XLSX from 'xlsx';

interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const data = [s.headers, ...s.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = s.headers.map((h, i) => {
      let max = h.length;
      s.rows.forEach(r => {
        const val = String(r[i] ?? '');
        if (val.length > max) max = val.length;
      });
      return { wch: Math.min(max + 2, 40) };
    });
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, s.name.substring(0, 31));
  });
  XLSX.writeFile(wb, filename);
}
