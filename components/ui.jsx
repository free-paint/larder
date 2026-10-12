export const eur = (n) => new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(n || 0);
export const pct = (n) => (n === null || n === undefined ? "–" : `${Math.round(n * 100)}%`);

export const KIND_LABEL = {
  paper: "On paper",
  door: "At the door",
  paper_and_door: "Paper + door",
  not_on_note: "Not on note",
  over: "Over-delivered",
  ok: "OK",
};
export const KIND_HELP = {
  paper: "Invoice is higher than the signed delivery note.",
  door: "Signed note matches the invoice, but staff counted less on arrival.",
  paper_and_door: "Both: invoice above the note, and less arrived than the note says.",
  not_on_note: "Invoiced, but the item is not on any delivery note.",
  over: "More arrived than invoiced. Not claimed.",
};
export const STATUS = ["open", "requested", "credited", "disputed", "written_off"];
export const STATUS_LABEL = { open: "Open", requested: "Requested", credited: "Credited", disputed: "Disputed", written_off: "Written off" };
export const STATUS_STYLE = {
  open: "bg-amber-100 text-amber-900",
  requested: "bg-blue-100 text-blue-900",
  credited: "bg-emerald-100 text-emerald-900",
  disputed: "bg-rose-100 text-rose-900",
  written_off: "bg-stone-200 text-stone-700",
};

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-stone-200 bg-white p-4 ${className}`}>{children}</div>;
}

export function Stat({ label, value, sub }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-sm text-stone-500">{sub}</div>}
    </Card>
  );
}

export function Button({ children, variant = "primary", className = "", ...p }) {
  const v = {
    primary: "bg-stone-900 text-white hover:bg-stone-700",
    ghost: "border border-stone-300 bg-white hover:bg-stone-100",
  }[variant];
  return <button className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${v} ${className}`} {...p}>{children}</button>;
}
