export const eur = (n) => new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(n || 0);
export const pct = (n) => (n === null || n === undefined ? "–" : `${Math.round(n * 100)}%`);
export const qty = (n) => (n === null || n === undefined ? "–" : String(Math.round(n * 100) / 100).replace(".", ","));

export const KIND_LABEL = {
  paper: "On paper",
  door: "At the door",
  paper_and_door: "Paper + door",
  not_on_note: "Not on note",
  over: "Over-delivered",
  ok: "Matches",
};
export const KIND_HELP = {
  paper: "The invoice is higher than the signed delivery note.",
  door: "The signed note matches the invoice, but staff counted less on arrival.",
  paper_and_door: "The invoice is above the note, and less arrived than the note says.",
  not_on_note: "Invoiced, but the item is not on any delivery note.",
  over: "More arrived than was invoiced. Not claimed.",
  ok: "Invoice, note and count all agree.",
};
export const KIND_STYLE = {
  paper: "bg-stone-100 text-stone-700",
  door: "bg-amber-100 text-amber-800",
  paper_and_door: "bg-orange-100 text-orange-800",
  not_on_note: "bg-violet-100 text-violet-800",
  over: "bg-sky-100 text-sky-800",
  ok: "bg-emerald-50 text-emerald-700",
};

export const STATUS = ["open", "requested", "credited", "disputed", "written_off"];
export const STATUS_LABEL = { open: "Open", requested: "Requested", credited: "Credited", disputed: "Disputed", written_off: "Written off" };
export const STATUS_STYLE = {
  open: "bg-amber-100 text-amber-900 ring-amber-200",
  requested: "bg-blue-100 text-blue-900 ring-blue-200",
  credited: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  disputed: "bg-rose-100 text-rose-900 ring-rose-200",
  written_off: "bg-stone-200 text-stone-700 ring-stone-300",
};

export function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    chart: <path d="M4 20V11M10 20V5M16 20v-6M21 20H3" />,
    list: <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
    upload: <path d="M12 15V4m0 0-4 4m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />,
    download: <path d="M12 4v11m0 0-4-4m4 4 4-4M4 20h16" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function Card({ children, className = "", ...p }) {
  return <div className={`rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5 ${className}`} {...p}>{children}</div>;
}

export function Badge({ children, className = "", title }) {
  return <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export function Button({ children, variant = "primary", size = "md", className = "", ...p }) {
  const v = {
    primary: "bg-stone-900 text-white hover:bg-stone-700 shadow-sm",
    ghost: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    subtle: "text-stone-700 hover:bg-stone-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }[variant];
  const s = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm" }[size];
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${v} ${s} ${className}`} {...p}>
      {children}
    </button>
  );
}

export function StatusSelect({ value, onChange, className = "" }) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <select
        aria-label="Status"
        className={`w-full cursor-pointer appearance-none rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-semibold ring-1 transition-colors ${STATUS_STYLE[value]}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {STATUS.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
    </div>
  );
}

export function EmptyState({ icon = "check", title, children, action }) {
  return (
    <Card className="flex flex-col items-center py-10 text-center">
      <div className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-700"><Icon name={icon} className="h-6 w-6" /></div>
      <div className="font-semibold">{title}</div>
      {children && <p className="mt-1 max-w-md text-sm text-stone-600">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
