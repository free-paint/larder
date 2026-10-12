import Papa from "papaparse";

export const INVOICE_COLS = ["invoice_no", "invoice_date", "supplier", "delivery_note_no", "item", "unit", "qty", "unit_price"];
export const DELIVERY_COLS = ["delivery_note_no", "delivery_date", "supplier", "item", "unit", "qty_on_note", "qty_received"];

export function parseCsv(text, required) {
  const res = Papa.parse(text.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  const cols = res.meta.fields || [];
  const missing = required.filter((c) => c !== "qty_received" && !cols.includes(c));
  if (missing.length) throw new Error(`Missing column(s): ${missing.join(", ")}`);
  return res.data;
}

export const toCsv = (rows) => Papa.unparse(rows);

export function download(name, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
