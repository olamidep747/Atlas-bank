"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CreditCard,
  Headphones, Home, LogOut, Menu, Settings, ShieldCheck, Wallet, X
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error || !data.session) {
        router.replace("/login");
        return;
      }
      const user = data.session.user;
      const fullName = user.user_metadata?.full_name;
      setName(typeof fullName === "string" && fullName.trim() ? fullName.trim().split(" ")[0] : "there");
      setEmail(user.email ?? "");
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
        <a className="atlas-nav-link" href="#accounts"><Wallet size={18}/> Accounts</a>
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
          <div className="atlas-savings-currency">USD <span>· US Dollar account</span></div>
          <div className="atlas-savings-divider"/>
          <div className="atlas-savings-bottom"><div><small>Available balance</small><strong>— — —</strong></div><div><small>Pending balance</small><strong>— — —</strong></div><div className="atlas-savings-account"><small>Account holder</small><strong>{name}</strong></div></div>
          <div className="atlas-savings-footnote">Your verified account balances will appear here once your account data is connected.</div>
        </section>

        <div className="atlas-dash-section-heading"><div><span>YOUR MONEY</span><h3>Quick actions</h3></div></div>
        <section className="atlas-quick-actions" id="cards">
          <div className="atlas-quick-action"><span><ArrowDownLeft size={20}/></span><div><b>Add money</b><small>Fund your account</small></div><ArrowUpRight size={17}/></div>
          <div className="atlas-quick-action"><span><ArrowUpRight size={20}/></span><div><b>Transfer</b><small>Move money securely</small></div><ArrowUpRight size={17}/></div>
          <div className="atlas-quick-action"><span><CreditCard size={20}/></span><div><b>Cards</b><small>Manage your cards</small></div><ArrowUpRight size={17}/></div>
        </section>

        <section className="atlas-dash-lower" id="support"><div className="atlas-dash-panel"><div className="atlas-dash-section-heading"><div><span>RECENT ACTIVITY</span><h3>Transactions</h3></div></div><div className="atlas-empty-state"><span><Wallet size={22}/></span><b>No transactions yet</b><p>Your account activity will appear here.</p></div></div><div className="atlas-dash-panel atlas-help-panel"><span className="atlas-help-icon"><Headphones size={22}/></span><h3>Need a hand?</h3><p>Our support team is here to help with your account.</p><a href="mailto:support@atlasbank.example">Contact support <ArrowUpRight size={15}/></a></div></section>
        <footer className="atlas-dash-footer"><span>ATLAS BANK · YOUR FUTURE, OUR PRIORITY</span><span><ShieldCheck size={14}/> Keep your account details safe</span></footer>
      </section>
    </main>
  );
}
