"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders, clearSession, getToken } from "@/lib/auth";
import ProtectedPage from "@/components/auth/ProtectedPage";
import { ArrowLeft, Award, CheckCircle2, Clock3, Target, TrendingUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type Interview = { _id:string; role:string; interviewType:string; status:string; createdAt:string; report?: { accuracy?:number; correctAnswers?:number; incorrectAnswers?:number; totalQuestions?:number; unansweredQuestions?:number; generatedAt?:string } | null };
type Api = { interviews?: Interview[] };
function PerformanceContent() {
 const router=useRouter(); const [items,setItems]=useState<Interview[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{ let active=true; (async()=>{ try { const token=getToken(); if(!token){router.replace('/login');return;} const r=await fetch(`${API}/api/interviews`,{headers:authHeaders(),cache:'no-store'}); if(r.status===401){clearSession();router.replace('/login');return;} const d=await r.json(); if(!r.ok) throw new Error(d.message||'Could not load performance data.'); if(active)setItems(Array.isArray(d.interviews)?d.interviews:[]); } catch(e){if(active)setError(e instanceof Error?e.message:'Unexpected error.');} finally{if(active)setLoading(false);} })(); return()=>{active=false;}; },[router]);
 const completed=useMemo(()=>items.filter(x=>x.status==='completed'&&x.report),[items]);
 const avg=completed.length?completed.reduce((s,x)=>s+(x.report?.accuracy||0),0)/completed.length:0;
 const correct=completed.reduce((s,x)=>s+(x.report?.correctAnswers||0),0);
 const total=completed.reduce((s,x)=>s+(x.report?.totalQuestions||0),0);
 const trend=[...completed].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).slice(-8);
 return <main className="analytics-page"><header className="analytics-header"><div><Link href="/" className="analytics-back"><ArrowLeft size={16}/> Dashboard</Link><p className="analytics-eyebrow">YOUR GROWTH</p><h1>Performance Analytics</h1><p>Track your interview results and identify where to improve.</p></div><Link href="/interview" className="analytics-primary">Start an interview</Link></header>
 {loading?<div className="analytics-state">Loading your performance...</div>:error?<div className="analytics-error">{error}</div>:<><section className="analytics-stats">{[{label:'Total interviews',value:items.length,icon:<Target/>},{label:'Completed interviews',value:completed.length,icon:<CheckCircle2/>},{label:'Average accuracy',value:`${avg.toFixed(1)}%`,icon:<Award/>},{label:'Correct answers',value:correct,icon:<TrendingUp/>}].map(x=><article className="analytics-stat" key={x.label}><span>{x.icon}</span><small>{x.label}</small><strong>{x.value}</strong></article>)}</section>
 <section className="analytics-panel"><div className="analytics-panel-heading"><div><h2>Performance trend</h2><p>Accuracy across your latest completed interviews</p></div><span>Last {trend.length} sessions</span></div>{trend.length===0?<div className="analytics-state">No completed interviews with reports yet. Complete an interview to see your trend.</div>:<div className="analytics-chart">{trend.map((x,i)=><div className="analytics-bar-wrap" key={x._id} title={`${x.role}: ${Number(x.report?.accuracy||0).toFixed(1)}%`}><strong>{Number(x.report?.accuracy||0).toFixed(0)}%</strong><div className="analytics-bar-track"><div className="analytics-bar" style={{height:`${Math.max(2,Math.min(100,x.report?.accuracy||0))}%`}}/></div><small>#{i+1}</small></div>)}</div>}</section>
 <section className="analytics-panel"><div className="analytics-panel-heading"><div><h2>Interview breakdown</h2><p>Your completed interview reports</p></div></div>{completed.length===0?<div className="analytics-state">Your reports will appear here after completing interviews.</div>:<div className="analytics-table">{completed.slice().sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).map(x=><Link className="analytics-row" href={`/interview/${x._id}/report`} key={x._id}><div><strong>{x.role||'Interview'}</strong><small>{new Date(x.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {x.interviewType}</small></div><strong>{Number(x.report?.accuracy||0).toFixed(1)}%</strong><span>View report →</span></Link>)}</div>}</section></>}
 </main>;
}
export default function PerformancePage(){return <ProtectedPage><PerformanceContent/></ProtectedPage>}
