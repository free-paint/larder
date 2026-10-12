import { useState } from "react";
import { draftEmail } from "@/lib/email.mjs";
import { Button, Card, eur } from "./ui";

export default function CreditRequests({ lines, statuses, settings, setSettings, markRequested }) {
  const [copied, setCopied] = useState(null);
  const open = lines.filter((l) => l.value > 0 && (statuses[l.id]?.status ?? "open") === "open");
  const bySupplier = Object.entries(open.reduce((acc, l) => ((acc[l.supplier] ||= []).push(l), acc), {}))
    .sort((a, b) => b[1].reduce((x, l) => x + l.value, 0) - a[1].reduce((x, l) => x + l.value, 0));

  if (bySupplier.length === 0)
    return <Card><p className="text-stone-600">No open lines. Every claim has been requested, credited, disputed or written off.</p></Card>;

  const copy = async (key, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-stone-600">Language:</span>
        {[["et", "Eesti"], ["en", "English"]].map(([k, label]) => (
          <button key={k} onClick={() => setSettings({ lang: k })}
            className={`rounded-lg px-3 py-1 ${settings.lang === k ? "bg-stone-900 text-white" : "border border-stone-300 bg-white"}`}>{label}</button>
        ))}
        <span className="text-stone-500">Review each draft, send it from your own mailbox, then mark it as sent.</span>
      </div>

      {bySupplier.map(([supplier, ls]) => {
        const { subject, body } = draftEmail({ supplier, lines: ls, lang: settings.lang, site: settings.siteName, sender: settings.sender });
        const to = settings.supplierEmails?.[supplier] ?? "";
        const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return (
          <Card key={supplier}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{supplier}</h3>
              <div className="text-sm text-stone-600">{ls.length} lines · <span className="font-medium text-stone-900">{eur(ls.reduce((a, l) => a + l.value, 0))}</span></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-stone-500">To:</span>
              <input className="flex-1 rounded border border-stone-300 px-2 py-1" placeholder="supplier@example.ee"
                value={to} onChange={(e) => setSettings({ supplierEmails: { ...settings.supplierEmails, [supplier]: e.target.value } })} />
            </div>
            <div className="mt-2 text-sm"><span className="text-stone-500">Subject:</span> {subject}</div>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 font-sans text-sm">{body}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => copy(supplier, `${subject}\n\n${body}`)}>{copied === supplier ? "Copied ✓" : "Copy email"}</Button>
              <a href={mailto} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-100">Open in mail app</a>
              <Button onClick={() => markRequested(ls.map((l) => l.id))}>Mark {ls.length} lines as sent</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
