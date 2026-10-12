"use client";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { reconcile, summarize } from "@/lib/reconcile.mjs";
import Overview from "@/components/Overview";
import Discrepancies from "@/components/Discrepancies";
import CreditRequests from "@/components/CreditRequests";
import DataPanel from "@/components/DataPanel";

const KEY = "larder-v1";
const EMPTY = { invoices: [], deliveries: [], isSample: false };
const DEFAULT_SETTINGS = { siteName: "Pilot site", sender: "", totalSites: 9, monthlyFee: 1500, lang: "et", supplierEmails: {} };
const TABS = [["overview", "Overview"], ["lines", "Discrepancies"], ["requests", "Credit requests"], ["data", "Data & settings"]];

const fetchCsv = async (url) => Papa.parse((await (await fetch(url)).text()).trim(), { header: true, skipEmptyLines: true }).data;

export default function Home() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(EMPTY);
  const [statuses, setStatuses] = useState({});
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

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

  const setSettings = (patch) => setSettingsRaw((x) => ({ ...x, ...patch }));
  const setStatus = (id, patch) => setStatuses((x) => {
    const next = { ...(x[id] ?? { status: "open" }), ...patch };
    if (patch.status === "requested" && !next.requestedAt) next.requestedAt = new Date().toISOString().slice(0, 10);
    return { ...x, [id]: next };
  });
  const markRequested = (ids) => ids.forEach((id) => setStatus(id, { status: "requested" }));
  const reset = () => { setData(EMPTY); setStatuses({}); setSettingsRaw(DEFAULT_SETTINGS); };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Larder · Delivery check</h1>
        <p className="text-sm text-stone-600">
          Match what suppliers invoiced against what actually arrived, then ask for the difference back.
        </p>
      </header>

      {data.isSample && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You're looking at a <b>fictional sample month</b> for one site ({data.invoices.length} invoice lines, five made-up suppliers).
          To use your own data, go to <button className="underline" onClick={() => setTab("data")}>Data & settings</button>.
        </div>
      )}

      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
            {label}{k === "requests" && s.byStatus.open > 0 ? ` (${s.byStatus.open})` : ""}
          </button>
        ))}
      </nav>

      {!ready ? <p className="text-stone-500">Loading…</p> : (
        <>
          {tab === "overview" && <Overview s={s} settings={settings} />}
          {tab === "lines" && <Discrepancies lines={lines} statuses={statuses} setStatus={setStatus} />}
          {tab === "requests" && <CreditRequests lines={lines} statuses={statuses} settings={settings} setSettings={setSettings} markRequested={markRequested} />}
          {tab === "data" && <DataPanel data={data} setData={setData} lines={lines} statuses={statuses} settings={settings} setSettings={setSettings} loadSample={loadSample} reset={reset} />}
        </>
      )}
    </main>
  );
}
