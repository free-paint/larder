// Core reconciliation logic. Pure functions, no UI, so it can be tested on its own.
//
// Three quantities per line:
//   invoiced  - what the supplier billed (invoice)
//   onNote    - what the signed delivery note says arrived (paper)
//   received  - what kitchen staff actually counted at the door (blank = not counted)
//
// A shortfall is split into two parts, because they need different fixes:
//   paper gap = invoiced - onNote    -> visible on documents we already have
//   door gap  = onNote   - received  -> only caught if someone counts at the door

const EPS = 0.001;

export const num = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const normItem = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const keyOf = (supplier, noteNo, item) =>
  [String(supplier || "").trim().toLowerCase(), String(noteNo || "").trim().toLowerCase(), normItem(item)].join("|");

export const round2 = (n) => Math.round(n * 100) / 100;

export function reconcile(invoices, deliveries) {
  const noteIndex = new Map();
  for (const d of deliveries) noteIndex.set(keyOf(d.supplier, d.delivery_note_no, d.item), d);

  const lines = [];
  for (const inv of invoices) {
    const invoiced = num(inv.qty) ?? 0;
    const price = num(inv.unit_price) ?? 0;
    const note = noteIndex.get(keyOf(inv.supplier, inv.delivery_note_no, inv.item));
    const base = {
      id: `${String(inv.invoice_no).trim()}::${normItem(inv.item)}`,
      supplier: String(inv.supplier || "").trim(),
      invoice_no: inv.invoice_no,
      invoice_date: inv.invoice_date,
      delivery_note_no: inv.delivery_note_no,
      item: inv.item,
      unit: inv.unit,
      unit_price: price,
      invoiced,
    };

    if (!note) {
      lines.push({ ...base, onNote: null, received: null, counted: false, kind: "not_on_note",
        shortQty: invoiced, paperValue: round2(invoiced * price), doorValue: 0, value: round2(invoiced * price) });
      continue;
    }

    const onNote = num(note.qty_on_note) ?? 0;
    const counted = num(note.qty_received);
    const received = counted ?? onNote;
    const paperGap = Math.max(0, invoiced - onNote);
    const doorGap = counted === null ? 0 : Math.max(0, onNote - counted);
    const shortQty = invoiced - received;

    let kind = "ok";
    if (shortQty > EPS) kind = doorGap > EPS && paperGap <= EPS ? "door" : paperGap > EPS && doorGap <= EPS ? "paper" : "paper_and_door";
    else if (shortQty < -EPS) kind = "over";

    const value = shortQty > EPS ? round2(shortQty * price) : 0;
    const paperValue = shortQty > EPS ? round2(Math.min(paperGap, shortQty) * price) : 0;
    lines.push({ ...base, onNote, received, counted: counted !== null, kind, shortQty: round2(shortQty),
      paperValue, doorValue: round2(value - paperValue), value });
  }
  return lines;
}

export const isClaim = (l) => l.value > 0;

export function summarize(lines, statuses = {}, opts = {}) {
  const sites = opts.sites ?? 1;
  const months = opts.months ?? 1;
  const monthlyFee = opts.monthlyFee ?? 1500;
  const totalSites = opts.totalSites ?? 9;
  const claims = lines.filter(isClaim);
  const sum = (arr, f) => round2(arr.reduce((a, x) => a + f(x), 0));
  const st = (l) => statuses[l.id]?.status ?? "open";

  const found = sum(claims, (l) => l.value);
  const requestedLines = claims.filter((l) => ["requested", "credited", "disputed"].includes(st(l)));
  const requested = sum(requestedLines, (l) => l.value);
  const credited = sum(claims.filter((l) => st(l) === "credited"), (l) => statuses[l.id]?.creditedAmount ?? l.value);
  const matchedLines = lines.filter((l) => l.kind !== "not_on_note");

  return {
    linesChecked: lines.length,
    claimLines: claims.length,
    found,
    openValue: sum(claims.filter((l) => st(l) === "open"), (l) => l.value),
    paper: sum(claims, (l) => l.paperValue),
    door: sum(claims, (l) => l.doorValue),
    requested,
    credited,
    recoveryRate: requested > 0 ? credited / requested : null,
    captureRate: matchedLines.length ? matchedLines.filter((l) => l.counted).length / matchedLines.length : null,
    foundPerSiteMonth: round2(found / sites / months),
    breakEvenPerSiteMonth: round2(monthlyFee / totalSites),
    byStatus: ["open", "requested", "credited", "disputed", "written_off"].reduce((acc, s) => {
      acc[s] = claims.filter((l) => st(l) === s).length;
      return acc;
    }, {}),
  };
}
