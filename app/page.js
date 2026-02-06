"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, TrendingUp, ShieldCheck, History, Filter, ArrowUpDown, Trash2 } from 'lucide-react';

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
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTrialDate, setActiveTrialDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for Newest, 'asc' for Oldest
  const [adminSearch, setAdminSearch] = useState("");

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        onSnapshot(doc(db, "settings", "admins"), (d) => {
          let list = d.exists() ? d.data().emails : INITIAL_ADMINS;
          if (!list.includes(SUPER_ADMIN)) list = [SUPER_ADMIN, ...list];
          setAdminList(list);
          if (list.includes(u.email)) setIsAdmin(true);
        });
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", sortOrder)), (s) => {
        setReviews(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(20)), (s) => {
        setLogs(s.docs.map(d => d.data()));
    });
    
    return () => unsubscribe();
  }, [sortOrder]);

  const logAction = async (action) => {
    await addDoc(collection(db, "logs"), {
      admin: user.email,
      action: action,
      timestamp: Date.now(),
      date: new Date().toLocaleString()
    });
  };

  const handleAdminManagement = async (email, action) => {
    if (user.email !== SUPER_ADMIN) return alert("Only the Super Admin can manage other admins.");
    if (email === SUPER_ADMIN) return alert("Super Admin status is permanent.");

    let newList = [...adminList];
    if (action === 'add') {
      if (!newList.includes(email)) newList.push(email);
    } else {
      newList = newList.filter(e => e !== email);
    }

    await setDoc(doc(db, "settings", "admins"), { emails: newList });
    await logAction(`${action === 'add' ? 'Added' : 'Removed'} admin: ${email}`);
  };

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No verdicts to export!");
    const headers = ["Date", "Trial Date", "Customer Name", "Mobile", "Hustle", "Hood", "Tried", "Veg Review", "Non-Veg Review"];
    const rows = reviews.map(r => [r.date, r.trialDate || r.date.split(',')[0], r.name, `'${r.phone || ""}`, r.hustle || "", r.hood || "", r.tried || "", `"${(r.vegText || "").replace(/"/g, '""')}"`, `"${(r.nvText || "").replace(/"/g, '""')}"`]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Gully_Bowl_Master_Report.csv`;
    a.click();
  };

  const submitVerdict = async () => {
    const phone = document.getElementById('u-phone').value.trim();
    const hustle = document.getElementById('u-hustle').value.trim();
    const hood = document.getElementById('u-hood').value.trim();
    let vegText = document.getElementById('u-veg-text')?.value.trim() || "";
    let nvText = document.getElementById('u-nv-text')?.value.trim() || "";

    if (!phone || !hustle || !hood || (selectedTab !== 'Non-Veg' && !vegText) || (selectedTab !== 'Veg' && !nvText)) {
      return alert("Wait! Every section is required for the Gully Verdict. 🥗");
    }

    const reviewData = { 
        name: user.displayName, phone, hustle, hood, tried: selectedTab, vegText, nvText, 
        trialDate: activeTrialDate, timestamp: Date.now(), date: new Date().toLocaleString() 
    };
    await addDoc(collection(db, "reviews"), reviewData);
    window.location.href = `https://wa.me/917024185979?text=*GULLY VERDICT*%0A*Trial:* ${activeTrialDate}%0A*From:* ${user.displayName}`;
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
          <div className="flex gap-2 mb-10 bg-white/50 p-1.5 rounded-3xl border border-[#B11E48]/10 shadow-sm">
            {['Veg', 'Non-Veg', 'Both'].map(t => (
              <button key={t} onClick={() => setSelectedTab(t)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedTab === t ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}>{t}</button>
            ))}
          </div>

          <div className="space-y-12">
            {(selectedTab === 'Veg' || selectedTab === 'Both') && (
                <div className="animate-in fade-in duration-700">
                    <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8"><img src={vegData.img || "https://images.unsplash.com"} className="w-full h-full object-cover" /></div>
                    <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 leading-none">{vegData.name}</h2>
                </div>
            )}
            {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && (
                <div className="animate-in fade-in duration-700">
                    <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8"><img src={nvData.img || "https://images.unsplash.com"} className="w-full h-full object-cover" /></div>
                    <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 leading-none">{nvData.name}</h2>
                </div>
            )}
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5 mt-12">
            <h3 className="text-3xl font-serif font-black text-center italic text-[#B11E48] mb-8">Drop the Verdict</h3>
            <div className="space-y-4">
              <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hustle" placeholder="Your Profession? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hood" placeholder="Your Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              {(selectedTab === 'Veg' || selectedTab === 'Both') && <textarea id="u-veg-text" placeholder="Veg Bowl Review... *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>}
              {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <textarea id="u-nv-text" placeholder="Non-Veg Bowl Review... *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>}
              <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all">SUBMIT VERDICT</button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-screen-2xl mx-auto pt-16 px-8 flex flex-col">
            {/* ADMIN HEADER */}
            <div className="flex flex-wrap justify-between items-start gap-8 mb-12">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">The Kitchen Desk</h2>
                    <p className="text-[#B11E48]/50 text-xs font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2"><ShieldCheck size={14}/> Logged in as: {user.email}</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={exportToExcel} className="bg-[#B11E48] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-lg hover:scale-105 transition-all"><Download size={16}/> Master Report</button>
                    <button onClick={() => signOut(auth)} className="bg-white border-[#B11E48]/20 border p-4 rounded-2xl shadow-sm"><LogOut size={18} className="text-[#B11E48]"/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* COLUMN 1: ANALYTICS & MENU */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Live Stats</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#FFFBEB] p-4 rounded-2xl"><p className="text-[8px] font-bold text-[#B11E48]/60 uppercase">Total</p><p className="text-2xl font-black">{reviews.length}</p></div>
                            <div className="bg-[#B11E48]/5 p-4 rounded-2xl"><p className="text-[8px] font-bold text-[#B11E48]/60 uppercase">Today</p><p className="text-2xl font-black">{reviews.filter(r => r.trialDate === activeTrialDate).length}</p></div>
                        </div>
                    </div>

                    {['veg', 'nonveg'].map(type => (
                        <div key={type} className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></span> {type} Editor
                            </p>
                            <div className="space-y-3">
                                <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="w-full p-3 bg-[#FFFBEB]/50 rounded-xl text-[10px] font-mono" placeholder="Image URL" />
                                <input value={type === 'veg' ? vegData.name : nvData.name} onChange={e => type === 'veg' ? setVegData({...vegData, name: e.target.value}) : setNvData({...nvData, name: e.target.value})} className="w-full p-3 bg-[#FFFBEB]/50 rounded-xl font-bold text-sm" placeholder="Name" />
                                <button onClick={() => { setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData); logAction(`Updated ${type} menu`); }} className="w-full bg-[#B11E48] text-white py-3 rounded-xl text-[10px] font-black">SAVE LIVE</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* COLUMN 2 & 3: ADVANCED GOSSIP FEED */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                            <h3 className="text-3xl font-serif font-black italic text-[#B11E48]">Trial Gossip</h3>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-3 bg-[#FFFBEB] rounded-xl text-[#B11E48] hover:bg-[#B11E48] hover:text-white transition-all">
                                    <ArrowUpDown size={18} />
                                </button>
                                <input type="date" value={activeTrialDate.split('/').reverse().join('-')} onChange={(e) => setActiveTrialDate(new Date(e.target.value).toLocaleDateString('en-GB'))} className="bg-[#FFFBEB] border-none px-4 py-3 rounded-xl text-xs font-bold text-[#B11E48] outline-none" />
                            </div>
                        </div>
                        <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                            {reviews.filter(r => r.trialDate === activeTrialDate).length === 0 ? (
                                <div className="text-center py-20 opacity-20"><Utensils size={48} className="mx-auto mb-4" /><p className="font-bold">No verdicts for this trial date.</p></div>
                            ) : reviews.filter(r => r.trialDate === activeTrialDate).map((r, i) => (
                                <div key={i} className="p-8 bg-[#FFFBEB]/30 rounded-[3rem] border border-[#B11E48]/10 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-black text-lg text-[#B11E48]">{r.name}</p>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{r.phone} • {r.hustle} • {r.hood}</p>
                                        </div>
                                        <span className="text-[10px] font-black bg-[#B11E48] text-white px-4 py-2 rounded-full uppercase">{r.tried}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {r.vegText && <div className="p-5 bg-white rounded-3xl border border-green-100"><p className="text-[8px] font-black text-green-600 uppercase mb-2">Veg Verdict</p><p className="text-sm italic text-stone-600 leading-relaxed">"{r.vegText}"</p></div>}
                                        {r.nvText && <div className="p-5 bg-white rounded-3xl border border-red-100"><p className="text-[8px] font-black text-red-600 uppercase mb-2">Non-Veg Verdict</p><p className="text-sm italic text-stone-600 leading-relaxed">"{r.nvText}"</p></div>}
                                    </div>
                                    <p className="text-[8px] text-stone-300 font-bold mt-4 text-right uppercase tracking-widest">{r.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 4: ACTIVITY LOG & ADMIN MGMT */}
                <div className="xl:col-span-1 space-y-8">
                    {/* ADMIN MANAGEMENT */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><ShieldCheck size={20}/> Admin Access</h4>
                        {user.email === SUPER_ADMIN ? (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Email to add..." className="flex-1 bg-[#FFFBEB] p-3 rounded-xl text-xs outline-none" />
                                    <button onClick={() => { handleAdminManagement(adminSearch, 'add'); setAdminSearch(""); }} className="bg-[#B11E48] text-white p-3 rounded-xl"><Users size={16}/></button>
                                </div>
                                <div className="space-y-2 pt-4">
                                    {adminList.map(email => (
                                        <div key={email} className="flex justify-between items-center bg-[#FFFBEB]/50 p-3 rounded-xl border border-[#B11E48]/5">
                                            <span className="text-[10px] font-bold truncate max-w-[120px]">{email}</span>
                                            {email !== SUPER_ADMIN && (
                                                <button onClick={() => handleAdminManagement(email, 'remove')} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] italic text-stone-400">View only. Management reserved for Super Admin.</p>
                        )}
                    </div>

                    {/* ACTIVITY LOG */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><History size={20}/> Audit Log</h4>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="text-[9px] border-b border-stone-100 pb-3 last:border-0">
                                    <p className="font-bold text-[#B11E48]">{log.admin}</p>
                                    <p className="text-stone-600 mb-1">{log.action}</p>
                                    <p className="text-[8px] text-stone-300 uppercase font-black tracking-widest">{log.date}</p>
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
