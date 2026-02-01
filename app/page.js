"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { Camera, Download, Users, LayoutDashboard, Utensils, Send, LogOut, CheckCircle, Link as LinkIcon, Phone } from 'lucide-react';

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

  const publishUpdate = async (type) => {
    const data = type === 'veg' ? vegData : nvData;
    await setDoc(doc(db, "menu", type), data);
    alert(`${type.toUpperCase()} is now Live! 🚀`);
  };

  const exportToExcel = () => {
    if (reviews.length === 0) return alert("No reviews to export yet!");
    // Standard CSV format that Excel recognizes instantly
    const headers = ["Date", "Customer Name", "Mobile", "Hustle", "Hood", "Bowl Tried", "Review Verdict"];
    const rows = reviews.map(r => [
      r.date, 
      r.name, 
      `'${r.phone}`, // Added apostrophe to prevent Excel from removing leading zeros in phone numbers
      r.hustle, 
      r.hood, 
      r.tried, 
      `"${r.text.replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n"); // Added BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gully_Bowl_Data_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const addAdmin = async () => {
    const email = prompt("Enter new Admin Email:");
    if (email && !adminList.includes(email)) {
      const newList = [...adminList, email];
      await setDoc(doc(db, "settings", "admins"), { emails: newList });
      alert("Admin added!");
    }
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
      <p className="text-center italic text-stone-400 mb-10 text-xl font-serif leading-tight">"{data.tagline}"</p>
      <div className="grid grid-cols-3 gap-4">
        {[{l:'P', v:data.p, d:'Protein'}, {l:'F', v:data.f, d:'Fiber'}, {l:'C', v:data.c, d:'Calories'}].map(i => (
          <div key={i.l} className="bg-white p-6 rounded-[2.5rem] text-center shadow-sm border border-[#B11E48]/5">
            <span className="block text-[10px] font-black text-[#B11E48] uppercase tracking-widest mb-1">{i.d}</span>
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
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>User View</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin Desk</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-16 px-6">
          <img src={BRAND_LOGO} className="w-28 mx-auto mb-12" alt="Logo" />
          <div className="flex gap-2 mb-12 bg-white/50 p-1.5 rounded-3xl border border-[#B11E48]/10 shadow-sm">
            {['Veg', 'Non-Veg', 'Both'].map(t => (
              <button key={t} onClick={() => setSelectedTab(t)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedTab === t ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}>{t}</button>
            ))}
          </div>
          {(selectedTab === 'Veg' || selectedTab === 'Both') && <BowlDisplay data={vegData} type="Veg" />}
          {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <BowlDisplay data={nvData} type="Non-Veg" />}
          
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5 mt-12">
            <h3 className="text-3xl font-serif font-black text-center italic text-[#B11E48] mb-8 leading-tight">Drop the Verdict</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-5 bg-[#FFFBEB]/30 rounded-2xl border border-[#B11E48]/10 opacity-70">
                <Users size={18} className="text-[#B11E48]" />
                <span className="text-sm font-bold text-[#B11E48]">{user.displayName}</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-5 top-5 text-[#B11E48]/40" size={18} />
                <input id="u-phone" type="tel" placeholder="Mobile Number" className="w-full pl-14 p-5 bg-[#FFFBEB]/30 rounded-2xl outline-none border border-[#B11E48]/10 focus:ring-1 ring-[#B11E48]" />
              </div>
              <input id="u-hustle" placeholder="Your Hustle?" className="w-full p-5 bg-[#FFFBEB]/30 rounded-2xl outline-none border border-[#B11E48]/10 focus:ring-1 ring-[#B11E48]" />
              <input id="u-hood" placeholder="Which Hood?" className="w-full p-5 bg-[#FFFBEB]/30 rounded-2xl outline-none border border-[#B11E48]/10 focus:ring-1 ring-[#B11E48]" />
              <textarea id="u-text" placeholder="Be raw. Be Gully. How was it?" className="w-full p-5 bg-[#FFFBEB]/30 rounded-3xl h-32 outline-none border border-[#B11E48]/10 focus:ring-1 ring-[#B11E48]"></textarea>
              <button onClick={async () => {
                 const phn = document.getElementById('u-phone').value;
                 const hust = document.getElementById('u-hustle').value;
                 const txt = document.getElementById('u-text').value;
                 if(!phn || !txt) return alert("Phone and Verdict are mandatory!");
                 await addDoc(collection(db, "reviews"), { name: user.displayName, phone: phn, hustle: hust, hood: document.getElementById('u-hood').value, tried: selectedTab, text: txt, date: new Date().toLocaleString() });
                 window.location.href = `https://wa.me/917024185979?text=Gully Verdict! From: ${user.displayName} (${phn}). Feedback: ${txt}`;
              }} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest">Submit Verdict</button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto pt-16 px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Control</h2>
                <div className="flex gap-3">
                    <button onClick={exportToExcel} className="bg-white border-[#B11E48]/20 border px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-[#B11E48] flex items-center gap-2 shadow-sm transition-all active:scale-95"><Download size={14}/> Download XLSX</button>
                    <button onClick={addAdmin} className="bg-white border-[#B11E48]/20 border px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-[#B11E48] flex items-center gap-2 shadow-sm transition-all active:scale-95"><Users size={14}/> Access</button>
                </div>
            </div>

            {['veg', 'nonveg'].map(type => {
              const bData = type === 'veg' ? vegData : nvData;
              const setBData = type === 'veg' ? setVegData : setNvData;
              return (
                <div key={type} className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5">
                  <div className="flex justify-between items-center mb-8">
                    <p className={`text-xs font-black uppercase tracking-[0.3em] ${type === 'veg' ? 'text-green-600' : 'text-[#B11E48]'}`}>{type} Editor</p>
                    <button onClick={() => publishUpdate(type)} className="bg-[#B11E48] text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-md hover:scale-105 transition-all">PUBLISH LIVE</button>
                  </div>
                  <div className="flex gap-10">
                    <div className="w-1/3 aspect-square bg-[#FFFBEB] rounded-[3.5rem] overflow-hidden border border-[#B11E48]/10 shadow-inner">
                      <img src={bData.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="relative group">
                        <LinkIcon className="absolute left-4 top-4 text-stone-300 group-focus-within:text-[#B11E48]" size={16} />
                        <input value={bData.img} onChange={e => setBData({...bData, img: e.target.value})} className="w-full pl-12 p-4 bg-[#FFFBEB]/50 rounded-2xl text-xs font-mono border border-transparent focus:border-[#B11E48]/20 outline-none" placeholder="Paste Photo Link" />
                      </div>
                      <input value={bData.name} onChange={e => setBData({...bData, name: e.target.value})} className="w-full p-4 bg-[#FFFBEB]/50 rounded-2xl font-bold border border-transparent focus:border-[#B11E48]/20 outline-none" placeholder="Bowl Name" />
                      <div className="grid grid-cols-3 gap-3">
                        {['p', 'f', 'c'].map(macro => (
                          <div key={macro} className="bg-[#FFFBEB] p-4 rounded-2xl text-center shadow-inner">
                            <span className="block text-[8px] font-black text-stone-300 uppercase mb-1">{macro}</span>
                            <input value={bData[macro]} onChange={e => setBData({...bData, [macro]: e.target.value})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 flex flex-col h-[850px]">
            <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Gossip Feed</h3>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {reviews.map((r, i) => (
                <div key={i} className="p-6 bg-[#FFFBEB]/30 rounded-[2.5rem] border border-[#B11E48]/10 hover:bg-white transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-xs text-[#B11E48]">{r.name}</p>
                    <span className="text-[8px] font-black bg-white px-3 py-1.5 rounded-full border border-[#B11E48]/10">{r.tried}</span>
                  </div>
                  <p className="text-[10px] text-[#B11E48] font-bold mb-2 tracking-wide"><Phone size={10} className="inline mr-1" /> {r.phone}</p>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-4 leading-tight">{r.hustle} • {r.hood}</p>
                  <p className="text-[13px] text-stone-600 italic leading-relaxed">"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
