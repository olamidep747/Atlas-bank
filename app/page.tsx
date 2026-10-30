"use client";

import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, ShieldCheck, Globe2, Zap, Headphones,
  Menu, X, CreditCard, Wallet, Landmark, ChevronDown, LockKeyhole,
  Smartphone, CheckCircle2, CircleHelp
} from "lucide-react";

const features = [
  { icon: Wallet, title: "Banking made simple", body: "See your money clearly, manage everyday spending, and stay in control from one place." },
  { icon: Globe2, title: "Made for a global life", body: "Move confidently across borders with convenient international banking features." },
  { icon: CreditCard, title: "Cards that go with you", body: "A modern card experience for online purchases and the moments that matter." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const links = ["Personal", "Cards", "Global banking", "About ATLAS"];
  return (
    <main>
      <div className="topline"><span>Banking for wherever life takes you</span><span className="topline-right"><LockKeyhole size={13}/> Secure digital banking</span></div>
      <header className="header">
        <a className="brand" href="#" aria-label="ATLAS Bank home"><span className="brand-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 39 20 8q2-4 6 0l17 31H31L24 24 17 39Z" fill="currentColor"/><path d="M8 34Q21 17 44 18 28 23 20 34Z" fill="#FFD84D"/></svg></span><span>ATLAS<span className="brand-bank">BANK</span></span></a>
        <nav className="desktop-nav">{links.map(x => <a key={x} href={x === "About ATLAS" ? "#about" : "#features"}>{x}</a>)}</nav>
        <div className="header-actions"><a className="signin" href="/login">Sign in</a><a className="button button-gold button-small" href="/signup">Open an account <ArrowUpRight size={16}/></a></div>
        <button className="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      </header>
      <div className="mobile-panel" hidden={!menuOpen}>{links.map(x=><a key={x} href="#features" onClick={()=>setMenuOpen(false)}>{x}</a>)}<a href="/login" onClick={()=>setMenuOpen(false)}>Sign in</a><a className="button button-gold" href="/signup" onClick={()=>setMenuOpen(false)}>Open an account <ArrowRight size={16}/></a></div>

      <section className="hero">
        <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> A clearer way to bank</div>
          <h1>Your money.<br/><span>Your world.</span><br/>Your future.</h1>
          <p className="hero-lead">Move through life with banking that feels effortless. Keep your money in view, your plans moving, and your possibilities open.</p>
          <div className="hero-buttons"><a className="button button-gold" href="#get-started">Discover ATLAS <ArrowRight size={18}/></a><a className="button button-outline" href="#features">Explore banking</a></div>
          <div className="hero-trust"><div className="avatar-stack"><span>A</span><span>T</span><span>+</span></div><div><strong>Built around your life</strong><small>Thoughtful tools. Clear choices. You in control.</small></div></div>
        </div>
        <div className="hero-art" aria-label="Illustration of an ATLAS banking card and account overview">
          <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
          <div className="floating-label label-top"><span className="status-dot"/> Your money, in motion</div>
          <div className="bank-card"><div className="card-top"><span className="card-brand">ATLAS<span>BANK</span></span><span className="card-chip"><i/></span></div><div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 2048</div><div className="card-bottom"><span>ATLAS MEMBER</span><span className="card-circles"><i/><i/></span></div></div>
          <div className="account-float"><div className="account-heading"><span>ACCOUNT OVERVIEW</span><span className="account-menu">•••</span></div><small>Available balance</small><strong>$22,000<span>.00</span></strong><div className="balance-line"><span>Monthly activity</span><b>+12.8%</b></div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
          <div className="floating-label label-bottom"><span className="secure-icon"><ShieldCheck size={17}/></span><span><b>Security comes first</b><small>Protection built in</small></span></div>
          <div className="hero-star">✳</div>
        </div>
        <div className="hero-bottom"><span>CONFIDENCE IN EVERY STEP</span><span className="hero-bottom-line"/><span>THE ATLAS WAY</span></div>
      </section>

      <section className="trust-strip"><div><ShieldCheck/><span><b>Security-minded</b><small>Designed with care</small></span></div><div><Globe2/><span><b>Globally minded</b><small>Ready for your world</small></span></div><div><Zap/><span><b>Effortless experiences</b><small>Less friction, more flow</small></span></div><div><Headphones/><span><b>Here when you need us</b><small>Support that listens</small></span></div></section>

      <section className="section intro-section" id="about"><div className="section-kicker">A NEW PERSPECTIVE ON BANKING</div><div className="intro-grid"><h2>More than a place<br/>to keep your money.</h2><div><p className="section-lead">Your financial life should move at your pace. ATLAS brings the essentials together in one considered experience — so you can spend less time figuring things out and more time moving forward.</p><a className="text-link" href="#features">Get to know ATLAS <ArrowUpRight size={17}/></a></div></div></section>

      <section className="section features-section" id="features"><div className="section-heading"><div><div className="section-kicker">BANKING, REIMAGINED</div><h2>Everything in its<br/><span>right place.</span></h2></div><p>Everyday banking tools, brought together with clarity and care. A more considered way to manage what matters.</p></div><div className="feature-grid">{features.map(({icon: Icon,title,body},i)=><article className="feature-card" key={title}><div className="feature-icon"><Icon size={24}/></div><span className="feature-index">0{i+1}</span><h3>{title}</h3><p>{body}</p><a href="#get-started" aria-label={`Explore ${title}`}><ArrowUpRight size={19}/></a></article>)}</div></section>

      <section className="global-section"><div className="global-pattern"/><div className="global-copy"><div className="section-kicker">A WORLD OF POSSIBILITY</div><h2>Wherever you’re<br/>headed, <span>go further.</span></h2><p>From everyday moments to big moves, your banking should make the journey feel simpler. ATLAS is designed with a global outlook and a personal touch.</p><a className="button button-gold" href="#get-started">Explore global banking <ArrowRight size={17}/></a></div><div className="global-visual"><div className="globe-ring ring-one"/><div className="globe-ring ring-two"/><div className="globe-core"><Globe2 size={110} strokeWidth={0.8}/></div><span className="map-point point-one"/><span className="map-point point-two"/><span className="map-point point-three"/><div className="global-tag tag-one">YOUR WORLD</div><div className="global-tag tag-two">WITHOUT BORDERS</div></div></section>

      <section className="section values-section"><div className="section-kicker">BUILT ON WHAT MATTERS</div><div className="values-grid"><div><h2>Confidence is<br/>the real currency.</h2><p className="section-lead">Great banking starts with trust. We put clarity, security, and control at the heart of every experience.</p></div><div className="value-list"><div><span><ShieldCheck/></span><div><h3>Protection at every step</h3><p>Thoughtful security principles help keep your account experience protected.</p></div></div><div><span><Smartphone/></span><div><h3>Your bank, close at hand</h3><p>Designed to feel intuitive on the devices you use every day.</p></div></div><div><span><CheckCircle2/></span><div><h3>Clarity you can count on</h3><p>Understand your choices with straightforward information and helpful controls.</p></div></div></div></div></section>

      <section className="cta-section" id="get-started"><div className="cta-orb"/><div className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</div><h2>Make room for<br/><span>what’s next.</span></h2><p>Bring your plans into focus with a banking experience designed around you.</p><a className="button button-gold" href="/signup">Get started with ATLAS <ArrowRight size={18}/></a><small>Account availability and features are subject to eligibility and applicable terms.</small></section>

      <section className="section faq-section"><div><div className="section-kicker">A FEW THINGS YOU MAY BE WONDERING</div><h2>Good to<br/>know.</h2><p>Some quick answers about the ATLAS experience.</p></div><div className="faq-list">{["What is ATLAS Bank?","Can I access my account on mobile?","How does ATLAS approach security?","Where can I learn about account eligibility?"].map((q,i)=><div className="faq-item" key={q}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)}><span>{q}</span>{faqOpen===i?<X size={18}/>:<ChevronDown size={18}/>}</button>{faqOpen===i&&<p>{["ATLAS is a digital banking concept focused on a clear, modern experience for managing your financial life. Product availability and services will be confirmed before launch.","The experience is being designed to work beautifully across desktop and mobile devices.","Security is a core design priority. Actual protection features will be documented and implemented before any live banking service launches.","Eligibility, supported regions, fees, and account terms will be published clearly when the relevant products are available."][i]}</p>}</div>)}</div></section>

      <footer className="footer"><div className="footer-main"><a className="brand footer-brand" href="#"><span className="brand-mark"><svg viewBox="0 0 48 48"><path d="M5 39 20 8q2-4 6 0l17 31H31L24 24 17 39Z" fill="currentColor"/><path d="M8 34Q21 17 44 18 28 23 20 34Z" fill="#FFD84D"/></svg></span><span>ATLAS<span className="brand-bank">BANK</span></span></a><p>Your Future. Our Priority.</p><div className="footer-links"><a href="#features">Personal banking</a><a href="#about">About ATLAS</a><a href="#get-started">Get started</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} ATLAS Bank. All rights reserved.</span><span>Designed for clarity. Built for possibility.</span></div><p className="disclaimer">ATLAS is a brand concept. This website is not a banking licence, deposit-taking service, or offer of financial products. No real accounts or transactions are available through this homepage.</p></footer>
    </main>
  );
}