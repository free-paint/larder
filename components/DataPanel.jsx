import { useRef, useState } from "react";
import { DELIVERY_COLS, INVOICE_COLS, download, parseCsv, toCsv } from "@/lib/csv.mjs";
import { KIND_LABEL, STATUS_LABEL, Button, Card, Icon } from "./ui";

function DropZone({ label, hint, cols, count, onRows }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState(null);

  const read = async (file) => {
    if (!file) return;
    try {
      const rows = parseCsv(await file.text(), cols);
      onRows(rows);
      setMsg({ ok: true, text: `${rows.length} lines loaded from ${file.name}` });
    } catch (err) {
      setMsg({ ok: false, text: `${file.name}: ${err.message}` });
    }
  };

  return (
    <div>
      <button type="button" onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); read(e.dataTransfer.files?.[0]); }}
        className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${drag ? "border-stone-900 bg-stone-100" : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50"}`}>
        <span className="mb-2 rounded-full bg-stone-100 p-2.5 text-stone-700"><Icon name="upload" /></span>
        <span className="font-semibold">{label}</span>
        <span className="mt-0.5 text-sm text-stone-500">{hint}</span>
        <span className="mt-2 text-xs text-stone-500">Drop a CSV here or tap to choose · {count} lines loaded</span>
      </button>
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { read(e.target.files?.[0]); e.target.value = ""; }} />
      {msg && (
        <div className={`mt-2 flex items-start gap-1.5 text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>
          <Icon name={msg.ok ? "check" : "info"} className="mt-0.5 h-4 w-4 shrink-0" />{msg.text}
        </div>
      )}
      <details className="mt-2 text-xs text-stone-500">
        <summary className="cursor-pointer">Required columns</summary>
        <code className="mt-1 block break-words rounded-lg bg-stone-100 p-2">{cols.join(", ")}</code>
      </details>
    </div>
  );
}

export default function DataPanel({ data, setData, lines, statuses, settings, setSettings, loadSample, reset, notify }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const claims = lines.filter((l) => l.value > 0);

  const exportMonthEnd = () => {
    const rows = claims.map((l) => {
      const s = statuses[l.id] ?? {};
      return {
        supplier: l.supplier, invoice_no: l.invoice_no, invoice_date: l.invoice_date, delivery_note_no: l.delivery_note_no,
        item: l.item, unit: l.unit, short_qty: l.shortQty, unit_price: l.unit_price, claim_eur: l.value,
        where: KIND_LABEL[l.kind], status: STATUS_LABEL[s.status ?? "open"], requested_on: s.requestedAt ?? "",
        credited_eur: s.status === "credited" ? s.creditedAmount ?? l.value : "", credit_note_no: s.creditNoteRef ?? "",
      };
    });
    download(`larder-month-end-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    notify(`Downloaded ${rows.length} claims`);
  };

  const field = (key, label, type = "text") => (
    <label className="block text-sm">
      <span className="text-stone-600">{label}</span>
      <input type={type} inputMode={type === "number" ? "decimal" : undefined}
        className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2" value={settings[key] ?? ""}
        onChange={(e) => setSettings({ [key]: type === "number" ? Number(e.target.value) : e.target.value })} />
    </label>
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Load a month</h2>
        <p className="mt-1 text-sm text-stone-600">
          {data.isSample ? "You're using the fictional sample month. " : ""}Upload both files for the same site and period.
          Leave <code className="rounded bg-stone-100 px-1">qty_received</code> empty where nobody counted.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DropZone label="Invoice lines" hint="What suppliers billed" cols={INVOICE_COLS} count={data.invoices.length}
            onRows={(rows) => setData((d) => ({ ...d, invoices: rows, isSample: false }))} />
          <DropZone label="Delivery-note lines" hint="What the signed notes say, and what was counted" cols={DELIVERY_COLS} count={data.deliveries.length}
            onRows={(rows) => setData((d) => ({ ...d, deliveries: rows, isSample: false }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-stone-50" href="/sample/invoices.csv" download>
            <Icon name="download" className="h-4 w-4" />Template: invoices.csv
          </a>
          <a className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-stone-50" href="/sample/deliveries.csv" download>
            <Icon name="download" className="h-4 w-4" />Template: deliveries.csv
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Month-end export</h2>
        <p className="mt-1 text-sm text-stone-600">One row per claim, with its status and credit note number, ready for accounting.</p>
        <Button className="mt-3" onClick={exportMonthEnd} disabled={claims.length === 0}>
          <Icon name="download" className="h-4 w-4" />Download CSV ({claims.length} claims)
        </Button>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Pilot settings</h2>
        <Card className="mt-3 grid gap-4 sm:grid-cols-2">
          {field("siteName", "Site name (shown in emails)")}
          {field("sender", "Your name (email sign-off)")}
          {field("totalSites", "Sites in the group", "number")}
          {field("monthlyFee", "Pilot fee per month (€)", "number")}
        </Card>
      </section>

      <section className="rounded-2xl border border-stone-200 p-4 sm:p-5">
        <h2 className="font-semibold">Start over</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => { loadSample(); notify("Sample month reloaded"); }}>
            <Icon name="refresh" className="h-4 w-4" />Reload sample month
          </Button>
          {confirmClear ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-rose-700">Delete all data and statuses?</span>
              <Button variant="danger" onClick={() => { reset(); setConfirmClear(false); notify("Everything cleared"); }}>Yes, clear</Button>
              <Button variant="subtle" onClick={() => setConfirmClear(false)}>Cancel</Button>
            </span>
          ) : (
            <Button variant="ghost" className="text-rose-700" onClick={() => setConfirmClear(true)}>Clear everything</Button>
          )}
        </div>
      </section>
    </div>
  );
}
