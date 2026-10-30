"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    setErrorMessage("");
    try {
      const { data, error } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      // Never treat a returned session as proof that the email was verified.
      // Keep signup on the OTP screen until verifyOtp succeeds.
      setCodeSent(true);
      setNotice("Your six-digit verification code has been requested. Check your inbox and enter it below to complete signup.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't create your account. Please try again.");
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
        token: code,
        type: "signup",
      });
      if (error) throw error;
      setNotice("Your email is verified and your ATLAS account is created. You can now sign in.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That code couldn't be verified. Please check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setNotice("");
    setErrorMessage("");
    try {
      const { error } = await getSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) throw error;
      setNotice("A new verification code has been requested. Check your inbox and spam folder.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't resend the code. Please wait a moment and try again.");
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
          <div className="section-kicker">A CLEARER WAY TO BANK</div>
          <h1>Your world.<br/><span>In balance.</span></h1>
          <p>Create your ATLAS account with a few simple steps.</p>
          <div className="login-assurance"><ShieldCheck size={18}/><span>Email verification for account security</span></div>
        </div>
        <div className="login-art-footer">ATLAS BANK <span>•</span> YOUR FUTURE, OUR PRIORITY</div>
      </aside>
      <section className="login-form-side">
        <Link className="back-home" href="/"><ArrowLeft size={16}/> Back to home</Link>
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><span className="login-brand-mark">A</span> ATLAS BANK</div>
          <div className="login-heading-kicker">GET STARTED</div>
          <h2>{codeSent ? "Verify your email." : "Create your account."}</h2>
          <p className="login-subtitle">{codeSent ? `Enter the six-digit code sent to ${email}.` : "Enter your email and create a password. We'll email you a verification code."}</p>
          {!codeSent ? (
            <form onSubmit={handleSignup}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              <label htmlFor="password">Create password</label>
              <input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/>
              <button className="button button-gold login-submit" type="submit" disabled={loading}>{loading ? "Creating account..." : "Sign up"} <ArrowRight size={18}/></button>
            </form>
          ) : (
            <>
              <form onSubmit={handleVerify}>
                <label htmlFor="code">Six-digit verification code</label>
                <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required minLength={6} maxLength={6}/>
                <button className="button button-gold login-submit" type="submit" disabled={loading || code.length !== 6}>{loading ? "Verifying..." : "Verify email"} <ArrowRight size={18}/></button>
              </form>
              <button className="login-resend" type="button" onClick={handleResend} disabled={loading}>Didn't receive a code? Resend email</button>
            </>
          )}
          {notice && <p className="login-notice" role="status">{notice}</p>}
          {errorMessage && <p className="login-notice" role="alert">{errorMessage}</p>}
          <div className="login-divider"><span>ALREADY A MEMBER?</span></div>
          <p className="login-help">Already have an account? <Link href="/login">Sign in</Link></p>
          <p className="login-legal">Check your inbox and spam folder for your verification email.</p>
        </div>
      </section>
    </main>
  );
}
