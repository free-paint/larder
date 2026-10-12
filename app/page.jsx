"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { reconcile, summarize } from "@/lib/reconcile.mjs";
import Overview from "@/components/Overview";
import Discrepancies from "@/components/Discrepancies";
import CreditRequests from "@/components/CreditRequests";
import DataPanel from "@/components/DataPanel";
import { Icon } from "@/components/ui";

const KEY = "larder-v1";
const EMPTY = { invoices: [], deliveries: [], isSample: false };
const DEFAULT_SETTINGS = { siteName: "Pilot site", sender: "", totalSites: 9, monthlyFee: 1500, lang: "et", supplierEmails: {} };
const TABS = [
  { key: "overview", label: "Overview", short: "Overview", icon: "chart" },
  { key: "lines", label: "Discrepancies", short: "Lines", icon: "list" },
  { key: "requests", label: "Credit requests", short: "Requests", icon: "mail" },
  { key: "data", label: "Data & settings", short: "Data", icon: "upload" },
];

const fetchCsv = async (url) => Papa.parse((await (await fetch(url)).text()).trim(), { header: true, skipEmptyLines: true }).data;

function Toast({ toast, onUndo, onClose }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6" role="status" aria-live="polite">
      <div key={toast.id} className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-stone-900 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg">
        <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="flex-1">{toast.text}</span>
        {toast.undo && <button onClick={onUndo} className="rounded-lg px-2.5 py-1 font-semibold text-amber-300 hover:bg-white/10">Undo</button>}
        <button onClick={onClose} aria-label="Dismiss" className="rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white"><Icon name="x" className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState("overview");
  const [linesFilter, setLinesFilter] = useState("all");
  const [data, setData] = useState(EMPTY);
  const [statuses, setStatuses] = useState({});
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = (text, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, undo });
    toastTimer.current = setTimeout(() => setToast(null), undo ? 6000 : 3000);
  };

  const loadSample = async () => {
    const [invoices, deliveries] = await Promise.all([fetchCsv("/sample/invoices.csv"), fetchCsv("/sample/deliveries.csv")]);
    setData({ invoices, deliveries, isSample: true });
    setStatuses({});
  };

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    if (saved?.data?.invoices?.length) {
      setData(saved.data); setStatuses(saved.statuses || {}); setSettingsRaw({ ...DEFAULT_SETTINGS, ...saved.settings });
      setReady(true);
    } else {
      loadSample().finally(() => setReady(true));
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ data, statuses, settings })); } catch {}
  }, [data, statuses, settings, ready]);

  const lines = useMemo(() => reconcile(data.invoices, data.deliveries), [data]);
  const months = useMemo(() => Math.max(1, new Set(data.invoices.map((r) => String(r.invoice_date || "").slice(0, 7)).filter(Boolean)).size), [data]);
  const s = useMemo(() => summarize(lines, statuses, { months, totalSites: settings.totalSites, monthlyFee: settings.monthlyFee }), [lines, statuses, months, settings]);
  const bySupplier = useMemo(() => {
    const m = {};
    for (const l of lines) if (l.value > 0) { m[l.supplier] ||= { supplier: l.supplier, value: 0, lines: 0 }; m[l.supplier].value += l.value; m[l.supplier].lines++; }
    return Object.values(m).sort((a, b) => b.value - a.value);
  }, [lines]);

  const setSettings = (patch) => setSettingsRaw((x) => ({ ...x, ...patch }));
  const setStatus = (id, patch) => setStatuses((x) => {
    const next = { ...(x[id] ?? { status: "open" }), ...patch };
    if (patch.status === "requested" && !next.requestedAt) next.requestedAt = new Date().toISOString().slice(0, 10);
    return { ...x, [id]: next };
  });
  const markRequested = (ids, text) => {
    const before = statuses;
    const today = new Date().toISOString().slice(0, 10);
    setStatuses((x) => {
      const n = { ...x };
      for (const id of ids) n[id] = { ...(x[id] ?? {}), status: "requested", requestedAt: x[id]?.requestedAt ?? today };
      return n;
    });
    notify(text, () => setStatuses(before));
  };
  const reset = () => { setData(EMPTY); setStatuses({}); setSettingsRaw(DEFAULT_SETTINGS); };
  const go = (t, filter = "all") => {
    setLinesFilter(filter);
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f6f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-sm font-bold text-white">L</span>
              <h1 className="font-semibold">Larder <span className="font-normal text-stone-500">· Delivery check</span></h1>
            </div>
          </div>
          <nav className="ml-auto hidden gap-1 md:flex" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => go(t.key)} aria-current={tab === t.key ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"}`}>
                {t.label}
                {t.key === "requests" && s.byStatus.open > 0 && (
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === t.key ? "bg-white/20" : "bg-amber-200 text-amber-900"}`}>{s.byStatus.open}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {tab === "overview" && (
          <p className="mb-4 max-w-2xl text-sm text-stone-600">
            Match what suppliers <b className="font-medium text-stone-800">invoiced</b> against what <b className="font-medium text-stone-800">actually arrived</b>, then ask for the difference back.
          </p>
        )}

        {data.isSample && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This is a <b>fictional sample month</b>: one site, {data.invoices.length} invoice lines, five made-up suppliers.{" "}
              <button className="font-medium underline underline-offset-2" onClick={() => go("data")}>Use your own data</button>
            </span>
          </div>
        )}

        {!ready ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-32 animate-pulse rounded-2xl bg-stone-200/70" />
            <div className="h-48 animate-pulse rounded-2xl bg-stone-200/50" />
          </div>
        ) : (
          <div key={tab} className="fade-up">
            {tab === "overview" && <Overview s={s} settings={settings} bySupplier={bySupplier} go={go} />}
            {tab === "lines" && <Discrepancies key={linesFilter} lines={lines} statuses={statuses} setStatus={setStatus} initialStatus={linesFilter} />}
            {tab === "requests" && <CreditRequests lines={lines} statuses={statuses} settings={settings} setSettings={setSettings} markRequested={markRequested} go={go} />}
            {tab === "data" && <DataPanel data={data} setData={setData} lines={lines} statuses={statuses} settings={settings} setSettings={setSettings} loadSample={loadSample} reset={reset} notify={notify} />}
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Sections">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => go(t.key)} aria-current={tab === t.key ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${tab === t.key ? "text-stone-900" : "text-stone-400"}`}>
              <Icon name={t.icon} className="h-5 w-5" />
              {t.short}
              {t.key === "requests" && s.byStatus.open > 0 && (
                <span className="absolute right-[calc(50%-20px)] top-1.5 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-4 text-white">{s.byStatus.open}</span>
              )}
              {tab === t.key && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-stone-900" />}
            </button>
          ))}
        </div>
      </nav>

      <Toast toast={toast} onUndo={() => { toast?.undo?.(); setToast(null); }} onClose={() => setToast(null)} />
    </div>
  );
}
