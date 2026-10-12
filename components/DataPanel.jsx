import { useState } from "react";
import { DELIVERY_COLS, INVOICE_COLS, download, parseCsv, toCsv } from "@/lib/csv.mjs";
import { KIND_LABEL, STATUS_LABEL, Button, Card } from "./ui";

function Upload({ label, cols, onRows }) {
  const [msg, setMsg] = useState("");
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-stone-300 bg-white p-4 hover:bg-stone-50">
      <div className="font-medium">{label}</div>
      <div className="mt-1 text-xs text-stone-500">CSV columns: {cols.join(", ")}</div>
      <input type="file" accept=".csv,text/csv" className="mt-2 block text-sm" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try { const rows = parseCsv(await f.text(), cols); onRows(rows); setMsg(`Loaded ${rows.length} lines from ${f.name}`); }
        catch (err) { setMsg(`Could not read ${f.name}: ${err.message}`); }
        e.target.value = "";
      }} />
      {msg && <div className="mt-2 text-sm text-stone-700">{msg}</div>}
    </label>
  );
}

export default function DataPanel({ data, setData, lines, statuses, settings, setSettings, loadSample, reset }) {
  const exportMonthEnd = () => {
    const rows = lines.filter((l) => l.value > 0).map((l) => {
      const s = statuses[l.id] ?? {};
      return {
        supplier: l.supplier, invoice_no: l.invoice_no, invoice_date: l.invoice_date, delivery_note_no: l.delivery_note_no,
        item: l.item, unit: l.unit, short_qty: l.shortQty, unit_price: l.unit_price, claim_eur: l.value,
        where: KIND_LABEL[l.kind], status: STATUS_LABEL[s.status ?? "open"], requested_on: s.requestedAt ?? "",
        credited_eur: s.status === "credited" ? s.creditedAmount ?? l.value : "", credit_note_no: s.creditNoteRef ?? "",
      };
    });
    download(`larder-month-end-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const field = (key, label, type = "text") => (
    <label className="block text-sm">
      <span className="text-stone-600">{label}</span>
      <input type={type} className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5" value={settings[key] ?? ""}
        onChange={(e) => setSettings({ [key]: type === "number" ? Number(e.target.value) : e.target.value })} />
    </label>
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 font-semibold">1. Load a month</h2>
        <p className="mb-3 text-sm text-stone-600">
          Currently loaded: {data.invoices.length} invoice lines and {data.deliveries.length} delivery-note lines{data.isSample ? " (fictional sample)" : ""}.
          Leave <code>qty_received</code> blank where nobody counted.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Upload label="Invoice lines" cols={INVOICE_COLS} onRows={(rows) => setData({ ...data, invoices: rows, isSample: false })} />
          <Upload label="Delivery-note lines" cols={DELIVERY_COLS} onRows={(rows) => setData({ ...data, deliveries: rows, isSample: false })} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100" href="/sample/invoices.csv" download>Sample invoices.csv</a>
          <a className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 hover:bg-stone-100" href="/sample/deliveries.csv" download>Sample deliveries.csv</a>
          <Button variant="ghost" onClick={loadSample}>Reload sample month</Button>
          <Button variant="ghost" onClick={() => { if (window.confirm?.("Clear all data and statuses?") ?? true) reset(); }}>Clear everything</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">2. Pilot settings</h2>
        <Card className="grid gap-3 md:grid-cols-3">
          {field("siteName", "Site name (used in emails)")}
          {field("sender", "Your name (email sign-off)")}
          {field("totalSites", "Sites in the group", "number")}
          {field("monthlyFee", "Pilot fee per month (€)", "number")}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">3. Month-end export</h2>
        <p className="mb-3 text-sm text-stone-600">One row per claim with its status and credit note number, ready to hand to accounting.</p>
        <Button onClick={exportMonthEnd} disabled={!lines.some((l) => l.value > 0)}>Download month-end CSV</Button>
      </section>
    </div>
  );
}
