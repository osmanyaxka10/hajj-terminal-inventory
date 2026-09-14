
"use client";
import { useState } from "react";
import { sendMagicLink, signIn } from "@/lib/cloud";

export default function AuthPanel({onSignedIn}:{onSignedIn:()=>void}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function login(){
    setBusy(true);setMessage("");
    const {error}=await signIn(email,password);
    setBusy(false);
    if(error){setMessage(error.message);return}
    setMessage("Signed in.");
    onSignedIn();
  }
  async function magic(){
    if(!email){setMessage("Enter your email first.");return}
    setBusy(true);setMessage("");
    const {error}=await sendMagicLink(email);
    setBusy(false);
    setMessage(error?error.message:"Magic sign-in link sent to your email.");
  }

  return <section className="card auth-card">
    <h2>Connect Hajj Inventory</h2>
    <p className="muted">Use the same Supabase account used by Better Habits. Hajj inventory tables are isolated and do not change your habit data.</p>
    <div className="grid2" style={{marginTop:12}}>
      <label className="stack">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label className="stack">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
    </div>
    <div className="actions">
      <button className="btn primary" disabled={busy||!email||!password} onClick={login}>Sign in</button>
      <button className="btn" disabled={busy||!email} onClick={magic}>Email me a magic link</button>
    </div>
    {message&&<div className="notice">{message}</div>}
  </section>;
}
