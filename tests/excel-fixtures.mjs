import * as XLSX from 'xlsx';

export function resultsWorkbook(bookType = 'xlsx', count = 2) {
  const headers = ['Numéro', 'NOM', 'Moyenne', 'Decision', 'Wilaya', 'Date Naiss'];
  const rows = Array.from({ length: count }, (_, index) => [String(123 + index).padStart(5, '0'), index === 0 ? 'مترشح تجريبي' : 'Élève de test', 14.25, 'Admis', 'آدرار', new Date(Date.UTC(2008, 6, 15))]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows], { cellDates: true });
  for (let index = 0; index < count; index++) {
    sheet[`C${index + 2}`].z = '0.00';
    sheet[`F${index + 2}`].z = 'yyyy-mm-dd';
  }
  if (count > 1) sheet.A3 = { t: 'n', v: 124, z: '00000' };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'نتائج 2026');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Numéro', 'NOM'], ['00999', 'Other sheet']]), 'Second');
  const bytes = XLSX.write(workbook, { type: 'buffer', bookType });
  return { bytes, file: new File([bytes], `results-2026.${bookType === 'biff8' ? 'xls' : 'xlsx'}`) };
}
