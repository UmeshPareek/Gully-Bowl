"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- GULLY BOWL FIREBASE CONFIG ---
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
  const [bowlType, setBowlType] = useState('Veg'); 
  const [bowlData, setBowlData] = useState({ name: "Gully Special", tagline: "Street flavors meet gourmet soul.", p: "22g", f: "10g", c: "410", img: "", isVeg: true });
  const [reviews, setReviews] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        if (u.email === "pareeku01@gmail.com") setIsAdmin(true);
      }
    });
    onSnapshot(doc(db, "settings", "currentBowl"), (d) => d.exists() && setBowlData(d.data()));
    onSnapshot(query(collection(db, "reviews"), orderBy("date", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "activity"), orderBy("timestamp", "desc")), (s) => setActivity(s.docs.map(d => d.data())));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const storageRef = ref(storage, `bowls/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setBowlData({ ...bowlData, img: url });
  };

  const saveUpdates = async () => {
    await setDoc(doc(db, "settings", "currentBowl"), bowlData);
    await addDoc(collection(db, "activity"), { bowl: bowlData.name, admin: user.email, timestamp: new Date().toLocaleString(), type: "Design Update" });
    alert("Live changes published to Gully Bowl! 🚀");
  };

  const submitReview = async () => {
    const hustle = document.getElementById('u-hustle').value;
    const hood = document.getElementById('u-hood').value;
    const text = document.getElementById('u-text').value;

    if(!hustle || !hood || !text) return alert("Don't be shy! Fill all fields so we know you better.");

    const review = {
        name: user.displayName,
        hustle: hustle,
        hood: hood,
        typeTried: bowlType,
        text: text,
        date: new Date().toLocaleString()
    };
    
    await addDoc(collection(db, "reviews"), review);

    const waNumber = "917024185979";
    const waMessage = 
        `*GULLY BOWL VERDICT* 🥗%0A%0A` +
        `*From:* ${user.displayName}%0A` +
        `*Hustle:* ${hustle}%0A` +
        `*The Hood:* ${hood}%0A%0A` +
        `*I Crushed:* ${bowlType}%0A` +
        `*Feedback:* "${text}"%0A%0A` +
        `_Sent via Gully Bowl Digital Experience_`;

    window.location.href = `https://wa.me/${waNumber}?text=${waMessage}`;
  };

  const downloadExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Name,Hustle,Hood,Bowl Type,Review\n";
    reviews.forEach(r => {
      csvContent += `${r.date},${r.name},${r.hustle},${r.hood},${r.typeTried},"${r.text.replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Gully_Bowl_Reviews.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-stone-100">
            <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" alt="Gully Bowl" className="w-40 mx-auto mb-6" />
            <p className="text-stone-500 mb-8 font-medium italic">"Street flavors, gourmet soul."</p>
            <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg">
                Continue with Google ⚡
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
      {isAdmin && (
        <nav className="fixed top-4 right-4 z-50 flex gap-2 bg-black/5 p-1 rounded-full backdrop-blur-md">
          <button onClick={() => setView('user')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${view === 'user' ? 'bg-white text-black shadow-sm' : 'text-stone-500'}`}>Consumer View</button>
          <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${view === 'admin' ? 'bg-[#B11E48] text-white shadow-sm' : 'text-stone-500'}`}>Admin Desk</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-12 px-6 pb-20">
            <header className="text-center mb-10">
                <img src="https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png" alt="Gully Bowl" className="w-32 mx-auto mb-4" />
                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className={`w-2.5 h-2.5 rounded-full ${bowlData.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <p className="text-[#B11E48] font-black text-[9px] uppercase tracking-[0.3em]">{bowlData.isVeg ? 'Pure Veg' : 'Non-Veg'}</p>
                </div>
                <div className="aspect-square rounded-[3rem] bg-white shadow-2xl overflow-hidden border-[10px] border-white relative transition-transform hover:scale-[1.02]">
                    <img src={bowlData.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000"} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-3xl font-serif font-bold mt-8 mb-2 tracking-tight text-[#B11E48]">{bowlData.name}</h2>
                <p className="text-lg font-serif italic text-stone-500 px-4 leading-snug">"{bowlData.tagline}"</p>
            </header>

            <div className="space-y-8">
                <div className="grid grid-cols-3 gap-3">
                    {[{l:'Protein', k:'p'}, {l:'Fiber', k:'f'}, {l:'Calories', k:'c'}].map((m) => (
                        <div key={m.k} className="bg-white p-5 rounded-[2rem] text-center shadow-sm border border-stone-50">
                            <span className="block text-[9px] font-black text-[#B11E48] uppercase mb-1">{m.l}</span>
                            <span className="text-xl font-bold">{bowlData[m.k]}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-50 space-y-8">
                    <div className="text-center">
                        <h3 className="font-serif text-3xl font-bold italic text-[#B11E48]">The Verdict</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">What's your hustle?</label>
                                <input id="u-hustle" placeholder="eg. Creative Ninja, Developer" className="w-full p-4 bg-stone-50 rounded-2xl outline-none text-sm font-semibold focus:ring-2 ring-[#B11E48]/10" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Where do you hang your hat?</label>
                                <input id="u-hood" placeholder="eg. Indiranagar, South Delhi" className="w-full p-4 bg-stone-50 rounded-2xl outline-none text-sm font-semibold focus:ring-2 ring-[#B11E48]/10" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">What did you crush?</label>
                            <div className="flex gap-2 mt-2">
                                {['Veg', 'Non-Veg', 'Both'].map(t => (
                                    <button key={t} onClick={() => setBowlType(t)} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${bowlType === t ? 'bg-[#B11E48] border-[#B11E48] text-white shadow-lg scale-105' : 'bg-stone-50 border-transparent text-stone-400'}`}>{t}</button>
                                ))}
                            </div>
                        </div>

                        <textarea id="u-text" placeholder="Be raw. Be Gully. Tell us how it was..." className="w-full p-6 bg-stone-50 rounded-[2.5rem] h-40 outline-none text-sm italic resize-none"></textarea>
                        <button onClick={submitReview} className="w-full bg-[#B11E48] text-white py-5 rounded-3xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            Submit My Roast/Toast 🥗
                        </button>
                    </div>
                </div>
            </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto pt-24 px-8 pb-20">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Gully Admin</h2>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-2">Operational Control</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={downloadExcel} className="bg-white border-2 border-stone-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm">Download Reviews</button>
                    <button onClick={saveUpdates} className="bg-[#B11E48] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:opacity-90 transition-all">Publish Live</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-stone-100 grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <input value={bowlData.name} onChange={e => setBowlData({...bowlData, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-xl font-bold border-none outline-none ring-1 ring-stone-100" placeholder="Bowl Name" />
                            <textarea value={bowlData.tagline} onChange={e => setBowlData({...bowlData, tagline: e.target.value})} className="w-full p-4 bg-stone-50 rounded-xl text-sm border-none outline-none ring-1 ring-stone-100" rows="2" placeholder="Tagline" />
                            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl ring-1 ring-stone-100">
                                <span className="text-[10px] font-black uppercase text-stone-400">Pure Veg?</span>
                                <input type="checkbox" checked={bowlData.isVeg} onChange={e => setBowlData({...bowlData, isVeg: e.target.checked})} className="w-6 h-6 accent-[#B11E48]" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input value={bowlData.p} onChange={e => setBowlData({...bowlData, p: e.target.value})} placeholder="P" className="p-4 bg-stone-50 rounded-xl text-center font-bold outline-none ring-1 ring-stone-100" />
                                <input value={bowlData.f} onChange={e => setBowlData({...bowlData, f: e.target.value})} placeholder="F" className="p-4 bg-stone-50 rounded-xl text-center font-bold outline-none ring-1 ring-stone-100" />
                                <input value={bowlData.c} onChange={e => setBowlData({...bowlData, c: e.target.value})} placeholder="C" className="p-4 bg-stone-50 rounded-xl text-center font-bold outline-none ring-1 ring-stone-100" />
                            </div>
                        </div>
                        <div className="border-2 border-dashed rounded-[3.5rem] border-stone-100 flex flex-col items-center justify-center p-8 bg-stone-50/50 hover:bg-stone-50 cursor-pointer relative transition-all group">
                            <span className="text-4xl">📸</span>
                            <p className="text-[9px] font-black uppercase mt-4 text-stone-400 text-center">Update Photo</p>
                            <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-stone-100 h-[650px] flex flex-col">
                    <h3 className="font-serif text-2xl font-bold mb-6 italic text-[#B11E48]">Gully Gossip</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {reviews.length === 0 ? <p className="text-xs text-stone-300 italic">No gossip yet...</p> : reviews.map((r, i) => (
                            <div key={i} className="p-5 bg-stone-50 rounded-[2rem] border border-stone-100 shadow-sm hover:bg-white transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-black text-[11px] text-[#B11E48]">{r.name}</p>
                                    <span className="text-[7px] font-black bg-white px-2 py-1 rounded-full border border-stone-100 uppercase">{r.typeTried}</span>
                                </div>
                                <p className="text-[9px] text-stone-400 font-bold uppercase mb-2 italic">{r.hustle} • {r.hood}</p>
                                <p className="text-[11px] text-stone-600 leading-relaxed italic">"{r.text}"</p>
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
