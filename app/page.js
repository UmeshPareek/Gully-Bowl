"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut } from 'lucide-react';

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
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [reviews, setReviews] = useState([]);

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
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
    onSnapshot(query(collection(db, "reviews"), orderBy("date", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
  }, []);

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No verdicts to export!");
    const headers = ["Date", "Customer Name", "Mobile", "Hustle", "Hood", "Bowl Tried", "Verdict"];
    const rows = reviews.map(r => [r.date, r.name, `'${r.phone || ""}`, r.hustle || "", r.hood || "", r.tried || "", `"${(r.text || "").replace(/"/g, '""')}"`]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gully_Bowl_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const addAdmin = async () => {
    const email = prompt("Enter New Admin Email:");
    if (email && !adminList.includes(email)) {
      const newList = [...adminList, email];
      await setDoc(doc(db, "settings", "admins"), { emails: newList });
      alert("Partner access granted!");
    }
  };

  const submitVerdict = async () => {
    const phone = document.getElementById('u-phone').value.trim();
    const hustle = document.getElementById('u-hustle').value.trim();
    const hood = document.getElementById('u-hood').value.trim();
    const text = document.getElementById('u-text').value.trim();

    if (!phone || !hustle || !hood || !text) return alert("Every field is mandatory for a Gully Verdict!");

    const reviewData = { name: user.displayName, phone, hustle, hood, tried: selectedTab, text, date: new Date().toLocaleString() };
    await addDoc(collection(db, "reviews"), reviewData);
    window.location.href = `https://wa.me/917024185979?text=*NEW GULLY VERDICT*%0A*From:* ${user.displayName}%0A*Phone:* ${phone}%0A*Verdict:* ${text}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
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
      <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8">
        <img src={data.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={type} />
      </div>
      <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 tracking-tight">{data.name}</h2>
      <p className="text-center italic text-stone-400 mb-10 text-xl font-serif leading-tight">"{data.tagline}"</p>
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
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Consumer View</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin Desk</button>
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
              <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hustle" placeholder="Your Hustle? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <input id="u-hood" placeholder="Which Hood? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
              <textarea id="u-text" placeholder="Be raw. Be Gully. *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-32 outline-none border border-[#B11E48]/10"></textarea>
              <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all">SUBMIT VERDICT</button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto pt-16 px-8 flex flex-col">
            <div className="w-full flex justify-between items-center mb-12">
                <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Control</h2>
                <div className="flex gap-4">
                    <button onClick={addAdmin} className="bg-white border-[#B11E48]/20 border px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2 uppercase text-[#B11E48]"><Users size={14}/> Add Admin</button>
                    <button onClick={exportToExcel} className="bg-white border-[#B11E48]/20 border px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2 uppercase text-[#B11E48]"><Download size={14}/> Export Excel</button>
                    <button onClick={() => signOut(auth)} className="bg-[#B11E48] text-white p-3 rounded-2xl"><LogOut size={18}/></button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {['veg', 'nonveg'].map(type => {
                      const bData = type === 'veg' ? vegData : nvData;
                      const setBData = type === 'veg' ? setVegData : setNvData;
                      return (
                        <div key={type} className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                            <p className={`text-xs font-black uppercase tracking-widest mb-6 ${type === 'veg' ? 'text-green-600' : 'text-[#B11E48]'}`}>{type} Editor</p>
                            <div className="flex gap-10">
                                <div className="w-1/3 aspect-square bg-[#FFFBEB] rounded-[3.5rem] overflow-hidden border border-[#B11E48]/10 shadow-inner group relative">
                                    <img src={bData.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover group-hover:opacity-40 transition-all" />
                                    <Camera size={24} className="absolute inset-0 m-auto text-[#B11E48] opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <input value={bData.img} onChange={e => setBData({...bData, img: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl text-xs font-mono outline-none" placeholder="PHOTO URL (.JPG)" />
                                    <input value={bData.name} onChange={e => setBData({...bData, name: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl font-bold outline-none" placeholder="Bowl Name" />
                                    <input value={bData.tagline} onChange={e => setBData({...bData, tagline: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl text-sm italic outline-none" placeholder="Tagline..." />
                                    <div className="grid grid-cols-3 gap-3">
                                        {['p', 'f', 'c'].map(macro => (
                                          <div key={macro} className="bg-[#FFFBEB] p-4 rounded-2xl text-center">
                                            <span className="block text-[8px] font-black text-stone-300 uppercase mb-1">{macro}</span>
                                            <input value={bData[macro]} onChange={e => setBData({...bData, [macro]: e.target.value})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                                          </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setDoc(doc(db, "menu", type), bData)} className="w-full bg-[#B11E48] text-white py-4 rounded-2xl text-xs font-black">PUBLISH {type.toUpperCase()} LIVE</button>
                                </div>
                            </div>
                        </div>
                      );
                    })}
                </div>
                <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[850px] flex flex-col">
                    <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Gossip Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {reviews.map((r, i) => (
                            <div key={i} className="p-6 bg-[#FFFBEB]/30 rounded-[2.5rem] border border-[#B11E48]/10 hover:bg-white transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-black text-xs text-[#B11E48]">{r.name}</p>
                                    <span className="text-[8px] font-black bg-white px-2 py-1 rounded-full border border-[#B11E48]/10">{r.tried}</span>
                                </div>
                                <p className="text-[10px] font-bold text-[#B11E48]/60 mb-2">{r.phone} • {r.hustle}</p>
                                <p className="text-[13px] text-stone-600 italic leading-relaxed">"{r.text}"</p>
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
