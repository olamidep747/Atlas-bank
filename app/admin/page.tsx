"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SupportChat from "@/app/components/SupportChat";
import { Activity, ArrowDownRight, ArrowUpRight, BadgeCheck, Banknote, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, LogOut, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Users, Wallet, X } from "lucide-react";

type Account = Record<string, unknown>;
type Filter = "all" | "active" | "inactive";

const money = (value: unknown) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const field = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : fallback;

export default function AdminPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error" | "info">("info");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"add" | "deduct">("add");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { router.replace("/login"); return; }
    const { data, error } = await supabase.rpc("novexxa_admin_list_accounts");
    if (error) {
      setMessageKind("error");
      setMessage("Admin access could not be verified. Sign in with an authorized administrator account.");
      setLoading(false);
      return;
    }
    const rows = Array.isArray(data) ? data as Account[] : [];
    setAccounts(rows);
    setSelected((current) => rows.some((a) => String(a.account_number ?? "") === current) ? current : String(rows[0]?.account_number ?? ""));
    setLoading(false);
  }, [router]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);

  const filtered = useMemo(() => accounts.filter((a) => {
    const status = String(a.account_status ?? "").toLowerCase();
    const matchesFilter = filter === "all" || status === filter;
    const haystack = [a.account_number, a.display_name, a.full_name, a.contact_email, a.email, a.account_status].join(" ").toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase().trim());
  }), [accounts, filter, search]);
  const selectedAccount = accounts.find((a) => String(a.account_number ?? "") === selected);
  const total = accounts.reduce((sum, a) => sum + Number(a.account_balance ?? a.demo_balance ?? 0), 0);
  const activeCount = accounts.filter((a) => String(a.account_status ?? "").toLowerCase() === "active").length;
  const inactiveCount = accounts.filter((a) => String(a.account_status ?? "").toLowerCase() === "inactive").length;
  const selectedBalance = Number(selectedAccount?.account_balance ?? selectedAccount?.demo_balance ?? 0);
  const currency = field(selectedAccount?.currency_code, "USD");

  async function adjustBalance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!selected || !Number.isFinite(value) || value <= 0 || !reason.trim()) {
      setMessageKind("error"); setMessage("Select an account and enter a valid amount and reason."); return;
    }
    if (action === "deduct" && value > selectedBalance) {
      setMessageKind("error"); setMessage("The deduction cannot exceed the selected account's current project balance."); return;
    }
    setConfirming(true);
  }

  async function confirmAdjustment() {
    const value = Number(amount);
    setBusy(true); setConfirming(false); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("novexxa_admin_adjust_demo_balance", {
      p_account_number: selected, p_amount: value, p_action: action,
      p_reason: reason.trim(), p_account_status: null
    });
    if (error) {
      setMessageKind("error"); setMessage(error.message);
    } else {
      setMessageKind("success");
      setMessage(`${action === "add" ? "Added" : "Deducted"} ${currency} ${money(value)} for account ${selected}. The adjustment was recorded in the audit log.`);
      setAmount(""); setReason("");
      await loadAccounts();
    }
    setBusy(false);
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-900 md:flex">
      <aside className="w-full bg-[#0b1b38] p-5 text-white md:sticky md:top-0 md:flex md:min-h-screen md:w-[250px] md:shrink-0 md:flex-col md:p-6">
        <a href="/dashboard" className="flex items-center gap-3 text-lg font-extrabold tracking-wide"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300 text-xl text-[#101d3a]">A</span><span>ATLAS <span className="text-amber-300">CONTROL</span></span></a>
        <p className="mt-9 text-[10px] font-bold uppercase tracking-[.22em] text-slate-400">Workspace</p>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold"><LayoutDashboard size={17} className="text-amber-300"/> Overview</div>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300"><Users size={17}/> Customer accounts</div>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300"><Activity size={17}/> Balance activity</div>
        <div className="mt-7 rounded-xl border border-white/10 bg-white/[.04] p-4 text-xs leading-5 text-slate-300"><ShieldCheck className="mb-2 text-amber-300" size={20}/><b className="block text-white">Protected workspace</b>Administrator access is verified by Supabase. Every balance adjustment requires a reason and is audit logged.</div>
        <button onClick={signOut} className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white md:mt-auto"><LogOut size={17}/> Sign out</button>
      </aside>

      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-blue-700">ATLAS ADMINISTRATION / OVERVIEW</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102344]">Control center</h1><p className="mt-1 text-sm text-slate-500">Select a customer, inspect their account, and manage project-record balances.</p></div>
          <button onClick={() => void loadAccounts()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh data</button>
        </header>

        {message && <div role="status" className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${messageKind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : messageKind === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>{messageKind === "success" ? <CheckCircle2 size={18}/> : <ShieldCheck size={18}/>}<span className="flex-1">{message}</span><button onClick={() => setMessage("")} aria-label="Dismiss message"><X size={16}/></button></div>}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-500">Total customers <Users size={18} className="text-blue-600"/></div><p className="mt-3 text-3xl font-extrabold text-[#102344]">{loading ? "—" : accounts.length}</p><p className="mt-1 text-xs text-slate-400">Registered account records</p></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-500">Active accounts <BadgeCheck size={18} className="text-emerald-600"/></div><p className="mt-3 text-3xl font-extrabold text-emerald-700">{loading ? "—" : activeCount}</p><p className="mt-1 text-xs text-slate-400">Marked active in records</p></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-500">Inactive accounts <Clock3 size={18} className="text-amber-600"/></div><p className="mt-3 text-3xl font-extrabold text-amber-700">{loading ? "—" : inactiveCount}</p><p className="mt-1 text-xs text-slate-400">Marked inactive in records</p></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-xs font-semibold text-slate-500">Combined project balances <CircleDollarSign size={18} className="text-blue-600"/></div><p className="mt-3 text-2xl font-extrabold text-[#102344]">{loading ? "—" : total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-400">Project-record total only</p></div>
        </div>

        <div className="mt-7 grid items-start gap-6 2xl:grid-cols-[1.2fr_.8fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#102344]">Customer accounts</h2><p className="mt-1 text-xs text-slate-500">Choose any row to load its account details.</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{filtered.length} shown</span></div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input aria-label="Search accounts" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or account number" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1"><SlidersHorizontal size={15} className="mx-2 text-slate-400"/>{(["all","active","inactive"] as Filter[]).map(v=><button key={v} onClick={()=>setFilter(v)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${filter===v?"bg-white text-blue-700 shadow-sm":"text-slate-500 hover:text-slate-800"}`}>{v}</button>)}</div>
              </div>
            </div>
            {loading ? <div className="p-14 text-center text-sm text-slate-500"><RefreshCw className="mx-auto mb-3 animate-spin text-blue-600"/>Loading account records…</div> : filtered.length === 0 ? <div className="p-14 text-center"><Users className="mx-auto mb-3 text-slate-300" size={28}/><p className="text-sm font-semibold text-slate-600">No matching accounts</p><p className="mt-1 text-xs text-slate-400">Try another search or status filter.</p></div> : <div className="divide-y divide-slate-100">
              {filtered.map((a,i)=>{const number=String(a.account_number??"");const isSelected=selected===number;const status=String(a.account_status??"unknown").toLowerCase();return <button type="button" key={number||i} onClick={()=>setSelected(number)} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition sm:px-6 ${isSelected?"bg-blue-50/80 ring-1 ring-inset ring-blue-100":"hover:bg-slate-50"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${isSelected?"bg-blue-600 text-white":"bg-slate-100 text-slate-500"}`}>{String(a.display_name??a.full_name??"C").trim().slice(0,1).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{field(a.display_name??a.full_name,"Customer")}</span><span className="mt-1 block truncate text-xs text-slate-500">{field(a.contact_email??a.email,"No email")} · {number||"No account number"}</span></span>
                <span className="hidden text-right sm:block"><span className="block text-sm font-extrabold text-[#102344]">{field(a.currency_code,"USD")} {money(a.account_balance??a.demo_balance)}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${status==="active"?"bg-emerald-100 text-emerald-700": "bg-amber-100 text-amber-700"}`}>{status}</span></span>
                <ChevronRight size={17} className={isSelected?"text-blue-600":"text-slate-300"}/>
              </button>})}
            </div>}
          </section>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#102344] via-[#173b70] to-[#0759b9] p-5 text-white sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-100">Selected account</span><Wallet size={19} className="text-amber-300"/></div>
                {selectedAccount ? <><h2 className="mt-4 text-xl font-extrabold">{field(selectedAccount.display_name??selectedAccount.full_name,"Customer account")}</h2><p className="mt-1 text-xs text-blue-100">{field(selectedAccount.contact_email??selectedAccount.email,"No email address")}</p><div className="mt-5 rounded-xl border border-white/15 bg-white/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">Current project balance</p><p className="mt-1 text-3xl font-extrabold">{currency} {money(selectedBalance)}</p><p className="mt-2 text-xs text-blue-100">Account number · {selected}</p></div><div className="mt-4 flex items-center justify-between text-xs"><span className="text-blue-100">Account status</span><span className="rounded-full bg-white/15 px-3 py-1 font-bold capitalize">{field(selectedAccount.account_status,"Unknown")}</span></div></> : <p className="mt-5 text-sm text-blue-100">Select a customer from the list to see account details.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#102344]">Balance adjustment</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose an operation and review it before saving.</p></div><Banknote size={20} className="text-blue-600"/></div>
              <form onSubmit={adjustBalance} className="mt-5 space-y-4">
                <label className="block text-xs font-bold text-slate-600">Account to update<select value={selected} onChange={e=>setSelected(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option value="">Select account</option>{accounts.map((a,i)=><option key={i} value={String(a.account_number??"")}>{String(a.account_number??"Account")} · {String(a.display_name??a.contact_email??"Customer")}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setAction("add")} className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-extrabold transition ${action==="add"?"border-emerald-300 bg-emerald-50 text-emerald-800":"border-slate-100 text-slate-500 hover:border-emerald-200"}`}><ArrowUpRight size={17}/> Add funds</button><button type="button" onClick={()=>setAction("deduct")} className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-extrabold transition ${action==="deduct"?"border-rose-300 bg-rose-50 text-rose-800":"border-slate-100 text-slate-500 hover:border-rose-200"}`}><ArrowDownRight size={17}/> Deduct</button></div>
                <label className="block text-xs font-bold text-slate-600">Amount ({currency})<div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"><span className="text-sm font-bold text-slate-400">{currency}</span><input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent p-3 text-lg font-extrabold text-slate-800 outline-none" required/></div></label>
                <div className="flex flex-wrap gap-2">{[100,250,500,1000].map(v=><button key={v} type="button" onClick={()=>setAmount(String(v))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{currency} {v.toLocaleString()}</button>)}</div>
                <label className="block text-xs font-bold text-slate-600">Reason / admin note<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain why this adjustment is being made…" rows={3} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" required/></label>
                <button disabled={busy || loading || !selected || !accounts.length} className={`w-full rounded-xl p-3.5 text-sm font-extrabold text-white shadow-lg transition disabled:opacity-50 ${action==="add"?"bg-emerald-600 shadow-emerald-900/10 hover:bg-emerald-700":"bg-rose-600 shadow-rose-900/10 hover:bg-rose-700"}`}>{busy?"Saving adjustment…":`Review ${action==="add"?"addition":"deduction"}`}</button>
              </form>
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">These controls update project records only. They do not move, hold, or transfer real customer funds.</p>
            </section>
          </div>
        </div>
      </section>

      <div className="mx-4 mb-8 mt-7 w-full max-w-7xl self-center px-0 sm:mx-6 lg:mx-9"><SupportChat mode="admin"/></div>\n      {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/65 p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirming(false)}}><section role="dialog" aria-modal="true" aria-labelledby="confirm-adjustment-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-blue-700">FINAL REVIEW</p><h2 id="confirm-adjustment-title" className="mt-2 text-xl font-extrabold text-slate-900">Confirm balance change</h2></div><button onClick={()=>setConfirming(false)} aria-label="Close confirmation" className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={17}/></button></div><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Account · {selected}</p><p className={`mt-2 text-2xl font-extrabold ${action==="add"?"text-emerald-700":"text-rose-700"}`}>{action==="add"?"+":"−"}{currency} {money(amount)}</p><p className="mt-2 text-xs text-slate-600">New project balance: {currency} {money(action==="add"?selectedBalance+Number(amount):selectedBalance-Number(amount))}</p><p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">Reason: {reason}</p></div><div className="mt-5 flex gap-3"><button onClick={()=>setConfirming(false)} className="flex-1 rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-600">Go back</button><button disabled={busy} onClick={()=>void confirmAdjustment()} className={`flex-1 rounded-xl p-3 text-sm font-bold text-white disabled:opacity-50 ${action==="add"?"bg-emerald-600":"bg-rose-600"}`}>{busy?"Saving…":"Confirm & save"}</button></div></section></div>}
    </main>
  );
}
