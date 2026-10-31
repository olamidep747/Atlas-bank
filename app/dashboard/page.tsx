"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CreditCard,
  Headphones, Home, LogOut, Menu, Settings, ShieldCheck, Wallet, X, Banknote, LayoutGrid
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accountNumber, setAccountNumber] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
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
        <button type="button" className="atlas-nav-link" aria-expanded={accountsOpen} onClick={() => setAccountsOpen(!accountsOpen)}><Wallet size={18}/> Accounts <ChevronDown size={15} style={{ marginLeft: "auto", transform: accountsOpen ? "rotate(180deg)" : "none" }}/></button>
        {accountsOpen && <div className="ml-7 flex flex-col gap-1 border-l border-white/15 pl-3"><button className="atlas-nav-link" onClick={() => setActiveAction("withdraw")}>Withdraw</button><button className="atlas-nav-link" onClick={() => setActiveAction("deposit")}>Deposit</button><button className="atlas-nav-link" onClick={() => setActiveAction("transfer")}>Transfer</button></div>}
        <a className="atlas-nav-link" href="#cards"><CreditCard size={18}/> Cards</a>
        <div className="atlas-nav-label atlas-nav-label-spaced">PERSONAL</div>
        <a className="atlas-nav-link" href="#support"><Headphones size={18}/> Support</a>
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
          <div className="atlas-savings-currency">{currency} <span>· {currency === "USD" ? "US Dollar" : currency} account</span></div>
          <div className="atlas-savings-divider"/>
          <div className="atlas-savings-bottom"><div><small>Account balance</small><strong>{currency} {balance}</strong></div><div><small>Account number</small><strong>{accountNumber || "Being assigned"}</strong></div><div className="atlas-savings-account"><small>Account holder</small><strong>{name}</strong></div></div>
          <div className="atlas-savings-footnote">Your account number is permanently assigned and linked to your profile.</div>
        </section>

        {accountsOpen && <><div className="atlas-dash-section-heading"><div><span>YOUR MONEY</span><h3>Account actions</h3></div></div>
        <section className="atlas-quick-actions" id="cards">
          <button type="button" className="atlas-quick-action" onClick={() => setActiveAction("withdraw")}><span><Banknote size={20}/></span><div><b>Withdraw</b><small>Withdraw funds</small></div><ArrowUpRight size={17}/></button>
          <button type="button" className="atlas-quick-action" onClick={() => setActiveAction("transfer")}><span><ArrowUpRight size={20}/></span><div><b>Transfer</b><small>Move money securely</small></div><ArrowUpRight size={17}/></button>
          <button type="button" className="atlas-quick-action" onClick={() => setActiveAction("deposit")}><span><ArrowDownLeft size={20}/></span><div><b>Deposit</b><small>Add money to your account</small></div><ArrowUpRight size={17}/></button>
        </section></>}

        {activeAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveAction(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">ATLAS ACCOUNT SERVICES</p><h2 id="action-dialog-title" className="mt-2 text-2xl font-bold text-slate-900">{activeAction === "withdraw" ? "Withdraw funds" : activeAction === "transfer" ? "Transfer funds" : "Deposit funds"}</h2></div>
                <button type="button" onClick={() => setActiveAction(null)} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={19}/></button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeAction === "withdraw" ? "The withdrawal area is ready to be configured. We’ll add the destination and verification steps next." : activeAction === "transfer" ? "The transfer area is ready to be configured. We’ll add recipient details and confirmation steps next." : "The deposit area is ready to be configured. We’ll add the available funding methods next."}</p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current account</div><div className="mt-1 font-semibold text-slate-900">{currency} {balance}</div><div className="mt-1 text-xs text-slate-500">Account {accountNumber || "number pending"}</div></div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">This is an interface preview. No deposit, withdrawal, or transfer will be submitted or processed from this screen yet.</div>
              <button type="button" onClick={() => setActiveAction(null)} className="mt-5 w-full rounded-xl bg-[#15264b] px-4 py-3 font-semibold text-white hover:bg-[#20365f]">Close</button>
            </section>
          </div>
        )}

        <section className="atlas-dash-lower" id="support"><div className="atlas-dash-panel"><div className="atlas-dash-section-heading"><div><span>RECENT ACTIVITY</span><h3>Transactions</h3></div></div><div className="atlas-empty-state"><span><Wallet size={22}/></span><b>No transactions yet</b><p>Your account activity will appear here.</p></div></div><div className="atlas-dash-panel atlas-help-panel"><span className="atlas-help-icon"><Headphones size={22}/></span><h3>Need a hand?</h3><p>Our support team is here to help with your account.</p><a href="mailto:support@atlasbank.example">Contact support <ArrowUpRight size={15}/></a></div></section>
        <nav className="atlas-mobile-bottom-nav" aria-label="Main navigation"><a className="is-active" href="/dashboard"><span><Home size={19}/></span><small>Home</small></a><button type="button" aria-expanded={accountsOpen} onClick={() => setAccountsOpen(!accountsOpen)} className={accountsOpen ? "is-active" : ""}><span><LayoutGrid size={19}/></span><small>Accounts</small></button><a href="#cards"><span><CreditCard size={19}/></span><small>Cards</small></a></nav>
        <footer className="atlas-dash-footer"><span>ATLAS BANK · YOUR FUTURE, OUR PRIORITY</span><span><ShieldCheck size={14}/> Keep your account details safe</span></footer>
      </section>
    </main>
  );
}
