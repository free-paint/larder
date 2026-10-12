import { useState } from "react";
import { KIND_HELP, KIND_LABEL, STATUS, STATUS_LABEL, STATUS_STYLE, eur } from "./ui";

const q = (n) => (n === null || n === undefined ? "–" : String(Math.round(n * 100) / 100).replace(".", ","));

export default function Discrepancies({ lines, statuses, setStatus }) {
  const [supplier, setSupplier] = useState("all");
  const [status, setStatusFilter] = useState("all");
  const [showOk, setShowOk] = useState(false);

  const suppliers = [...new Set(lines.map((l) => l.supplier))].sort();
  const st = (l) => statuses[l.id]?.status ?? "open";
  const shown = lines
    .filter((l) => (showOk ? true : l.value > 0 || l.kind === "over"))
    .filter((l) => supplier === "all" || l.supplier === supplier)
    .filter((l) => status === "all" || (l.value > 0 && st(l) === status))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select className="rounded-lg border border-stone-300 bg-white px-2 py-1.5" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option value="all">All suppliers</option>
          {suppliers.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="rounded-lg border border-stone-300 bg-white px-2 py-1.5" value={status} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Any status</option>
          {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-stone-600">
          <input type="checkbox" checked={showOk} onChange={(e) => setShowOk(e.target.checked)} /> Show matching lines too
        </label>
        <span className="ml-auto text-stone-500">{shown.length} lines</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="p-2">Supplier / invoice</th>
              <th className="p-2">Item</th>
              <th className="p-2 text-right">Invoiced</th>
              <th className="p-2 text-right">On note</th>
              <th className="p-2 text-right">Counted</th>
              <th className="p-2">Where</th>
              <th className="p-2 text-right">Claim</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => {
              const cur = statuses[l.id] ?? {};
              const s = cur.status ?? "open";
              return (
                <tr key={l.id} className="border-t border-stone-100 align-top">
                  <td className="p-2">
                    <div className="font-medium">{l.supplier}</div>
                    <div className="text-xs text-stone-500">{l.invoice_no} · {l.invoice_date} · {l.delivery_note_no}</div>
                  </td>
                  <td className="p-2">{l.item} <span className="text-stone-400">({l.unit})</span></td>
                  <td className="p-2 text-right tabular-nums">{q(l.invoiced)}</td>
                  <td className="p-2 text-right tabular-nums">{q(l.onNote)}</td>
                  <td className="p-2 text-right tabular-nums">{l.counted ? q(l.received) : <span className="text-stone-400">not counted</span>}</td>
                  <td className="p-2" title={KIND_HELP[l.kind]}>{KIND_LABEL[l.kind]}</td>
                  <td className="p-2 text-right font-medium tabular-nums">{l.value > 0 ? eur(l.value) : "–"}</td>
                  <td className="p-2">
                    {l.value > 0 ? (
                      <div className="space-y-1">
                        <select
                          className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLE[s]}`}
                          value={s}
                          onChange={(e) => setStatus(l.id, { status: e.target.value, creditedAmount: e.target.value === "credited" ? cur.creditedAmount ?? l.value : cur.creditedAmount })}
                        >
                          {STATUS.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}
                        </select>
                        {s === "credited" && (
                          <div className="flex gap-1">
                            <input className="w-20 rounded border border-stone-300 px-1 py-0.5 text-xs" type="number" step="0.01" placeholder="€"
                              value={cur.creditedAmount ?? ""} onChange={(e) => setStatus(l.id, { creditedAmount: e.target.value === "" ? null : Number(e.target.value) })} />
                            <input className="w-24 rounded border border-stone-300 px-1 py-0.5 text-xs" placeholder="Credit note #"
                              value={cur.creditNoteRef ?? ""} onChange={(e) => setStatus(l.id, { creditNoteRef: e.target.value })} />
                          </div>
                        )}
                        {cur.requestedAt && <div className="text-xs text-stone-500">sent {cur.requestedAt}</div>}
                      </div>
                    ) : <span className="text-xs text-stone-400">{l.kind === "over" ? "not claimed" : ""}</span>}
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-stone-500">Nothing to show with these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
