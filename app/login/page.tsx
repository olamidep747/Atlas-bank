"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorMessage("");

    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });

      if (error) throw error;
      setCodeSent(true);
      setNotice("A six-digit verification code has been sent to your email. Check your inbox and enter it below.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't send your code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorMessage("");

    try {
      const { error } = await getSupabaseBrowserClient().auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });

      if (error) throw error;
      setNotice("Your email is verified and you are signed in.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That code couldn't be verified. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <h2>{codeSent ? "Check your email." : "Welcome back."}</h2>
          <p className="login-subtitle">{codeSent ? `Enter the six-digit verification code sent to ${email}.` : "Enter the email address linked to your ATLAS account. We'll send you a verification code."}</p>
          {!codeSent ? (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              <button className="button button-gold login-submit" type="submit" disabled={loading}>{loading ? "Sending code..." : "Sign in"} <ArrowRight size={18}/></button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} readOnly/>
              <label htmlFor="code">Six-digit verification code</label>
              <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} required minLength={6} maxLength={6}/>
              <button className="button button-gold login-submit" type="submit" disabled={loading || code.length !== 6}>{loading ? "Verifying..." : "Verify and sign in"} <ArrowRight size={18}/></button>
              <button className="login-resend" type="button" disabled={loading} onClick={() => { setCodeSent(false); setCode(""); setNotice(""); setErrorMessage(""); }}>Use a different email</button>
            </form>
          )}
          {notice && <p className="login-notice" role="status">{notice}</p>}
          {errorMessage && <p className="login-notice" role="alert">{errorMessage}</p>}
          <div className="login-divider"><span>SECURE ACCESS</span></div>
          <p className="login-legal">A verification code is required to complete sign-in. If you don't see the email, check your spam folder.</p>
        </div>
      </section>
    </main>
  );
}
