"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, TrendingUp } from 'lucide-react';

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

const INITIAL_ADMINS = ["pareeku01@gmail.com"]; 

export default function GullyBowlApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('user');
  const [selectedTab, setSelectedTab] = useState('Veg');
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [reviews, setReviews] = useState([]);
  const [activeTrialDate, setActiveTrialDate] = useState(new Date().toLocaleDateString('en-GB'));

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        onSnapshot(doc(db, "settings", "admins"), (d) => {
          const list = d.exists() ? d.data().emails : INITIAL_ADMINS;
          setAdminList(list);
          if (list.includes(u.email)) setIsAdmin(true);
        });
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (s) => {
        setReviews(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    
    return () => unsubscribe();
  }, []);

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No verdicts to export!");
    const headers = ["Date", "Trial Date", "Customer Name", "Mobile", "Hustle", "Hood", "Tried", "Veg Review", "Non-Veg Review"];
    const rows = reviews.map(r => [
        r.date, 
        r.trialDate || r.date.split(',')[0],
        r.name, 
        `'${r.phone || ""}`, 
        r.hustle || "", 
        r.hood || "", 
        r.tried || "", 
        `"${(r.vegText || r.text || "").replace(/"/g, '""')}"`,
        `"${(r.nvText || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gully_Bowl_Master_Report.csv`;
    link.click();
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
        name: user.displayName, phone, hustle, hood, 
        tried: selectedTab, vegText, nvText, 
        trialDate: activeTrialDate,
        timestamp: Date.now(),
        date: new Date().toLocaleString() 
    };
    
    await addDoc(collection(db, "reviews"), reviewData);
    window.location.href = `https://wa.me/917024185979?text=*NEW GULLY VERDICT*%0A*Trial Date:* ${activeTrialDate}%0A*From:* ${user.displayName}%0A*Tried:* ${selectedTab}%0A*Verdict:* ${vegText} ${nvText}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl">ENTER THE GULLY</button>
      </div>
    </div>
  );

  const BowlDisplay = ({data, type}) => (
    <div className="mb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`w-3 h-3 rounded-full ${type === 'Veg' ? 'bg-green-600' : 'bg-[#B11E48]'}`}></span>
        <p className="text-[#B11E48] font-black text-[10px] uppercase tracking-[0.4em]">{type}</p>
      </div>
      <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8 bg-stone-100">
        <img src={data.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={type} />
      </div>
      <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 tracking-tight leading-none">{data.name}</h2>
      <div className="grid grid-cols-3 gap-4">
        {[{l:'P', v:data.p, d:'Protein'}, {l:'F', v:data.f, d:'Fiber'}, {l:'C', v:data.c, d:'Calories'}].map(i => (
          <div key={i.l} className="bg-white p-6 rounded-[2.5rem] text-center shadow-sm border border-[#B11E48]/5">
            <span className="block text-[10px] font-black text-[#B11E48] mb-1 uppercase tracking-widest">{i.d}</span>
            <span className="text-2xl font-bold">{i.v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-32 font-sans">
      {isAdmin && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-[#B11E48] text-white p-2 rounded-full shadow-2xl">
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Consumer View</button>
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

          {(selectedTab === 'Veg' || selectedTab === 'Both') && <BowlDisplay data={vegData} type="Veg" />}
          {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <BowlDisplay data={nvData} type="Non-Veg" />}

          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5 mt-12">
            <h3 className="text-3xl font-serif font-black text-center italic text-[#B11E48] mb-8 leading-tight">Your Feedback</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 opacity-70">
                <UserIcon size={18} className="text-[#B11E48]" />
                <span className="text-sm font-bold text-[#B11E48]">{user.displayName}</span>
              </div>
              <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hustle" placeholder="Your Job/Profession? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hood" placeholder="Your Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              
              {(selectedTab === 'Veg' || selectedTab === 'Both') && (
                <textarea id="u-veg-text" placeholder="How was the Veg Bowl? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>
              )}
              {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && (
                <textarea id="u-nv-text" placeholder="How was the Non-Veg Bowl? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>
              )}
              
              <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest">Submit Verdict</button>
            </div>
          </div>
        </main>
      ) : (
        /* --- ELITE ADMIN DASHBOARD --- */
        <main className="max-w-7xl mx-auto pt-16 px-8 flex flex-col">
            <div className="w-full flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">The Kitchen Desk</h2>
                    <p className="text-[#B11E48]/50 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2"><Calendar size={12}/> Trial Date: {activeTrialDate}</p>
                </div>
                <div className="flex gap-4">
                    <input type="date" onChange={(e) => setActiveTrialDate(new Date(e.target.value).toLocaleDateString('en-GB'))} className="bg-white border-[#B11E48]/20 border px-4 py-2 rounded-xl text-xs font-bold" />
                    <button onClick={exportToExcel} className="bg-[#B11E48] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-lg hover:scale-105 transition-all"><Download size={16}/> Master Report</button>
                    <button onClick={() => {
                        const email = prompt("Partner Email:");
                        if(email) setDoc(doc(db, "settings", "admins"), { emails: [...adminList, email] });
                    }} className="bg-white border-[#B11E48]/20 border p-4 rounded-2xl shadow-sm"><Users size={18} className="text-[#B11E48]"/></button>
                    <button onClick={() => signOut(auth)} className="bg-white border-[#B11E48]/20 border p-4 rounded-2xl shadow-sm"><LogOut size={18} className="text-[#B11E48]"/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5 flex items-center gap-6">
                    <div className="p-4 bg-green-50 rounded-full text-green-600"><TrendingUp /></div>
                    <div><p className="text-xs font-bold text-stone-400">Total Trials</p><p className="text-3xl font-black">{reviews.length}</p></div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5 flex items-center gap-6">
                    <div className="p-4 bg-red-50 rounded-full text-red-600"><Utensils /></div>
                    <div><p className="text-xs font-bold text-stone-400">Today</p><p className="text-3xl font-black">{reviews.filter(r => r.trialDate === activeTrialDate).length}</p></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {['veg', 'nonveg'].map(type => (
                        <div key={type} className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                            <div className="flex justify-between items-center mb-6">
                                <p className={`text-xs font-black uppercase tracking-widest ${type === 'veg' ? 'text-green-600' : 'text-[#B11E48]'}`}>{type} Editor</p>
                                <button onClick={() => setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData)} className="bg-[#B11E48] text-white px-8 py-2 rounded-xl text-[10px] font-black">Publish Live</button>
                            </div>
                            <div className="flex gap-8">
                                <div className="w-1/4 aspect-square bg-[#FFFBEB] rounded-[2.5rem] overflow-hidden border relative group">
                                    <img src={type === 'veg' ? vegData.img : nvData.img} className="w-full h-full object-cover" />
                                    <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="absolute inset-0 opacity-0 cursor-text" placeholder="URL" />
                                    <Camera size={24} className="absolute inset-0 m-auto text-[#B11E48] opacity-50" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <input value={type === 'veg' ? vegData.name : nvData.name} onChange={e => type === 'veg' ? setVegData({...vegData, name: e.target.value}) : setNvData({...nvData, name: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl font-bold border-none outline-none" placeholder="Bowl Name" />
                                    <div className="flex gap-2">
                                        {['p', 'f', 'c'].map(m => (
                                            <input key={m} value={type === 'veg' ? vegData[m] : nvData[m]} onChange={e => type === 'veg' ? setVegData({...vegData, [m]: e.target.value}) : setNvData({...nvData, [m]: e.target.value})} className="w-1/3 p-3 bg-[#FFFBEB] rounded-xl text-center font-bold" placeholder={m.toUpperCase()} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[850px] flex flex-col">
                    <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Trial Gossip</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {reviews.filter(r => r.trialDate === activeTrialDate).map((r, i) => (
                            <div key={i} className="p-6 bg-[#FFFBEB]/40 rounded-[2.5rem] border border-[#B11E48]/10">
                                <p className="font-black text-xs text-[#B11E48]">{r.name} <span className="text-stone-300 font-normal">({r.phone})</span></p>
                                <p className="text-[10px] font-bold text-stone-400 mt-1 mb-3">{r.hustle} • {r.tried}</p>
                                {r.vegText && <div className="mb-2 p-3 bg-white rounded-2xl border border-green-50 text-[11px] italic text-green-700">Veg: {r.vegText}</div>}
                                {r.nvText && <div className="p-3 bg-white rounded-2xl border border-red-50 text-[11px] italic text-red-700">Non-Veg: {r.nvText}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
      )}
    </div>
  );
}
