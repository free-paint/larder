// Generates a FICTIONAL sample month for one site, shaped like the C6 data
// (~9% of lines off, a few hundred euros). Run: node scripts/make-sample.mjs
import { writeFileSync } from "node:fs";

let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const suppliers = {
  "Läänemere Kala OÜ": { prefix: "LK", days: [1, 3, 5], items: [["Lõhefilee", "kg", 18.9, 6, 14], ["Koha filee", "kg", 21.5, 3, 6], ["Räim", "kg", 4.2, 4, 8]] },
  "Rohemaa Köögivili OÜ": { prefix: "RK", days: [1, 2, 3, 4, 5], items: [["Kartul", "kg", 0.65, 20, 40], ["Sibul", "kg", 0.9, 8, 15], ["Tomat", "kg", 3.4, 5, 10], ["Salat", "tk", 1.2, 10, 20]] },
  "Kuldne Vili Kuivained OÜ": { prefix: "KV", days: [2], items: [["Nisujahu", "kg", 0.8, 25, 50], ["Riis", "kg", 1.9, 10, 20], ["Oliiviõli", "l", 9.5, 5, 10]] },
  "Saaremaa Piimatalu OÜ": { prefix: "SP", days: [1, 3, 5], items: [["Või", "kg", 8.9, 3, 6], ["Koor 35%", "l", 4.1, 6, 12], ["Piim", "l", 1.1, 15, 30]] },
  "Toompea Lihapood OÜ": { prefix: "TL", days: [2, 4], items: [["Veise sisefilee", "kg", 42.0, 3, 6], ["Kanarind", "kg", 7.8, 8, 15], ["Seakaelakarbonaad", "kg", 9.6, 5, 10]] },
};

const inv = [["invoice_no", "invoice_date", "supplier", "delivery_note_no", "item", "unit", "qty", "unit_price"]];
const del = [["delivery_note_no", "delivery_date", "supplier", "item", "unit", "qty_on_note", "qty_received"]];
let n = 1000;

// September 2026, Mon-Fri
for (let d = 1; d <= 30; d++) {
  const date = new Date(Date.UTC(2026, 8, d));
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) continue;
  const iso = date.toISOString().slice(0, 10);
  for (const [name, s] of Object.entries(suppliers)) {
    if (!s.days.includes(dow)) continue;
    n++;
    const note = `${s.prefix}-DN${n}`;
    const invoiceNo = `${s.prefix}-${n}`;
    const counted = rnd() < 0.8; // staff count ~80% of deliveries
    const lines = s.items.filter(() => rnd() < 0.85);
    for (const [item, unit, price, lo, hi] of lines) {
      const qty = unit === "tk" ? Math.round(lo + rnd() * (hi - lo)) : Math.round((lo + rnd() * (hi - lo)) * 2) / 2;
      let onNote = qty, received = qty, invoiced = qty, onNoteExists = true;
      const r = rnd();
      const short = Math.max(1, Math.round(qty * pick([0.15, 0.2, 0.3])));
      if (r < 0.035) onNote = received = qty - short;                                    // paper: note shows less than invoiced
      else if (r < 0.085 && counted) received = qty - short;                             // door: signed for full, counted less
      else if (r < 0.097) onNoteExists = false;                                          // invoiced, not on note at all
      else if (r < 0.105) received = qty + 1;                                            // over-delivery (not claimed)
      inv.push([invoiceNo, iso, name, note, item, unit, invoiced, price]);
      if (onNoteExists) del.push([note, iso, name, item, unit, onNote, counted ? received : ""]);
    }
  }
}

const csv = (rows) => rows.map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(",")).join("\n") + "\n";
writeFileSync("public/sample/invoices.csv", csv(inv));
writeFileSync("public/sample/deliveries.csv", csv(del));
console.log(`invoice lines: ${inv.length - 1}, delivery lines: ${del.length - 1}`);
