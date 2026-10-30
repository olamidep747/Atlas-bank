"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("The ATLAS sign-in screen is ready. Secure authentication still needs to be connected before accounts can sign in.");
  }

  return (
    <main className="login-page">
      <aside className="login-art">
        <Link className="login-brand" href="/"><span className="login-brand-mark">A</span><span>ATLAS<span>BANK</span></span></Link>
        <div className="login-art-lines" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
        <div className="login-art-copy">
          <div className="section-kicker">WELCOME TO A CLEARER WAY</div>
          <h1>Your world.<br/><span>In balance.</span></h1>
          <p>Pick up where you left off. Your financial life, thoughtfully brought together.</p>
          <div className="login-assurance"><ShieldCheck size={18}/><span>Designed with your security in mind</span></div>
        </div>
        <div className="login-art-footer">ATLAS BANK <span>•</span> YOUR FUTURE, OUR PRIORITY</div>
      </aside>
      <section className="login-form-side">
        <Link className="back-home" href="/"><ArrowLeft size={16}/> Back to home</Link>
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><span className="login-brand-mark">A</span> ATLAS BANK</div>
          <div className="login-heading-kicker">YOUR ACCOUNT, YOUR WAY</div>
          <h2>Welcome back.</h2>
          <p className="login-subtitle">Sign in with the email address linked to your ATLAS account.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
            <div className="password-label"><label htmlFor="password">Password</label><a href="mailto:support@atlasbank.example?subject=Password%20reset%20help">Forgot password?</a></div>
            <div className="password-input"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
            <button className="button button-gold login-submit" type="submit" disabled={loading}>{loading?"Please wait":"Sign in to ATLAS"} <ArrowRight size={18}/></button>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </form>
          <div className="login-divider"><span>SECURE ACCESS</span></div>
          <p className="login-help">Need a hand? <a href="mailto:support@atlasbank.example">Contact support</a></p>
          <p className="login-legal">By continuing, you acknowledge that this is the ATLAS account access experience. Terms and privacy information will be provided before live service launch.</p>
        </div>
      </section>
    </main>
  );
}
