"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const countries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic","DR Congo",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
  "Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar",
  "Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam",
  "Yemen",
  "Zambia","Zimbabwe"
];

const currencies = [
  ["USD","US Dollar"],["EUR","Euro"],["GBP","British Pound"],["NGN","Nigerian Naira"],["CAD","Canadian Dollar"],["AUD","Australian Dollar"],
  ["CHF","Swiss Franc"],["CNY","Chinese Yuan"],["GHS","Ghanaian Cedi"],["KES","Kenyan Shilling"],["ZAR","South African Rand"],["AED","UAE Dirham"],
  ["JPY","Japanese Yen"],["INR","Indian Rupee"],["SGD","Singapore Dollar"],["NZD","New Zealand Dollar"],["XOF","West African CFA Franc"],["XAF","Central African CFA Franc"]
];

type SignupDetails = {
  fullName: string; dateOfBirth: string; phone: string; country: string;
  gender: string; employmentStatus: string; accountType: string; currency: string;
};

const emptyDetails: SignupDetails = {
  fullName: "", dateOfBirth: "", phone: "", country: "", gender: "",
  employmentStatus: "", accountType: "", currency: "USD"
};

export default function SignupPage() {
  const [details, setDetails] = useState<SignupDetails>(emptyDetails);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  function updateDetail<K extends keyof SignupDetails>(key: K, value: SignupDetails[K]) {
    setDetails(previous => ({ ...previous, [key]: value }));
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setErrorMessage("");
    if (password !== confirmPassword) {
      setErrorMessage("Your passwords do not match. Please enter them again.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Your password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: details.fullName.trim(),
            date_of_birth: details.dateOfBirth,
            phone: details.phone.trim(),
            country: details.country,
            gender: details.gender,
            employment_status: details.employmentStatus,
            account_type: details.accountType,
            preferred_currency: details.currency
          }
        }
      });
      if (error) throw error;

      if (data.session) {
        const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut();
        if (signOutError) throw signOutError;
      }

      setCodeSent(true);
      setNotice("Enter the six-digit code sent to your email to finish creating your account.");
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
        type: "signup"
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
        email: email.trim()
      });
      if (error) throw error;
      setNotice("A new verification code has been requested. Check your inbox and spam folder.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We couldn't resend the code. Please wait a moment and try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) ? 4 : (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) ? 3 : 2;
  const passwordStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const filteredCountries = ["European Union", ...countries].filter(country => country.toLowerCase().includes(countrySearch.toLowerCase()));

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
          <p className="login-subtitle">{codeSent ? `Enter the six-digit code sent to ${email}.` : "Complete your details to open your ATLAS account."}</p>
          {!codeSent ? (
            <form className="atlas-signup-form" onSubmit={handleSignup}>
              <section className="signup-group">
                <div className="signup-group-heading"><span>01</span><div><h3>Personal information</h3><p>Tell us a little about yourself.</p></div></div>
                <div className="signup-fields">
                  <div className="signup-field signup-field-wide"><label htmlFor="fullName">Full name</label><input id="fullName" type="text" autoComplete="name" placeholder="Enter your full name" value={details.fullName} onChange={e=>updateDetail("fullName",e.target.value)} required/></div>
                  <div className="signup-field"><label htmlFor="dateOfBirth">Date of birth</label><input id="dateOfBirth" type="date" autoComplete="bday" value={details.dateOfBirth} onChange={e=>updateDetail("dateOfBirth",e.target.value)} required/></div>
                  <div className="signup-field"><label htmlFor="phone">Phone number</label><input id="phone" type="tel" autoComplete="tel" placeholder="+234..." value={details.phone} onChange={e=>updateDetail("phone",e.target.value)} required/></div>
                  <div className="signup-field"><label htmlFor="gender">Gender</label><select id="gender" value={details.gender} onChange={e=>updateDetail("gender",e.target.value)} required><option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></div>
                  <div className="signup-field"><label htmlFor="employmentStatus">Employment status</label><select id="employmentStatus" value={details.employmentStatus} onChange={e=>updateDetail("employmentStatus",e.target.value)} required><option value="">Select employment status</option><option>Employed</option><option>Self-employed</option><option>Unemployed</option><option>Student</option><option>Retired</option><option>Business owner</option></select></div>
                </div>
              </section>
              <section className="signup-group">
                <div className="signup-group-heading"><span>02</span><div><h3>Location</h3><p>Choose the country or region associated with your account.</p></div></div>
                <div className="signup-fields">
                  <div className="signup-field signup-field-wide country-picker">
                    <label>Country or region</label>
                    <button className="country-picker-trigger" type="button" aria-expanded={countryOpen} onClick={()=>{setCountryOpen(open=>!open);setCountrySearch("");}}><span className={details.country ? "selected" : "placeholder"}>{details.country || "Choose your country or region"}</span><span aria-hidden="true">⌄</span></button>
                    {countryOpen && <div className="country-picker-panel"><input className="country-search" aria-label="Search countries" autoFocus placeholder="Search countries..." value={countrySearch} onChange={e=>setCountrySearch(e.target.value)}/><div className="country-picker-options">{filteredCountries.map(country=><button type="button" key={country} className={details.country===country?"active":""} onClick={()=>{updateDetail("country",country);setCountryOpen(false);setCountrySearch("");}}>{country}{country==="European Union" && <small>Regional option</small>}</button>)}{filteredCountries.length===0 && <p>No matching country found.</p>}</div></div>}
                    <input type="text" tabIndex={-1} aria-hidden="true" value={details.country} required onChange={()=>{}} className="country-validation"/>
                  </div>
                </div>
              </section>
              <section className="signup-group">
                <div className="signup-group-heading"><span>03</span><div><h3>Account preferences</h3><p>Select how you want your account set up.</p></div></div>
                <div className="signup-fields">
                  <div className="signup-field"><label htmlFor="accountType">Account type</label><select id="accountType" value={details.accountType} onChange={e=>updateDetail("accountType",e.target.value)} required><option value="">Select account type</option><option>Personal</option><option>Business</option><option>Savings</option><option>Current</option></select></div>
                  <div className="signup-field"><label htmlFor="currency">Preferred currency</label><select id="currency" value={details.currency} onChange={e=>updateDetail("currency",e.target.value)} required>{currencies.map(([code,name])=><option key={code} value={code}>{code} — {name}</option>)}</select></div>
                </div>
              </section>
              <section className="signup-group">
                <div className="signup-group-heading"><span>04</span><div><h3>Sign-in details</h3><p>Use an email address you can access.</p></div></div>
                <div className="signup-fields">
                  <div className="signup-field signup-field-wide"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
                  <div className="signup-field"><label htmlFor="password">Create password</label><input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/>{password.length>0 && <div className="password-strength" aria-live="polite">Password strength: <strong>{passwordStrengthLabel}</strong><div><i style={{width:`${passwordStrength*25}%`,background:passwordStrength<2?"#ef4444":passwordStrength<4?"#eab308":"#16a34a"}}/></div></div>}</div>
                  <div className="signup-field"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Enter password again" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={8}/>{confirmPassword.length>0 && <small className={password===confirmPassword?"password-match":"password-mismatch"}>{password===confirmPassword?"Passwords match":"Passwords do not match"}</small>}</div>
                </div>
              </section>
              <button className="button button-gold login-submit" type="submit" disabled={loading}>{loading ? "Creating account..." : "Continue to verification"} <ArrowRight size={18}/></button>
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
