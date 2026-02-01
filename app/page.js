"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// LIST OF ADMINS
const ALLOWED_ADMINS = ["pareeku01@gmail.com", "admin2@gmail.com"]; 

export default function GullyBowlApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('user');
  const [selectedTab, setSelectedTab] = useState('Veg'); 
  
  // States for Veg & Non-Veg Data
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "", p: "0", f: "0", c: "0", img: "" });
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        if (ALLOWED_ADMINS.includes(u.email)) setIsAdmin(true);
      }
    });

    onSnapshot(doc(db, "menu", "veg"), (d) => d.exists() && setVegData(d.data()));
    onSnapshot(doc(db, "menu", "nonveg"), (d) => d.exists() && setNvData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("date", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "activity"), orderBy("timestamp", "desc")), (s) => setLogs(s.docs.map(d => d.data())));
  }, []);

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `menu/${type}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    if (type === 'veg') setVegData({...vegData, img: url});
    else setNvData({...nvData, img: url});
  };

  const saveAdminData = async (type) => {
    const data = type === 'veg' ? vegData : nvData;
    await setDoc(doc(db, "menu", type), data);
    await addDoc(collection(db, "activity"), {
        admin: user.email,
        action: `Updated ${type} bowl`,
        timestamp: new Date().toLocaleString()
    });
    alert(`${type.toUpperCase()} updated!`);
  };

  const submitReview = async () => {
    const review = {
        name: user.displayName,
        hustle: document.getElementById('u-hustle').value,
        hood: document.getElementById('u-hood').value,
        tried: selectedTab,
        text: document.getElementById('u-text').value,
        date: new Date().toLocaleString()
    };
    await addDoc(collection(db, "reviews"), review);
    window.location.href = `https://wa.me/917024185979?text=Gully Verdict from ${user.displayName}! Hustle: ${review.hustle}. Verdict: ${review.text}`;
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-stone-100">
            <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" className="w-32 mx-auto mb-6" alt="Logo" />
            <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-bold shadow-lg">Enter Gully ⚡</button>
        </div>
    </div>
  );

  const BowlCard = ({data, type}) => (
    <div className="mb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${type === 'Veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className="text-[#B11E48] font-black text-[10px] uppercase tracking-widest">{type}</p>
        </div>
        <div className="aspect-square rounded-[3rem] overflow-hidden border-[10px] border-white shadow-2xl mb-6">
            <img src={data.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} className="w-full h-full object-cover" alt={type} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#B11E48] text-center mb-2">{data.name}</h2>
        <p className="text-center italic text-stone-500 mb-6 px-4">"{data.tagline}"</p>
        <div className="grid grid-cols-3 gap-3">
            {[{l:'P', v:data.p}, {l:'F', v:data.f}, {l:'C', v:data.c}].map(i => (
                <div key={i.l} className="bg-white p-4 rounded-3xl text-center shadow-sm border border-stone-50">
                    <span className="block text-[10px] font-black text-[#B11E48]">{i.l}</span>
                    <span className="text-lg font-bold">{i.v}</span>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] pb-20">
      {isAdmin && (
        <nav className="fixed top-4 right-4 z-50 flex gap-2 glass p-1 rounded-full bg-white/50 backdrop-blur-md border border-[#B11E48]/20">
          <button onClick={() => setView('user')} className={`px-4 py-2 rounded-full text-[10px] font-bold ${view === 'user' ? 'bg-[#B11E48] text-white' : ''}`}>User View</button>
          <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-full text-[10px] font-bold ${view === 'admin' ? 'bg-[#B11E48] text-white' : ''}`}>Admin Desk</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-10 px-6">
            <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" className="w-24 mx-auto mb-8" alt="Logo" />
            
            <div className="flex gap-2 mb-10 bg-white p-1.5 rounded-2xl shadow-sm">
                {['Veg', 'Non-Veg', 'Both'].map(t => (
                    <button key={t} onClick={() => setSelectedTab(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all ${selectedTab === t ? 'bg-[#B11E48] text-white shadow-md' : 'text-stone-400'}`}>{t}</button>
                ))}
            </div>

            {(selectedTab === 'Veg' || selectedTab === 'Both') && <BowlCard data={vegData} type="Veg" />}
            {(selectedTab === 'Non-Veg' || selectedTab === 'Both') && <BowlCard data={nvData} type="Non-Veg" />}

            <div className="bg-white p-8 rounded-[3rem] shadow-xl space-y-6 border border-stone-50">
                <h3 className="text-2xl font-serif font-bold text-center italic text-[#B11E48]">The Verdict</h3>
                <input id="u-hustle" placeholder="Your Hustle?" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-[#B11E48]/30 transition-all" />
                <input id="u-hood" placeholder="Your Hood?" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-[#B11E48]/30 transition-all" />
                <textarea id="u-text" placeholder="Roast or Toast us..." className="w-full p-4 bg-stone-50 rounded-2xl h-32 outline-none border border-stone-100 focus:border-[#B11E48]/30 transition-all"></textarea>
                <button onClick={submitReview} className="w-full bg-[#B11E48] text-white py-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">Send it 🥗</button>
            </div>
        </main>
      ) : (
        /* --- ENHANCED ADMIN --- */
        <main className="max-w-6xl mx-auto pt-24 px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <h2 className="text-4xl font-serif font-bold text-[#B11E48]">Operational Control</h2>
                
                {/* Veg Manager */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex gap-8">
                    <div className="w-1/3 aspect-square bg-stone-50 rounded-3xl overflow-hidden relative border">
                        <img src={vegData.img} className="w-full h-full object-cover" />
                        <input type="file" onChange={(e) => handleUpload(e, 'veg')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Veg Bowl Editor</p>
                        <input value={vegData.name} onChange={e => setVegData({...vegData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl" placeholder="Veg Name" />
                        <div className="flex gap-2">
                            <input value={vegData.p} onChange={e => setVegData({...vegData, p: e.target.value})} placeholder="P" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                            <input value={vegData.f} onChange={e => setVegData({...vegData, f: e.target.value})} placeholder="F" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                            <input value={vegData.c} onChange={e => setVegData({...vegData, c: e.target.value})} placeholder="C" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                        </div>
                        <button onClick={() => saveAdminData('veg')} className="bg-[#B11E48] text-white px-6 py-2 rounded-xl text-[10px] font-bold">SAVE VEG</button>
                    </div>
                </div>

                {/* Non-Veg Manager */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex gap-8">
                    <div className="w-1/3 aspect-square bg-stone-50 rounded-3xl overflow-hidden relative border">
                        <img src={nvData.img} className="w-full h-full object-cover" />
                        <input type="file" onChange={(e) => handleUpload(e, 'nonveg')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Non-Veg Bowl Editor</p>
                        <input value={nvData.name} onChange={e => setNvData({...nvData, name: e.target.value})} className="w-full p-3 bg-stone-50 rounded-xl" placeholder="Non-Veg Name" />
                        <div className="flex gap-2">
                            <input value={nvData.p} onChange={e => setNvData({...nvData, p: e.target.value})} placeholder="P" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                            <input value={nvData.f} onChange={e => setNvData({...nvData, f: e.target.value})} placeholder="F" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                            <input value={nvData.c} onChange={e => setNvData({...nvData, c: e.target.value})} placeholder="C" className="w-1/3 p-3 bg-stone-50 rounded-xl text-center" />
                        </div>
                        <button onClick={() => saveAdminData('nonveg')} className="bg-[#B11E48] text-white px-6 py-2 rounded-xl text-[10px] font-bold">SAVE NON-VEG</button>
                    </div>
                </div>

                {/* Admin Logs */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                    <h3 className="font-bold mb-4">Admin Activity Logs</h3>
                    <div className="space-y-2">
                        {logs.map((l, i) => (
                            <div key={i} className="text-[10px] flex justify-between py-2 border-b border-stone-50">
                                <span>{l.admin} {l.action}</span>
                                <span className="text-stone-400">{l.timestamp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 h-[800px] flex flex-col">
                <h3 className="font-serif text-2xl font-bold mb-6 italic text-[#B11E48]">Live Gossip (Reviews)</h3>
                <div className="flex-1 overflow-y-auto space-y-4">
                    {reviews.map((r, i) => (
                        <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-[11px] text-[#B11E48]">{r.name}</p>
                                <span className="text-[8px] font-black bg-white px-2 py-1 rounded-full border border-stone-100">{r.tried}</span>
                            </div>
                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-2 leading-tight">{r.hustle} • {r.hood}</p>
                            <p className="text-[11px] text-stone-600 leading-relaxed italic">"{r.text}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
      )}
    </div>
  );
}
