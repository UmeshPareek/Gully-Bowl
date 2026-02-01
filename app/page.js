"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera } from 'lucide-react';

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

  // LOGO: Points to your GitHub file
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
    if (reviews.length === 0) return alert("No gossip to export yet!");
    const headers = ["Date", "Customer Name", "Mobile", "Hustle", "Hood", "Bowl Tried", "Verdict"];
    const rows = reviews.map(r => [
      r.date, 
      r.name, 
      `'${r.phone || ""}`, // Fixed undefined phone bug
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
      phone: phone, // Fixed field name
      hustle,
      hood,
      tried: selectedTab,
      text,
      date: new Date().toLocaleString()
    };

    await addDoc(collection(db, "reviews"), reviewData);
    window.location.href = `https://wa.me/917024185979?text=*GULLY VERDICT*%0A*From:* ${user.displayName}%0A*Phone:* ${phone}%0A*Verdict:* ${text}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">ENTER THE GULLY</button>
      </div>
    </div>
  );

  const BowlDisplay = ({data, type}) => (
    <div className="mb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`w-3 h-3 rounded-full ${type === 'Veg' ? 'bg-green-600' : 'bg-[#B11E48]'}`}></span>
        <p className="text-[#B11E48] font-black text-[10px] uppercase tracking-[0.4em]">{type}</p>
      </div>
      <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8">
        <img src={data.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={type} />
      </div>
      <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 tracking-tight">{data.name}</h2>
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
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-32">
      {isAdmin && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-[#B11E48] text-white p-2 rounded-full shadow-2xl">
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Consumer</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin</button>
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
            <h3 className="text-3xl font-serif font-black text-center italic text-[#B11E48] mb-8 leading-tight">Drop the Verdict</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 opacity-70">
                <UserIcon size={18} className="text-[#B11E48]" />
                <span className="text-sm font-bold text-[#B11E48]">{user.displayName}</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 focus:ring-1 ring-[#B11E48]" required />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-hustle" placeholder="Your Hustle? *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" required />
              </div>
              <div className="relative">
                <MapPin className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-hood" placeholder="Which Hood? *" className="w-full pl-14 p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" required />
              </div>
              <textarea id="u-text" placeholder="Be raw. Be Gully. *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10" required></textarea>
              <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all">SUBMIT VERDICT 🥗</button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto pt-16 px-8 flex flex-col">
            <div className="w-full flex justify-between items-center mb-12">
                <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Control</h2>
                <button onClick={exportToExcel} className="bg-white border-[#B11E48]/20 border px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-[#B11E48] flex items-center gap-3 shadow-sm hover:scale-105 transition-all"><Download size={16}/> Download Excel Report</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {['veg', 'nonveg'].map(type => (
                        <div key={type} className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                            <p className={`text-xs font-black uppercase tracking-widest mb-6 ${type === 'veg' ? 'text-green-600' : 'text-[#B11E48]'}`}>{type} Manager</p>
                            <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl text-[10px] mb-4 font-mono" placeholder="PASTE PHOTO LINK ENDING IN .JPG HERE" />
                            <input value={type === 'veg' ? vegData.name : nvData.name} onChange={e => type === 'veg' ? setVegData({...vegData, name: e.target.value}) : setNvData({...nvData, name: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl font-bold" placeholder="Bowl Name" />
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {['p', 'f', 'c'].map(macro => (
                                  <div key={macro} className="bg-[#FFFBEB] p-4 rounded-2xl text-center shadow-inner">
                                    <span className="block text-[8px] font-black text-stone-300 uppercase mb-1">{macro}</span>
                                    <input value={type === 'veg' ? vegData[macro] : nvData[macro]} onChange={e => type === 'veg' ? setVegData({...vegData, [macro]: e.target.value}) : setNvData({...nvData, [macro]: e.target.value})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                                  </div>
                                ))}
                            </div>
                            <button onClick={() => setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData)} className="mt-6 bg-[#B11E48] text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-md">PUBLISH {type.toUpperCase()} LIVE</button>
                        </div>
                    ))}
                </div>
                <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[850px] flex flex-col">
                    <h3 className="text-2xl font-serif font-black italic text-[#B11E48] mb-8">Gossip Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {reviews.map((r, i) => (
                            <div key={i} className="p-6 bg-[#FFFBEB]/30 rounded-[2.5rem] border border-[#B11E48]/10">
                                <p className="font-black text-xs text-[#B11E48]">{r.name}</p>
                                <p className="text-[10px] font-bold text-stone-400 mb-2">{r.phone} • {r.tried}</p>
                                <p className="text-[13px] text-stone-600 italic">"{r.text}"</p>
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
