"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CreditCard,
  Headphones, Home, LogOut, Menu, Settings, ShieldCheck, Wallet, X, Banknote, LayoutGrid, Copy, Check
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SupportChat from "@/app/components/SupportChat";

type AccountActivity = { id: string; transaction_type: string; amount: number | string; currency_code: string; status: string; description: string | null; reference_code: string | null; sender_name: string | null; recipient_name: string | null; reason_category: string | null; created_at: string; is_project_adjustment: boolean };
const formatAmount = (value: number | string) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountCopied, setAccountCopied] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const normalizedCurrency = String(currency ?? "USD").trim().toUpperCase();
  const currencyDisplay = normalizedCurrency === "EUR" ? "€" : normalizedCurrency;
  const [activeAction, setActiveAction] = useState<"withdraw" | "transfer" | "deposit" | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let alive = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!alive) return;
      if (error || !data.session) {
        router.replace("/login");
        return;
      }
      const user = data.session.user;
      const fullName = user.user_metadata?.full_name;
      setName(typeof fullName === "string" && fullName.trim() ? fullName.trim().split(" ")[0] : "there");
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("novexxa_profiles")
        .select("account_number, demo_balance, currency_code, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (profile) {
        setAccountNumber(profile.account_number ?? "");
        setBalance(Number(profile.demo_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setCurrency(profile.currency_code ?? "USD");
        if (profile.display_name) setName(String(profile.display_name).trim().split(" ")[0]);
      }
      const { data: activityRows, error: activityError } = await supabase
        .from("novexxa_transactions")
        .select("id, transaction_type, amount, currency_code, status, description, reference_code, sender_name, recipient_name, reason_category, created_at, is_project_adjustment")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (alive) {
        if (!activityError) setActivities((activityRows ?? []) as AccountActivity[]);
        setActivityLoading(false);
      }
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  async function copyAccountNumber() {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setAccountCopied(true);
      window.setTimeout(() => setAccountCopied(false), 2000);
    } catch {
      setAccountCopied(false);
    }
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return <main className="atlas-dashboard-loading"><span className="atlas-spinner"/> Securing your session…</main>;
  }

  return (
    <main className="atlas-dashboard">
      <aside className={`atlas-side-nav ${menuOpen ? "is-open" : ""}`}>
        <a className="atlas-dash-brand" href="/"><span className="atlas-dash-mark">A</span><span>ATLAS<span>BANK</span></span></a>
        <div className="atlas-nav-label">YOUR BANK</div>
        <a className="atlas-nav-link active" href="/dashboard"><Home size={18}/> Overview</a>
        <a className="atlas-nav-link" href="#cards"><CreditCard size={18}/> Cards</a>
        <div className="atlas-nav-label atlas-nav-label-spaced">PERSONAL</div>
        <button type="button" className="atlas-nav-link atlas-nav-link-button" onClick={() => window.dispatchEvent(new Event("atlas-open-support"))}><Headphones size={18}/> Support</button>
        <a className="atlas-nav-link" href="#settings"><Settings size={18}/> Settings</a>
        <div className="atlas-side-bottom"><div className="atlas-side-security"><ShieldCheck size={18}/><span><b>Your security matters</b><small>Keep your sign-in details private.</small></span></div><button className="atlas-nav-link atlas-signout" onClick={signOut}><LogOut size={18}/> Sign out</button></div>
      </aside>
      {menuOpen && <button className="atlas-dash-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
      <section className="atlas-dash-main">
        <header className="atlas-dash-header">
          <button className="atlas-dash-menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
          <div><span className="atlas-dash-overline">PERSONAL BANKING</span><h1>Account overview</h1></div>
          <div className="atlas-dash-header-right"><button className="atlas-notification" aria-label="Notifications"><Bell size={19}/></button><div className="atlas-user-chip"><span>{name.slice(0,1).toUpperCase()}</span><div><b>{name}</b><small>{email}</small></div><ChevronDown size={15}/></div></div>
        </header>

        <div className="atlas-dash-welcome"><div><p>YOUR ACCOUNT, AT A GLANCE</p><h2>Welcome back, {name}.</h2><span>Here’s your financial overview.</span></div><div className="atlas-dash-date"><ShieldCheck size={16}/> Secure session</div></div>

        <section className="atlas-savings-card" id="accounts">
          <div className="atlas-savings-card-top"><div className="atlas-savings-icon"><Wallet size={21}/></div><span className="atlas-account-status"><i/> ACCOUNT OVERVIEW</span></div>
          <div className="atlas-savings-label">Savings Account</div>
          <div className="atlas-savings-currency">{currencyDisplay} <span>· {normalizedCurrency === "EUR" ? "Euro" : normalizedCurrency === "USD" ? "US Dollar" : normalizedCurrency} account</span></div>
          <div className="atlas-savings-divider"/>
          <div className="atlas-savings-bottom"><div><small>Account balance</small><strong>{currencyDisplay} {balance}</strong></div><div><small>Account number</small>{accountNumber ? <button type="button" className="atlas-copy-account-number" onClick={copyAccountNumber} aria-label="Copy account number"><strong>{accountNumber}</strong>{accountCopied ? <Check size={15}/> : <Copy size={15}/>}<span>{accountCopied ? "Copied" : "Tap to copy"}</span></button> : <strong>Being assigned</strong>}</div><div className="atlas-savings-account"><small>Account holder</small><strong>{name}</strong></div></div>
          <div className="atlas-savings-footnote">Your account number is permanently assigned and linked to your profile.</div>
        </section>

        {activeAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveAction(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">ATLAS ACCOUNT SERVICES</p><h2 id="action-dialog-title" className="mt-2 text-2xl font-bold text-slate-900">{activeAction === "withdraw" ? "Withdraw funds" : activeAction === "transfer" ? "Transfer funds" : "Deposit funds"}</h2></div>
                <button type="button" onClick={() => setActiveAction(null)} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={19}/></button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeAction === "withdraw" ? "The withdrawal area is ready to be configured. We’ll add the destination and verification steps next." : activeAction === "transfer" ? "The transfer area is ready to be configured. We’ll add recipient details and confirmation steps next." : "The deposit area is ready to be configured. We’ll add the available funding methods next."}</p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current account</div><div className="mt-1 font-semibold text-slate-900">{currencyDisplay} {balance}</div><div className="mt-1 text-xs text-slate-500">Account {accountNumber || "number pending"}</div></div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">This is an interface preview. No deposit, withdrawal, or transfer will be submitted or processed from this screen yet.</div>
              <button type="button" onClick={() => setActiveAction(null)} className="mt-5 w-full rounded-xl bg-[#15264b] px-4 py-3 font-semibold text-white hover:bg-[#20365f]">Close</button>
            </section>
          </div>
        )}

        <section className="atlas-dash-lower"><div className="atlas-dash-panel"><div className="atlas-dash-section-heading"><div><span>RECENT ACTIVITY</span><h3>Transaction history</h3></div><span className="text-[10px] font-semibold text-slate-400">LATEST 20</span></div>
          {activityLoading ? <div className="p-6 text-sm text-slate-500">Loading account activity…</div> : activities.length === 0 ? <div className="atlas-empty-state"><span><Wallet size={22}/></span><b>No transactions yet</b><p>Your recorded account activity will appear here.</p></div> : <div className="divide-y divide-slate-100">{activities.map(item => { const incoming = ["credit","deposit","deposit_demo","incoming","money_received"].includes(String(item.transaction_type).toLowerCase()); const symbol = String(item.currency_code ?? currency).toUpperCase() === "EUR" ? "€" : String(item.currency_code ?? currency).toUpperCase(); return <article key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${incoming ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{incoming ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}</span><div className="min-w-0"><b className="block truncate text-sm text-slate-800">{item.reason_category || (incoming ? "Money received" : "Money sent")}</b><p className="mt-1 text-xs text-slate-500">{incoming ? `Credited by: ${item.sender_name || "Name not provided"}` : `To: ${item.recipient_name || "Recipient not provided"}`}</p>{item.description && <p className="mt-1 break-words text-xs leading-5 text-slate-500">{item.description}</p>}<p className="mt-1 text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString()} · Ref {item.reference_code || "—"}</p>{item.is_project_adjustment && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-800">Recorded project activity</span>}</div></div><div className="shrink-0 sm:text-right"><b className={`text-sm font-extrabold ${incoming ? "text-emerald-700" : "text-slate-800"}`}>{incoming ? "+" : "−"}{symbol} {formatAmount(item.amount)}</b><p className="mt-1 text-[10px] capitalize text-slate-400">{String(item.status || "recorded").replaceAll("_"," ")}</p></div></article>})}</div>}
          </div><button type="button" onClick={() => window.dispatchEvent(new Event("atlas-open-support"))} className="flex min-h-[180px] flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Headphones size={22}/></span><b className="text-lg text-[#102344]">Need help?</b><p className="mt-1 text-sm text-slate-500">Open your private ATLAS support conversation.</p><span className="mt-4 text-sm font-bold text-blue-700">Open live support →</span></button></section>
        <nav className={`atlas-mobile-bottom-nav ${accountMenuOpen ? "has-account-menu" : ""}`} aria-label="Main navigation">
          <a className="is-active" href="/dashboard"><span><Home size={19}/></span><small>Home</small></a>
          <div className="atlas-mobile-account-slot">
            {accountMenuOpen && <div className="atlas-mobile-account-options">
              <button type="button" onClick={() => { setActiveAction("withdraw"); setAccountMenuOpen(false); }}><Banknote size={17}/> Withdraw</button>
              <button type="button" onClick={() => { setActiveAction("deposit"); setAccountMenuOpen(false); }}><ArrowDownLeft size={17}/> Deposit</button>
              <button type="button" onClick={() => { setActiveAction("transfer"); setAccountMenuOpen(false); }}><ArrowUpRight size={17}/> Transfer</button>
            </div>}
            <button type="button" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)} className={accountMenuOpen ? "is-active" : ""}><span><LayoutGrid size={19}/></span><small>Accounts</small></button>
          </div>
          <a href="#cards"><span><CreditCard size={19}/></span><small>Cards</small></a>
        </nav>
        <footer className="atlas-dash-footer"><span>ATLAS BANK · YOUR FUTURE, OUR PRIORITY</span><span><ShieldCheck size={14}/> Keep your account details safe</span></footer>
      </section>
      <SupportChat mode="customer" popup />
    </main>
  );
}
