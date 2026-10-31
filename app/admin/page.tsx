"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Activity, ArrowDownRight, ArrowUpRight, LayoutDashboard, LogOut, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";

type Account = Record<string, unknown>;

export default function AdminPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"add" | "deduct">("add");
  const [reason, setReason] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { router.replace("/login"); return; }
    const { data, error } = await supabase.rpc("novexxa_admin_list_accounts");
    if (error) {
      setMessage("Admin access could not be verified. Sign in with an authorized administrator account.");
      setLoading(false);
      return;
    }
    const rows = Array.isArray(data) ? data as Account[] : [];
    setAccounts(rows);
    if (!selected && rows.length) setSelected(String(rows[0].account_number ?? ""));
    setLoading(false);
  }, [router, selected]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);

  async function adjustBalance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!selected || !Number.isFinite(value) || value <= 0 || !reason.trim()) {
      setMessage("Choose an account and enter a positive amount and a reason.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("novexxa_admin_adjust_demo_balance", {
      p_account_number: selected,
      p_amount: value,
      p_action: action,
      p_reason: reason.trim(),
      p_account_status: null
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Project balance adjustment saved and recorded in the audit log.");
      setAmount("");
      setReason("");
      await loadAccounts();
    }
    setBusy(false);
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  const filtered = accounts.filter((a) => JSON.stringify(a).toLowerCase().includes(search.toLowerCase()));
  const total = accounts.reduce((sum, a) => sum + Number(a.account_balance ?? a.demo_balance ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-900 md:flex">
      <aside className="w-full bg-[#101d3a] p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <a href="/dashboard" className="flex items-center gap-3 text-lg font-bold tracking-wide"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300 text-xl text-[#101d3a]">A</span> ATLAS <span className="text-amber-300">CONTROL</span></a>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Workspace</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"><LayoutDashboard size={18}/> Overview</div>
        <div className="mt-3 flex items-center gap-3 px-4 py-3 text-slate-300"><Users size={18}/> Customer accounts</div>
        <div className="mt-3 flex items-center gap-3 px-4 py-3 text-slate-300"><Activity size={18}/> Balance activity</div>
        <div className="mt-12 rounded-xl border border-white/10 p-4 text-sm text-slate-300"><ShieldCheck className="mb-2 text-amber-300" size={20}/> Restricted administrator workspace. Access is checked by Supabase.</div>
        <button onClick={signOut} className="mt-8 flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white"><LogOut size={18}/> Sign out</button>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">ATLAS ADMINISTRATION</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Control center</h1><p className="mt-1 text-sm text-slate-500">Manage project accounts and review account records.</p></div>
          <button onClick={() => void loadAccounts()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm"><RefreshCw size={16}/> Refresh</button>
        </header>

        {message && <div role="status" className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{message}</div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500">Customer accounts <Users size={19}/></div><p className="mt-3 text-3xl font-bold">{accounts.length}</p></div>
          <div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between text-sm text-slate-500">Combined project balances <Activity size={19}/></div><p className="mt-3 text-3xl font-bold">{total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-500">Project-record total; not a bank-custody or payment figure.</p></div>
        </div>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.35fr_.85fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Customer accounts</h2><p className="mt-1 text-sm text-slate-500">Search and select an account record.</p></div><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input aria-label="Search accounts" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search accounts" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm sm:w-56"/></div></div>
            {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading account records…</p> : filtered.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No account records found.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><tr><th className="py-3">Account</th><th>Name / Email</th><th>Project balance</th><th>Status</th></tr></thead><tbody>{filtered.map((a,i)=><tr key={String(a.account_number ?? i)} onClick={()=>setSelected(String(a.account_number ?? ""))} className={`cursor-pointer border-b border-slate-50 hover:bg-blue-50 ${selected===String(a.account_number ?? "") ? "bg-blue-50" : ""}`}><td className="py-4 font-semibold">{String(a.account_number ?? "—")}</td><td><div className="font-medium">{String(a.display_name ?? a.full_name ?? "Customer")}</div><div className="text-xs text-slate-500">{String(a.contact_email ?? a.email ?? "")}</div></td><td>{String(a.currency_code ?? "USD")} {Number(a.account_balance ?? a.demo_balance ?? 0).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}</td><td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{String(a.account_status ?? "unknown")}</span></td></tr>)}</tbody></table></div>}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-bold">Adjust project balance</h2><p className="mt-1 text-sm text-slate-500">Changes are restricted to authorized admins and recorded with a reason.</p>
            <form onSubmit={adjustBalance} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Selected account<select value={selected} onChange={e=>setSelected(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">{accounts.map((a,i)=><option key={i} value={String(a.account_number ?? "")}>{String(a.account_number ?? "Account")} · {String(a.display_name ?? a.contact_email ?? "Customer")}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setAction("add")} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${action==="add"?"border-emerald-300 bg-emerald-50 text-emerald-800":"border-slate-200"}`}><ArrowUpRight size={16}/> Add</button><button type="button" onClick={()=>setAction("deduct")} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${action==="deduct"?"border-rose-300 bg-rose-50 text-rose-800":"border-slate-200"}`}><ArrowDownRight size={16}/> Deduct</button></div>
              <label className="block text-sm font-medium">Amount<input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="mt-2 w-full rounded-xl border border-slate-200 p-3" required/></label>
              <label className="block text-sm font-medium">Reason for adjustment<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Enter a clear reason for this project-record change" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3" required/></label>
              <button disabled={busy || loading || !accounts.length} className="w-full rounded-xl bg-[#15264b] p-3.5 font-semibold text-white disabled:opacity-50">{busy ? "Saving adjustment…" : "Save adjustment"}</button>
            </form>
            <p className="mt-4 text-xs leading-5 text-slate-500">These controls update project records only. They do not move, hold, or transfer real customer funds.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
