import { Card, Stat, eur, pct } from "./ui";

function Check({ ok, title, detail, pending }) {
  const tone = pending ? "border-stone-200 bg-stone-50" : ok ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50";
  const mark = pending ? "…" : ok ? "✓" : "✗";
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-6">{mark}</span>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-stone-600">{detail}</div>
        </div>
      </div>
    </div>
  );
}

export default function Overview({ s, settings }) {
  const groupMonthly = s.foundPerSiteMonth * settings.totalSites;
  const doorShare = s.found ? s.door / s.found : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Money found" value={eur(s.found)} sub={`${s.claimLines} of ${s.linesChecked} lines`} />
        <Stat label="Requested" value={eur(s.requested)} sub={`${s.byStatus.requested + s.byStatus.credited + s.byStatus.disputed} lines sent`} />
        <Stat label="Credited back" value={eur(s.credited)} sub={`Recovery ${pct(s.recoveryRate)} of requested`} />
        <Stat label="Still open" value={s.byStatus.open} sub="lines not yet requested" />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Pilot bar (from the Decision Memo)</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Check
            pending={s.recoveryRate === null}
            ok={s.recoveryRate >= 0.3}
            title="Suppliers pay back ≥ 30%"
            detail={s.recoveryRate === null ? "Nothing requested yet. Send the drafts under Credit requests." : `${pct(s.recoveryRate)} of requested value has been credited.`}
          />
          <Check
            ok={s.foundPerSiteMonth >= s.breakEvenPerSiteMonth}
            title={`Shortfall ≥ ${eur(s.breakEvenPerSiteMonth)} per site / month`}
            detail={`This site: ${eur(s.foundPerSiteMonth)} / month. Across ${settings.totalSites} sites ≈ ${eur(groupMonthly)} vs a ${eur(settings.monthlyFee)} fee.`}
          />
          <Check
            pending={s.captureRate === null}
            ok={s.captureRate >= 0.7}
            title="Staff count ≥ 70% of deliveries"
            detail={`Counted quantities on ${pct(s.captureRate)} of delivery lines.`}
          />
        </div>
      </div>

      <Card>
        <h2 className="font-semibold">Where the money goes missing</h2>
        <p className="mt-1 text-sm text-stone-600">
          "On paper" can be found from documents alone. "At the door" is only found if someone counts what arrives, because the signed note hides it.
        </p>
        <div className="mt-4 flex h-6 w-full overflow-hidden rounded-full bg-stone-100">
          {s.found > 0 && (
            <>
              <div className="bg-stone-700" style={{ width: `${(s.paper / s.found) * 100}%` }} />
              <div className="bg-amber-500" style={{ width: `${(s.door / s.found) * 100}%` }} />
            </>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-stone-700 align-middle" />On paper: {eur(s.paper)}</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm bg-amber-500 align-middle" />At the door: {eur(s.door)} ({pct(doorShare)})</span>
        </div>
      </Card>
    </div>
  );
}
