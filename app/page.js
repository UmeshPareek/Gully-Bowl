"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, Download, Users, LayoutDashboard, Utensils, Send, LogOut, CheckCircle } from 'lucide-react';

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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

export default function GullyBowlApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('user');
  const [selectedTab, setSelectedTab] = useState('Veg');
  const [adminList, setAdminList] = useState(["pareeku01@gmail.com"]);
  
  // Menu States
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "", p: "0", f: "0", c: "0", img: "" });
  
  // Admin Preview States (for the 2-step publish)
  const [previews, setPreviews] = useState({ veg: "", nv: "" });
  
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        onSnapshot(doc(db, "settings", "admins"), (d) => {
          const list = d.exists() ? d.data().emails : ["pareeku01@gmail.com"];
          setAdminList(list);
          if (list.includes(u.email)) setIsAdmin(true);
        });
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("date", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "activity"), orderBy("timestamp", "desc")), (s) => setLogs(s.docs.map(d => d.data())));
  }, []);

  const handleAdminUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `previews/${type}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPreviews(prev => ({ ...prev, [type]: url }));
    alert("Image uploaded to preview! Review below before publishing.");
  };

  const publishToConsumer = async (type) => {
    const data = type === 'veg' ? vegData : nvData;
    const finalImg = previews[type] || data.img;
    const updatedData = { ...data, img: finalImg };
    
    await setDoc(doc(db, "menu", type), updatedData);
    await addDoc(collection(db, "activity"), {
        admin: user.email,
        action: `Published ${type} bowl updates`,
        timestamp: new Date().toLocaleString()
    });
    alert(`${type.toUpperCase()} is now LIVE for consumers! 🚀`);
  };

  const addAdmin = async () => {
    const email = prompt("Enter new Admin Email:");
    if (email && !adminList.includes(email)) {
      const newList = [...adminList, email];
      await setDoc(doc(db, "settings", "admins"), { emails: newList });
      alert("New Admin added successfully!");
    }
  };

  const downloadCSV = () => {
    let csv = "Date,Name,Hustle,Hood,Tried,Review\n";
    reviews.forEach(r => {
      csv += `${r.date},${r.name},${r.hustle},${r.hood},${r.tried},"${r.text}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gully_Reviews_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-stone-100">
        <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">SIGN INTO THE GULLY</button>
      </div>
    </div>
  );

  const BowlDisplay = ({data, type}) => (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`w-3 h-3 rounded-full ${type === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <p className="text-[#B11E48] font-black text-[10px] uppercase tracking-[0.4em]">{type}</p>
      </div>
      <div className="aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white shadow-2xl mb-8">
        <img src={data.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={type} />
      </div>
      <h2 className="text-5xl font-serif font-black text-[#B11E48] text-center mb-3 tracking-tight">{data.name}</h2>
      <p className="text-center italic text-stone-400 mb-10 text-xl font-serif">"{data.tagline}"</p>
      <div className="grid grid-cols-3 gap-4">
        {[{l:'P', v:data.p, d:'Protein'}, {l:'F', v:data.f, d:'Fiber'}, {l:'C', v:data.c, d:'Calories'}].map(i => (
          <div key={i.l} className="bg-white p-6 rounded-[2.5rem] text-center shadow-sm border border-stone-50">
            <span className="block text-[10px] font-black text-[#B11E48] uppercase tracking-widest mb-1">{i.d}</span>
            <span className="text-2xl font-bold">{i.v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
      {/* --- PREMIUM NAVIGATION --- */}
      {isAdmin && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-black/90 text-white p-2 rounded-full shadow-2xl backdrop-blur-md">
          <button onClick={() => setView('user')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-[#B11E48] text-white' : 'hover:bg-white/10'}`}><Utensils size={14}/> Consumer</button>
          <button onClick={() => setView('admin')} className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'admin' ? 'bg-[#B11E48] text-white' : 'hover:bg-white/10'}`}><LayoutDashboard size={14}/> Admin</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-16 px-6 pb-32">
          <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" className="w-28 mx-auto mb-12" alt="Logo" />
          <div className="flex gap-2 mb-12 bg-stone-100 p-1.5 rounded-3xl">
            {['Veg', 'Non-Veg', 'Both'].map(t => (
              <button key={t} onClick={() => setSelectedTab(t)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedTab === t ? 'bg-white text-[#B11E48] shadow-md' : 'text-stone-400'}`}>{t}</button>
            ))}
          </div>
          {(selectedTab === 'Veg' || selectedTab === 'Both') && <BowlDisplay data={vegData} type="Veg" />}
          {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <BowlDisplay data={nvData} type="Non-Veg" />}
          
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-stone-50 mt-12">
            <h3 className="text-3xl font-serif font-black text-center italic text-[#B11E48] mb-8">The Verdict</h3>
            <div className="space-y-4">
              <input id="u-hustle" placeholder="What's your Hustle?" className="w-full p-5 bg-stone-50 rounded-2xl border-none outline-none ring-1 ring-stone-100 focus:ring-2 ring-[#B11E48]/20" />
              <input id="u-hood" placeholder="Which Hood?" className="w-full p-5 bg-stone-50 rounded-2xl border-none outline-none ring-1 ring-stone-100 focus:ring-2 ring-[#B11E48]/20" />
              <textarea id="u-text" placeholder="Roast or Toast the flavors..." className="w-full p-5 bg-stone-50 rounded-3xl h-32 border-none outline-none ring-1 ring-stone-100 focus:ring-2 ring-[#B11E48]/20"></textarea>
              <button onClick={async () => {
                await addDoc(collection(db, "reviews"), { name: user.displayName, hustle: document.getElementById('u-hustle').value, hood: document.getElementById('u-hood').value, tried: selectedTab, text: document.getElementById('u-text').value, date: new Date().toLocaleString() });
                window.location.href = `https://wa.me/917024185979?text=Gully Verdict! ${document.getElementById('u-text').value}`;
              }} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl flex items-center justify-center gap-3">SEND VERDICT <Send size={18}/></button>
            </div>
          </div>
        </main>
      ) : (
        /* --- MASSIVE ADMIN DASHBOARD --- */
        <main className="max-w-7xl mx-auto pt-16 px-8 pb-32">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-6xl font-serif font-black italic text-[#B11E48]">The Kitchen Desk</h2>
            <div className="flex gap-4">
              <button onClick={addAdmin} className="flex items-center gap-2 bg-white border border-stone-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase"><Users size={14}/> Add Admin</button>
              <button onClick={downloadCSV} className="flex items-center gap-2 bg-white border border-stone-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase"><Download size={14}/> Reviews (CSV)</button>
              <button onClick={() => auth.signOut()} className="bg-stone-100 p-3 rounded-2xl text-stone-500"><LogOut size={18}/></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {/* VEG AND NON-VEG EDITORS */}
              {[ {id: 'veg', label: 'Veg Bowl', data: vegData, set: setVegData, color: 'text-green-600'}, 
                 {id: 'nonveg', label: 'Non-Veg Bowl', data: nvData, set: setNvData, color: 'text-red-600'} ].map(bowl => (
                <div key={bowl.id} className="bg-white p-10 rounded-[4rem] shadow-sm border border-stone-100">
                  <div className="flex justify-between items-center mb-8">
                    <p className={`text-xs font-black uppercase tracking-[0.3em] ${bowl.color}`}>{bowl.label} Control</p>
                    <button onClick={() => publishToConsumer(bowl.id)} className="bg-[#B11E48] text-white px-8 py-3 rounded-2xl text-[10px] font-black flex items-center gap-2">PUBLISH LIVE <CheckCircle size={14}/></button>
                  </div>
                  <div className="flex gap-10">
                    <div className="w-1/3 aspect-square bg-stone-50 rounded-[3rem] overflow-hidden relative border-2 border-dashed border-stone-200 group">
                      <img src={previews[bowl.id] || bowl.data.img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white">
                        <Camera size={32} />
                        <span className="text-[10px] font-bold mt-2">CHANGE PHOTO</span>
                      </div>
                      <input type="file" onChange={(e) => handleAdminUpload(e, bowl.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <input value={bowl.data.name} onChange={e => bowl.set({...bowl.data, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl font-bold" placeholder="Bowl Name" />
                      <textarea value={bowl.data.tagline} onChange={e => bowl.set({...bowl.data, tagline: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl text-sm italic h-20" placeholder="Tagline..." />
                      <div className="grid grid-cols-3 gap-3">
                        {['p', 'f', 'c'].map(macro => (
                          <div key={macro} className="bg-stone-50 p-4 rounded-2xl">
                            <span className="block text-[8px] font-black text-stone-400 uppercase mb-1">{macro}</span>
                            <input value={bowl.data[macro]} onChange={e => bowl.set({...bowl.data, [macro]: e.target.value})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* LIVE FEEDBACK DASHBOARD */}
            <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-stone-100 flex flex-col h-[900px]">
              <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Live Gossip</h3>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {reviews.map((r, i) => (
                  <div key={i} className="p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-black text-xs text-[#B11E48]">{r.name}</p>
                      <span className="text-[8px] font-black bg-white px-3 py-1.5 rounded-full border border-stone-100">{r.tried}</span>
                    </div>
                    <p className="text-[9px] text-stone-400 font-bold uppercase mb-4">{r.hustle} • {r.hood}</p>
                    <p className="text-[13px] text-stone-600 leading-relaxed italic">"{r.text}"</p>
                    <p className="text-[8px] text-stone-300 mt-4 text-right font-bold uppercase">{r.date}</p>
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
