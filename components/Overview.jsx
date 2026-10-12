import { Button, Card, Icon, eur, pct } from "./ui";

function NextStep({ s, go }) {
  let title, body, action;
  if (s.claimLines === 0) {
    title = "No discrepancies found";
    body = "Every invoice line matches what arrived. Load another month under Data to keep checking.";
    action = <Button onClick={() => go("data")}>Go to Data <Icon name="arrow" className="h-4 w-4" /></Button>;
  } else if (s.byStatus.open > 0) {
    title = `${s.byStatus.open} line${s.byStatus.open === 1 ? "" : "s"} worth ${eur(s.openValue)} not yet claimed`;
    body = "Each supplier gets one draft email listing exactly what was short. Review it, send it from your own mailbox, then mark it as sent.";
    action = <Button onClick={() => go("requests")}>Draft credit requests <Icon name="arrow" className="h-4 w-4" /></Button>;
  } else if (s.byStatus.requested > 0) {
    title = `Waiting on suppliers for ${s.byStatus.requested} line${s.byStatus.requested === 1 ? "" : "s"}`;
    body = "When a credit note arrives, mark the line as Credited and enter the amount. If a supplier says no, mark it Disputed.";
    action = <Button onClick={() => go("lines", "requested")}>Update replies <Icon name="arrow" className="h-4 w-4" /></Button>;
  } else {
    title = "Every claim has an answer";
    body = "Download the month-end file and hand it to accounting.";
    action = <Button onClick={() => go("data")}>Month-end export <Icon name="arrow" className="h-4 w-4" /></Button>;
  }
  return (
    <div className="rounded-2xl bg-stone-900 p-5 text-white shadow-sm sm:p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-stone-400">Next step</div>
      <div className="mt-1 text-lg font-semibold sm:text-xl">{title}</div>
      <p className="mt-1 max-w-2xl text-sm text-stone-300">{body}</p>
      <div className="mt-4 [&_button]:bg-white [&_button]:text-stone-900 [&_button:hover]:bg-stone-200">{action}</div>
    </div>
  );
}

function Funnel({ s }) {
  const rows = [
    { label: "Found", value: s.found, color: "bg-stone-800", note: `${s.claimLines} of ${s.linesChecked} lines` },
    { label: "Requested", value: s.requested, color: "bg-blue-500", note: `${s.byStatus.requested + s.byStatus.credited + s.byStatus.disputed} lines sent` },
    { label: "Credited back", value: s.credited, color: "bg-emerald-500", note: s.recoveryRate === null ? "nothing requested yet" : `${pct(s.recoveryRate)} of requested` },
  ];
  return (
    <Card>
      <h2 className="font-semibold">Money found → requested → back</h2>
      <div className="mt-4 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-stone-600">{r.label}</span>
              <span className="text-lg font-semibold tabular-nums">{eur(r.value)}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full ${r.color} transition-[width] duration-500 ease-out`} style={{ width: `${s.found ? Math.max(r.value ? 2 : 0, (r.value / s.found) * 100) : 0}%` }} />
            </div>
            <div className="mt-1 text-xs text-stone-500">{r.note}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Check({ state, title, detail }) {
  const tone = { pass: "border-emerald-200 bg-emerald-50/60", fail: "border-rose-200 bg-rose-50/60", wait: "border-stone-200 bg-white" }[state];
  const pill = { pass: "bg-emerald-600 text-white", fail: "bg-rose-600 text-white", wait: "bg-stone-200 text-stone-700" }[state];
  const label = { pass: "Passing", fail: "Failing", wait: "Waiting" }[state];
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium leading-snug">{title}</div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${pill}`}>{label}</span>
      </div>
      <div className="mt-1.5 text-sm text-stone-600">{detail}</div>
    </div>
  );
}

export default function Overview({ s, settings, bySupplier, go }) {
  const groupMonthly = s.foundPerSiteMonth * settings.totalSites;
  const maxSupplier = Math.max(1, ...bySupplier.map((x) => x.value));
  return (
    <div className="space-y-5">
      <NextStep s={s} go={go} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Funnel s={s} />
        <Card>
          <h2 className="font-semibold">Where the money goes missing</h2>
          <p className="mt-1 text-sm text-stone-600">
            <b className="font-medium text-stone-800">On paper</b> shows up in the documents. <b className="font-medium text-stone-800">At the door</b> is only caught if someone counts what arrives.
          </p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-stone-100">
            {s.found > 0 && (
              <>
                <div className="bg-stone-700 transition-[width] duration-500" style={{ width: `${(s.paper / s.found) * 100}%` }} />
                <div className="bg-amber-500 transition-[width] duration-500" style={{ width: `${(s.door / s.found) * 100}%` }} />
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-stone-700" />On paper <b className="tabular-nums">{eur(s.paper)}</b></span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-500" />At the door <b className="tabular-nums">{eur(s.door)}</b></span>
          </div>

          <h3 className="mt-6 text-sm font-semibold">By supplier</h3>
          <ul className="mt-2 space-y-2">
            {bySupplier.map((x) => (
              <li key={x.supplier}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{x.supplier}</span>
                  <span className="shrink-0 tabular-nums text-stone-700">{eur(x.value)} <span className="text-stone-400">· {x.lines}</span></span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-stone-400" style={{ width: `${(x.value / maxSupplier) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Pilot bar</h2>
          <span className="text-xs text-stone-500">Kill criteria from the Decision Memo</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Check
            state={s.recoveryRate === null ? "wait" : s.recoveryRate >= 0.3 ? "pass" : "fail"}
            title="Suppliers pay back at least 30%"
            detail={s.recoveryRate === null ? "Nothing requested yet." : `${pct(s.recoveryRate)} of the requested value has been credited.`}
          />
          <Check
            state={s.foundPerSiteMonth >= s.breakEvenPerSiteMonth ? "pass" : "fail"}
            title={`Shortfall covers the fee (${eur(s.breakEvenPerSiteMonth)} per site / month)`}
            detail={`This site: ${eur(s.foundPerSiteMonth)} a month. Across ${settings.totalSites} sites ≈ ${eur(groupMonthly)}, against a ${eur(settings.monthlyFee)} fee.`}
          />
          <Check
            state={s.captureRate === null ? "wait" : s.captureRate >= 0.7 ? "pass" : "fail"}
            title="Staff count at least 70% of deliveries"
            detail={`Counted quantities on ${pct(s.captureRate)} of delivery-note lines.`}
          />
        </div>
      </section>
    </div>
  );
}
