// Load the maintained SheetJS distribution only when an administrator chooses a
// file. Keep formatted candidate numbers (including leading zeroes) as text.
export async function readResultsWorksheet(file, requestedSheetName = "") {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    dense: false,
  });
  const sheetName = requestedSheetName && workbook.SheetNames.includes(requestedSheetName)
    ? requestedSheetName
    : workbook.SheetNames[0];
  if (!sheetName) return { sheetName: "", rawRows: [] };
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });
  return { sheetName, rawRows };
}
