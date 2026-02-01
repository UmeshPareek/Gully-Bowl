"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase } from 'lucide-react';

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

const INITIAL_ADMINS = ["pareeku01@gmail.com"]; 

export default function GullyBowlApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('user');
  const [selectedTab, setSelectedTab] = useState('Veg');
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [reviews, setReviews] = useState([]);

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        if (INITIAL_ADMINS.includes(u.email)) setIsAdmin(true);
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("date", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
  }, []);

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No verdicts found to export!");
    
    // Excel-ready CSV Header
    const headers = ["Date", "Customer Name", "Mobile Number", "Occupation (Hustle)", "Location (Hood)", "Bowl Choice", "The Verdict"];
    
    const rows = reviews.map(r => [
      r.date, 
      r.name, 
      `'${r.phone || ""}`, // Fixed undefined: using apostrophe to keep leading zeros in Excel
      r.hustle || "", 
      r.hood || "", 
      r.tried || "", 
      `"${(r.text || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gully_Bowl_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const submitVerdict = async () => {
    const phone = document.getElementById('u-phone').value.trim();
    const hustle = document.getElementById('u-hustle').value.trim();
    const hood = document.getElementById('u-hood').value.trim();
    const text = document.getElementById('u-text').value.trim();

    if (!phone || !hustle || !hood || !text) {
      return alert("Wait! Every field is required to submit your Gully Verdict. 🥗");
    }

    const reviewData = {
      name: user.displayName,
      phone,
      hustle,
      hood,
      tried: selectedTab,
      text,
      date: new Date().toLocaleString()
    };

    await addDoc(collection(db, "reviews"), reviewData);
    alert("Verdict Received! Sending to WhatsApp...");
    window.location.href = `https://wa.me/917024185979?text=*NEW GULLY VERDICT*%0A*From:* ${user.displayName}%0A*Phone:* ${phone}%0A*Verdict:* ${text}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">ENTER THE GULLY</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-32">
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

          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5">
            <h3 className="text-2xl font-serif font-black text-center italic text-[#B11E48] mb-8 leading-tight">Drop the Verdict</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 opacity-70">
                <UserIcon size={18} className="text-[#B11E48]" />
                <span className="text-sm font-bold text-[#B11E48]">{user.displayName}</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" required />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-hustle" placeholder="Your Hustle? *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" required />
              </div>
              <div className="relative">
                <MapPin className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-hood" placeholder="Your Hood? *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" required />
              </div>
              <textarea id="u-text" placeholder="Be raw. Be Gully. *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10" required></textarea>
              <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all">SUBMIT VERDICT 🥗</button>
            </div>
          </div>
        </main>
      ) : (
        /* --- ADMIN VIEW --- */
        <main className="max-w-7xl mx-auto pt-16 px-8 flex flex-col">
            <div className="w-full flex justify-between items-center mb-12">
                <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Control</h2>
                <button onClick={exportToExcel} className="bg-white border-[#B11E48]/20 border px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-[#B11E48] flex items-center gap-3 shadow-sm hover:scale-105 transition-all"><Download size={16}/> Download Excel Report</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {['veg', 'nonveg'].map(type => (
                        <div key={type} className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                            <p className="text-xs font-black uppercase text-[#B11E48] tracking-widest mb-6">{type} Manager</p>
                            <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl text-[10px] mb-4" placeholder="Image URL" />
                            <input value={type === 'veg' ? vegData.name : nvData.name} onChange={e => type === 'veg' ? setVegData({...vegData, name: e.target.value}) : setNvData({...nvData, name: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl font-bold" placeholder="Bowl Name" />
                            <button onClick={() => setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData)} className="mt-4 bg-[#B11E48] text-white px-8 py-2 rounded-xl text-[10px] font-black">SAVE LIVE</button>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[700px] flex flex-col">
                    <h3 className="text-2xl font-serif font-black italic text-[#B11E48] mb-8">Live Feedback</h3>
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {reviews.map((r, i) => (
                            <div key={i} className="p-6 bg-[#FFFBEB]/30 rounded-[2.5rem] border border-[#B11E48]/10">
                                <p className="font-black text-xs text-[#B11E48]">{r.name} <span className="text-stone-300 font-normal">({r.phone})</span></p>
                                <p className="text-[12px] text-stone-600 italic mt-2">"{r.text}"</p>
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
