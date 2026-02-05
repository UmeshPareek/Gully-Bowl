"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, TrendingUp, ShieldCheck, History, ArrowUpDown, Trash2, ShoppingBag, Clock, XCircle, Heart } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyC_7TR7XJwZDtOf2NytiJzaKlqnDApZDDY",
  authDomain: "gully-bowl.firebaseapp.com",
  projectId: "gully-bowl",
  storageBucket: "gully-bowl.firebasestorage.app",
  messagingSenderId: "141914833931",
  appId: "1:141914833931:web:c8adafe2c157b88160730e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const SUPER_ADMIN = "pareeku01@gmail.com";
const INITIAL_ADMINS = [SUPER_ADMIN];

export default function GullyBowlApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('user');
  const [selectedTab, setSelectedTab] = useState('Veg');
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [isOrderActive, setIsOrderActive] = useState(false);
  
  const [hasOrdered, setHasOrdered] = useState(false);
  const [userOrder, setUserOrder] = useState(null);
  const [forceReviewView, setForceReviewView] = useState(false);
  const [enrollInterest, setEnrollInterest] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [activeTrialDate, setActiveTrialDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [sortOrder, setSortOrder] = useState('desc');

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        onSnapshot(doc(db, "settings", "admins"), (d) => {
          let list = d.exists() ? d.data().emails : INITIAL_ADMINS;
          if (!list.includes(SUPER_ADMIN)) list = [SUPER_ADMIN, ...list];
          setAdminList(list);
          if (list.includes(u.email)) setIsAdmin(true);
        });

        onSnapshot(query(collection(db, "orders"), where("email", "==", u.email), where("trialDate", "==", activeTrialDate)), (s) => {
          if (!s.empty) {
            setHasOrdered(true);
            setUserOrder(s.docs[0].data());
          } else {
            setHasOrdered(false);
          }
        });
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(doc(db, "settings", "orderControl"), (d) => d.exists() && setIsOrderActive(d.data().active));
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", sortOrder)), (s) => setReviews(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc")), (s) => setAllOrders(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(15)), (s) => setLogs(s.docs.map(d => d.data())));
    
    return () => unsubscribe();
  }, [sortOrder, activeTrialDate]);

  const logAction = async (action) => {
    await addDoc(collection(db, "logs"), { admin: user.email, action, timestamp: Date.now(), date: new Date().toLocaleString() });
  };

  const handleOrder = async () => {
    const phone = document.getElementById('o-phone').value.trim();
    const hood = document.getElementById('o-hood').value.trim();
    if (!phone || !hood) return alert("Delivery details required!");

    await addDoc(collection(db, "orders"), {
      name: user.displayName, email: user.email, phone, hood,
      bowl: selectedTab, trialDate: activeTrialDate, timestamp: Date.now()
    });
    alert("Bowl Reserved! 🥣");
  };

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No gossip to export!");
    const headers = ["Date", "Trial Date", "Customer", "Mobile", "Job", "Location", "Tried", "Enroll Interested", "Veg Verdict", "NV Verdict"];
    const rows = reviews.map(r => [
        r.date, r.trialDate, r.name, `'${r.phone || ""}`, r.hustle || "", r.hood || "", r.tried || "", 
        r.interested ? "YES" : "NO", 
        `"${(r.vegText || "").replace(/"/g, '""')}"`, `"${(r.nvText || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gully_Bowl_Data_Master.csv`;
    link.click();
  };

  const submitVerdict = async () => {
    const phone = document.getElementById('u-phone')?.value.trim() || userOrder?.phone;
    const hood = document.getElementById('u-hood')?.value.trim() || userOrder?.hood;
    const hustle = document.getElementById('u-hustle').value.trim();
    let vegText = document.getElementById('u-veg-text')?.value.trim() || "";
    let nvText = document.getElementById('u-nv-text')?.value.trim() || "";

    if (!phone || !hood || !hustle || (selectedTab !== 'Non-Veg' && !vegText) || (selectedTab !== 'Veg' && !nvText)) {
      return alert("Wait! Every field is required for your Gully Verdict. 🥗");
    }

    const reviewData = { 
        name: user.displayName, phone, hustle, hood, tried: selectedTab, vegText, nvText, 
        interested: enrollInterest,
        trialDate: activeTrialDate, timestamp: Date.now(), date: new Date().toLocaleString() 
    };
    await addDoc(collection(db, "reviews"), reviewData);
    window.location.href = `https://wa.me/917024185979?text=*GULLY VERDICT*%0A*From:* ${user.displayName}%0A*Enroll Interested:* ${enrollInterest ? 'YES ✅' : 'NO ❌'}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl">ENTER THE GULLY</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-32 font-sans">
      {isAdmin && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-[#B11E48] text-white p-2 rounded-full shadow-2xl">
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Consumer</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin Desk</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-16 px-6">
          <img src={BRAND_LOGO} className="w-28 mx-auto mb-10" alt="Logo" />
          <div className="flex gap-2 mb-10 bg-white/50 p-1.5 rounded-3xl border border-[#B11E48]/10">
            {['Veg', 'Non-Veg', 'Both'].map(t => (
              <button key={t} onClick={() => !hasOrdered && !forceReviewView && setSelectedTab(t)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedTab === t ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}>{t}</button>
            ))}
          </div>

          <div className="space-y-12">
               {(selectedTab === 'Veg' || selectedTab === 'Both') && (
                 <div className="animate-in fade-in duration-700 text-center">
                   <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-6"><img src={vegData.img || "https://images.unsplash.com"} className="w-full h-full object-cover" /></div>
                   <h2 className="text-5xl font-serif font-black text-[#B11E48] tracking-tight">{vegData.name}</h2>
                 </div>
               )}
               {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && (
                 <div className="animate-in fade-in duration-700 text-center">
                   <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-6"><img src={nvData.img || "https://images.unsplash.com"} className="w-full h-full object-cover" /></div>
                   <h2 className="text-5xl font-serif font-black text-[#B11E48] tracking-tight">{nvData.name}</h2>
                 </div>
               )}
          </div>

          <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-[#B11E48]/5 mt-12">
            {(!hasOrdered && !forceReviewView) ? (
              <div className="space-y-4">
                <h3 className="text-3xl font-serif font-black italic text-[#B11E48] text-center mb-6">Reserve Now</h3>
                {isOrderActive ? (
                  <>
                    <input id="o-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                    <input id="o-hood" placeholder="Delivery Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                    <button onClick={handleOrder} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl">CONFIRM ORDER 🥣</button>
                    <button onClick={() => setForceReviewView(true)} className="w-full py-2 text-[10px] font-black uppercase text-[#B11E48]/40 tracking-widest">Already have a bowl? Review</button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Clock size={32} className="mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-400">Ordering is closed. 👋</p>
                    <button onClick={() => setForceReviewView(true)} className="mt-4 px-8 py-3 bg-[#B11E48]/5 text-[#B11E48] rounded-xl text-[10px] font-black uppercase tracking-widest">Write a Review</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-3xl font-serif font-black italic text-[#B11E48] text-center mb-6">Drop the Verdict</h3>
                {forceReviewView && (
                    <>
                        <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                        <input id="u-hood" placeholder="Your Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                    </>
                )}
                <input id="u-hustle" placeholder="Your Profession? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                {(selectedTab === 'Veg' || selectedTab === 'Both') && <textarea id="u-veg-text" placeholder="Veg Bowl Verdict... *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>}
                {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <textarea id="u-nv-text" placeholder="Non-Veg Bowl Verdict... *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>}
                
                {/* INTEREST TOGGLE */}
                <div onClick={() => setEnrollInterest(!enrollInterest)} className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${enrollInterest ? 'bg-[#B11E48] border-[#B11E48] text-white shadow-lg' : 'bg-[#FFFBEB]/40 border-[#B11E48]/10 text-[#B11E48]'}`}>
                    <div className="flex items-center gap-3">
                        <Heart size={20} fill={enrollInterest ? "white" : "none"} />
                        <span className="text-xs font-black uppercase tracking-tight">Enroll for future bowls?</span>
                    </div>
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${enrollInterest ? 'bg-white text-[#B11E48]' : 'border-[#B11E48]/20'}`}>
                        {enrollInterest && <CheckCircle size={16} />}
                    </div>
                </div>

                <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl uppercase">Submit Verdict 🥗</button>
                <button onClick={() => setForceReviewView(false)} className="w-full py-2 text-[10px] font-black text-stone-300 uppercase">Back</button>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* --- ADMIN MASTER DASHBOARD --- */
        <main className="max-w-screen-2xl mx-auto pt-16 px-8 flex flex-col">
            <div className="w-full flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Command</h2>
                    <div className="flex gap-4 mt-6">
                        <button onClick={() => { const s = !isOrderActive; setDoc(doc(db, "settings", "orderControl"), {active: s}); logAction(`${s?'Opened':'Closed'} orders`); }} className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase ${isOrderActive ? 'bg-green-500 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>
                            {isOrderActive ? <ShoppingBag size={14}/> : <XCircle size={14}/>} Ordering: {isOrderActive?'Open':'Closed'}
                        </button>
                        <div className="bg-white border border-[#B11E48]/10 px-4 py-2 rounded-xl flex items-center gap-2"><Calendar size={14} className="text-[#B11E48]"/><input type="date" value={activeTrialDate.split('/').reverse().join('-')} onChange={(e) => setActiveTrialDate(new Date(e.target.value).toLocaleDateString('en-GB'))} className="text-xs font-black outline-none bg-transparent" /></div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={exportToExcel} className="bg-[#B11E48] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all"><Download size={16}/> Master Report</button>
                    <button onClick={() => signOut(auth)} className="bg-white border border-[#B11E48]/10 p-4 rounded-2xl shadow-sm text-[#B11E48]"><LogOut size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1 space-y-8">
                    {/* BATCH ORDERS */}
                    <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-[#B11E48]/5 flex flex-col h-[500px]">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><ShoppingBag size={20}/> Batch Orders</h4>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {allOrders.filter(o => o.trialDate === activeTrialDate).map((o, i) => (
                                <div key={i} className="p-4 bg-[#FFFBEB]/50 rounded-2xl border border-[#B11E48]/5">
                                    <p className="font-black text-[10px] text-[#B11E48] uppercase truncate">{o.name}</p>
                                    <p className="text-[9px] font-bold text-stone-400 mt-1">{o.bowl} • {o.hood}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* MENU SYNC */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><Camera size={20}/> Menu Sync</h4>
                        {['veg', 'nonveg'].map(type => (
                            <div key={type} className="mb-6 last:mb-0">
                                <p className="text-[9px] font-black uppercase text-stone-400 mb-2">{type} URL</p>
                                <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="w-full p-3 bg-[#FFFBEB] rounded-xl text-[10px] outline-none border border-transparent focus:border-[#B11E48]/20 mb-2" placeholder="PostImg URL" />
                                <button onClick={() => { setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData); logAction(`Updated ${type} menu`); }} className="w-full bg-[#B11E48] text-white py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VERDICT FEED WITH ENROLLMENT INFO */}
                <div className="xl:col-span-2 bg-white p-8 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[850px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-serif font-black italic text-[#B11E48]">Trial Gossip</h3>
                        <ArrowUpDown size={20} className="text-[#B11E48] cursor-pointer" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}/>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                        {reviews.filter(r => r.trialDate === activeTrialDate).map((r, i) => (
                            <div key={i} className={`p-8 bg-[#FFFBEB]/30 rounded-[3rem] border transition-all ${r.interested ? 'border-[#B11E48]' : 'border-[#B11E48]/10'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-lg text-[#B11E48]">{r.name}</p>
                                            {r.interested && <span className="bg-[#B11E48] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase">ENROLL INTEREST</span>}
                                        </div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{r.phone} • {r.hustle}</p>
                                    </div>
                                    <span className="text-[9px] font-black bg-[#B11E48] text-white px-4 py-2 rounded-full uppercase">{r.tried}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {r.vegText && <div className="p-4 bg-white rounded-3xl border border-green-100 text-sm italic text-green-700 leading-relaxed">Veg: {r.vegText}</div>}
                                    {r.nvText && <div className="p-4 bg-white rounded-3xl border border-red-100 text-sm italic text-red-700 leading-relaxed">NV: {r.nvText}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8">
                    {/* AUDIT LOG */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5 flex flex-col h-[400px]">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><History size={20}/> Audit Log</h4>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="text-[9px] border-b border-stone-50 pb-2">
                                    <p className="font-bold text-[#B11E48] truncate">{log.admin}</p>
                                    <p className="text-stone-500">{log.action}</p>
                                    <p className="text-[8px] text-stone-300 font-black mt-1 uppercase">{log.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
      )}
    </div>
  );
}
