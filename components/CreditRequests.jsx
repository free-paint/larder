import { useState } from "react";
import { draftEmail } from "@/lib/email.mjs";
import { Button, Card, EmptyState, Icon, eur } from "./ui";

function SupplierDraft({ supplier, lines, settings, setSettings, onSent }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { subject, body } = draftEmail({ supplier, lines, lang: settings.lang, site: settings.siteName, sender: settings.sender });
  const to = settings.supplierEmails?.[supplier] ?? "";
  const total = lines.reduce((a, l) => a + l.value, 0);
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <Card className="fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{supplier}</h3>
          <div className="text-sm text-stone-500">{lines.length} line{lines.length === 1 ? "" : "s"}</div>
        </div>
        <div className="text-right text-lg font-semibold tabular-nums">{eur(total)}</div>
      </div>

      <label className="mt-4 block text-xs font-medium text-stone-500">
        Send to
        <input type="email" inputMode="email" placeholder="orders@supplier.ee"
          className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-900"
          value={to} onChange={(e) => setSettings({ supplierEmails: { ...settings.supplierEmails, [supplier]: e.target.value } })} />
      </label>

      <div className="mt-3 rounded-xl bg-stone-50 ring-1 ring-stone-200">
        <div className="border-b border-stone-200 px-3 py-2 text-sm"><span className="text-stone-500">Subject:</span> {subject}</div>
        <div className="relative">
          <pre className={`whitespace-pre-wrap px-3 py-3 font-sans text-sm leading-relaxed text-stone-800 ${expanded ? "" : "max-h-40 overflow-hidden"}`}>{body}</pre>
          {!expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-xl bg-gradient-to-t from-stone-50 to-transparent" />}
        </div>
        <button onClick={() => setExpanded((x) => !x)} className="flex w-full items-center justify-center gap-1 border-t border-stone-200 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100">
          {expanded ? "Show less" : "Show full email"}
          <Icon name="chevron" className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button variant="ghost" onClick={copy}>
          <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />{copied ? "Copied" : "Copy"}
        </Button>
        <a href={mailto} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 transition-all hover:bg-stone-50 active:scale-[0.97]">
          <Icon name="mail" className="h-4 w-4" />Open in mail
        </a>
        <Button className="col-span-2 sm:ml-auto" onClick={() => onSent(supplier, lines)}>
          <Icon name="send" className="h-4 w-4" />I've sent it
        </Button>
      </div>
    </Card>
  );
}

export default function CreditRequests({ lines, statuses, settings, setSettings, markRequested, go }) {
  const open = lines.filter((l) => l.value > 0 && (statuses[l.id]?.status ?? "open") === "open");
  const groups = Object.entries(open.reduce((acc, l) => ((acc[l.supplier] ||= []).push(l), acc), {}))
    .map(([supplier, ls]) => ({ supplier, lines: ls, total: ls.reduce((a, l) => a + l.value, 0) }))
    .sort((a, b) => b.total - a.total);

  if (groups.length === 0)
    return (
      <EmptyState title="All credit requests sent"
        action={<Button onClick={() => go("lines", "requested")}>Track replies <Icon name="arrow" className="h-4 w-4" /></Button>}>
        When a supplier replies, update the line under Discrepancies: Credited with the amount, or Disputed.
      </EmptyState>
    );

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ol className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
          {["Check the draft", "Send from your mailbox", "Mark it as sent"].map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold text-white">{i + 1}</span>{t}
            </li>
          ))}
        </ol>
        <div className="inline-flex self-start rounded-xl bg-stone-100 p-1 text-sm sm:self-auto" role="group" aria-label="Email language">
          {[["et", "Eesti"], ["en", "English"]].map(([k, label]) => (
            <button key={k} onClick={() => setSettings({ lang: k })} aria-pressed={settings.lang === k}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${settings.lang === k ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>{label}</button>
          ))}
        </div>
      </Card>

      {groups.map((g) => (
        <SupplierDraft key={g.supplier} supplier={g.supplier} lines={g.lines} settings={settings} setSettings={setSettings}
          onSent={(supplier, ls) => markRequested(ls.map((l) => l.id), `${supplier}: ${ls.length} line${ls.length === 1 ? "" : "s"} marked as sent`)} />
      ))}
    </div>
  );
}
