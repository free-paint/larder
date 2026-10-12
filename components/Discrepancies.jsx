import { useMemo, useState } from "react";
import { Badge, Card, EmptyState, Icon, KIND_HELP, KIND_LABEL, KIND_STYLE, STATUS, STATUS_LABEL, StatusSelect, eur, qty } from "./ui";

function CreditFields({ cur, line, setStatus }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <label className="text-xs text-stone-500">
        Credited €
        <input inputMode="decimal" className="mt-0.5 block w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
          value={cur.creditedAmount ?? ""} placeholder={String(line.value)}
          onChange={(e) => setStatus(line.id, { creditedAmount: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} />
      </label>
      <label className="text-xs text-stone-500">
        Credit note #
        <input className="mt-0.5 block w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
          value={cur.creditNoteRef ?? ""} placeholder="optional"
          onChange={(e) => setStatus(line.id, { creditNoteRef: e.target.value })} />
      </label>
    </div>
  );
}

export default function Discrepancies({ lines, statuses, setStatus, initialStatus = "all" }) {
  const [supplier, setSupplier] = useState("all");
  const [status, setStatusFilter] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [showOk, setShowOk] = useState(false);

  const st = (l) => statuses[l.id]?.status ?? "open";
  const suppliers = useMemo(() => [...new Set(lines.map((l) => l.supplier))].sort(), [lines]);
  const claims = lines.filter((l) => l.value > 0);
  const counts = STATUS.reduce((a, x) => ({ ...a, [x]: claims.filter((l) => st(l) === x).length }), { all: claims.length });

  const q = query.trim().toLowerCase();
  const shown = lines
    .filter((l) => (showOk && status === "all" ? true : l.value > 0 || (status === "all" && l.kind === "over")))
    .filter((l) => status === "all" || (l.value > 0 && st(l) === status))
    .filter((l) => supplier === "all" || l.supplier === supplier)
    .filter((l) => !q || [l.item, l.invoice_no, l.delivery_note_no, l.supplier].some((x) => String(x).toLowerCase().includes(q)))
    .sort((a, b) => b.value - a.value);
  const shownValue = shown.reduce((a, l) => a + l.value, 0);

  const change = (l, next) => {
    const cur = statuses[l.id] ?? {};
    setStatus(l.id, { status: next, creditedAmount: next === "credited" ? cur.creditedAmount ?? l.value : cur.creditedAmount });
  };

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {["all", ...STATUS].map((x) => (
          <button key={x} onClick={() => setStatusFilter(x)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${status === x ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"}`}>
            {x === "all" ? "All claims" : STATUS_LABEL[x]}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${status === x ? "bg-white/20" : "bg-stone-100"}`}>{counts[x]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item, invoice or note number"
            className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
        <select className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
          <option value="all">All suppliers</option>
          {suppliers.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
        <span><b className="font-semibold text-stone-900">{shown.length}</b> lines · <b className="font-semibold text-stone-900 tabular-nums">{eur(shownValue)}</b></span>
        {status === "all" && (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-stone-900" checked={showOk} onChange={(e) => setShowOk(e.target.checked)} />
            Include lines that match
          </label>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="search" title="Nothing here">Try another status, supplier or search term.</EmptyState>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {shown.map((l) => {
              const cur = statuses[l.id] ?? {};
              const s = cur.status ?? "open";
              return (
                <li key={l.id} className="fade-up">
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">{l.item}</div>
                        <div className="truncate text-xs text-stone-500">{l.supplier}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">{l.value > 0 ? eur(l.value) : "–"}</div>
                        <Badge className={KIND_STYLE[l.kind]} title={KIND_HELP[l.kind]}>{KIND_LABEL[l.kind]}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-2 text-center text-xs">
                      <div><div className="text-stone-500">Invoiced</div><div className="font-semibold tabular-nums">{qty(l.invoiced)} {l.unit}</div></div>
                      <div><div className="text-stone-500">On note</div><div className="font-semibold tabular-nums">{qty(l.onNote)}</div></div>
                      <div><div className="text-stone-500">Counted</div><div className="font-semibold tabular-nums">{l.counted ? qty(l.received) : "—"}</div></div>
                    </div>
                    <div className="mt-2 text-xs text-stone-500">{l.invoice_no} · {l.invoice_date} · note {l.delivery_note_no}</div>
                    {l.value > 0 && (
                      <div className="mt-3">
                        <StatusSelect value={s} onChange={(v) => change(l, v)} className="w-full" />
                        {s === "credited" && <CreditFields cur={cur} line={l} setStatus={setStatus} />}
                        {cur.requestedAt && <div className="mt-1 text-xs text-stone-500">Sent {cur.requestedAt}</div>}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Tablet and up: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Item</th>
                  <th className="px-3 py-2.5 text-right font-medium">Invoiced</th>
                  <th className="px-3 py-2.5 text-right font-medium">On note</th>
                  <th className="px-3 py-2.5 text-right font-medium">Counted</th>
                  <th className="px-3 py-2.5 font-medium">Where</th>
                  <th className="px-3 py-2.5 text-right font-medium">Claim</th>
                  <th className="w-48 px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => {
                  const cur = statuses[l.id] ?? {};
                  const s = cur.status ?? "open";
                  return (
                    <tr key={l.id} className="border-t border-stone-100 align-top transition-colors hover:bg-stone-50/70">
                      <td className="px-3 py-3">
                        <div className="font-medium">{l.item} <span className="font-normal text-stone-400">({l.unit})</span></div>
                        <div className="text-xs text-stone-500">{l.supplier}</div>
                        <div className="text-xs text-stone-400">{l.invoice_no} · {l.invoice_date} · {l.delivery_note_no}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{qty(l.invoiced)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{qty(l.onNote)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{l.counted ? qty(l.received) : <span className="text-stone-400">—</span>}</td>
                      <td className="px-3 py-3"><Badge className={KIND_STYLE[l.kind]} title={KIND_HELP[l.kind]}>{KIND_LABEL[l.kind]}</Badge></td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{l.value > 0 ? eur(l.value) : "–"}</td>
                      <td className="px-3 py-3">
                        {l.value > 0 ? (
                          <>
                            <StatusSelect value={s} onChange={(v) => change(l, v)} className="w-full" />
                            {s === "credited" && <CreditFields cur={cur} line={l} setStatus={setStatus} />}
                            {cur.requestedAt && <div className="mt-1 text-xs text-stone-500">Sent {cur.requestedAt}</div>}
                          </>
                        ) : <span className="text-xs text-stone-400">{l.kind === "over" ? "Not claimed" : ""}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="group rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              What do the labels mean?
              <Icon name="chevron" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <dl className="mt-3 space-y-2">
              {["paper", "door", "paper_and_door", "not_on_note", "over"].map((k) => (
                <div key={k} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <dt className="sm:w-32"><Badge className={KIND_STYLE[k]}>{KIND_LABEL[k]}</Badge></dt>
                  <dd className="text-stone-600">{KIND_HELP[k]}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
    </div>
  );
}
