"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, TrendingUp, ShieldCheck, History, ArrowUpDown, Trash2, ShoppingBag, Clock, XCircle, Heart, Plus, Minus, ClipboardList, MessageSquare } from 'lucide-react';

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
  const [view, setView] = useState('user'); // 'user' or 'admin'
  const [userMode, setUserMode] = useState(null); // 'order' or 'review'
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [isOrderActive, setIsOrderActive] = useState(false);
  
  const [cart, setCart] = useState({ veg: 0, nonveg: 0 });
  const [reviews, setReviews] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTrialDate, setActiveTrialDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [adminSearch, setAdminSearch] = useState("");
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' or 'reviews'

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
    onSnapshot(doc(db, "settings", "orderControl"), (d) => d.exists() && setIsOrderActive(d.data().active));
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", "desc")), (s) => setReviews(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "orders"), orderBy("timestamp", "desc")), (s) => setAllOrders(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(10)), (s) => setLogs(s.docs.map(d => d.data())));
    
    return () => unsubscribe();
  }, []);

  const logAction = async (action) => {
    await addDoc(collection(db, "logs"), { admin: user.email, action, timestamp: Date.now(), date: new Date().toLocaleString() });
  };

  const handleAdminMgmt = async (email, action) => {
    if (user.email !== SUPER_ADMIN) return alert("Only Super Admin can edit access.");
    let newList = action === 'add' ? [...new Set([...adminList, email])] : adminList.filter(e => e !== email);
    await setDoc(doc(db, "settings", "admins"), { emails: newList });
    logAction(`${action === 'add' ? 'Added' : 'Removed'} admin: ${email}`);
  };

  const exportData = (type) => {
    const data = type === 'orders' ? allOrders : reviews;
    if (data.length === 0) return alert("No data to export!");
    const headers = type === 'orders' ? ["Date", "Name", "Mobile", "Hood", "Veg", "NV"] : ["Date", "Name", "Mobile", "Hustle", "Veg Review", "NV Review"];
    const rows = data.map(d => type === 'orders' ? [d.date, d.name, `'${d.phone}`, d.hood, d.vegQty, d.nvQty] : [d.date, d.name, `'${d.phone}`, d.hustle, `"${d.vegText}"`, `"${d.nvText}"`]);
    const csv = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;' }));
    link.download = `Gully_${type}_Report.csv`;
    link.click();
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl">LOG INTO THE GULLY</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-32 font-sans">
      {isAdmin && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-[#B11E48] text-white p-2 rounded-full shadow-2xl">
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Shop</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-16 px-6">
          <img src={BRAND_LOGO} className="w-28 mx-auto mb-10" alt="Logo" />
          
          {!userMode ? (
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-[#B11E48]/5 text-center space-y-6">
              <h3 className="text-3xl font-serif font-black italic text-[#B11E48]">Welcome, {user.displayName.split(' ')[0]}</h3>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Select your path</p>
              <button onClick={() => setUserMode('order')} className="w-full py-6 bg-[#B11E48] text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3">I WANT TO ORDER <ShoppingBag/></button>
              <button onClick={() => setUserMode('review')} className="w-full py-6 bg-white border-2 border-[#B11E48] text-[#B11E48] rounded-[2rem] font-black flex items-center justify-center gap-3">I WANT TO REVIEW <MessageSquare/></button>
              <button onClick={() => signOut(auth)} className="text-[10px] font-black text-stone-300 uppercase tracking-widest pt-4">Sign Out</button>
            </div>
          ) : userMode === 'order' ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               {/* Product Cards */}
               {[ {id:'veg', data:vegData}, {id:'nonveg', data:nvData} ].map(item => (
                 <div key={item.id} className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5">
                    <div className="aspect-square rounded-[3rem] overflow-hidden mb-6 shadow-inner"><img src={item.data.img || "https://images.unsplash.com"} className="w-full h-full object-cover" /></div>
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-2xl font-serif font-black text-[#B11E48]">{item.data.name}</h3>
                        <div className="flex items-center gap-4 bg-[#FFFBEB] p-2 rounded-2xl border border-[#B11E48]/10">
                            <button onClick={() => setCart({...cart, [item.id]: Math.max(0, cart[item.id]-1)})} className="p-2 text-[#B11E48]"><Minus/></button>
                            <span className="font-black text-lg">{cart[item.id]}</span>
                            <button onClick={() => setCart({...cart, [item.id]: cart[item.id]+1})} className="p-2 text-[#B11E48]"><Plus/></button>
                        </div>
                    </div>
                 </div>
               ))}
               <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-[#B11E48]/5 space-y-4">
                  <h3 className="text-2xl font-serif font-black italic text-[#B11E48] text-center">Checkout</h3>
                  <p className="text-[10px] text-center font-black text-green-600 uppercase mb-4">Note: The bowl is on us, but delivery is by you! 🥣</p>
                  <input id="o-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                  <input id="o-hood" placeholder="Delivery Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                  <button onClick={async () => {
                    const p = document.getElementById('o-phone').value;
                    const h = document.getElementById('o-hood').value;
                    if(!p || !h || (cart.veg + cart.nonveg === 0)) return alert("Fill details & add bowls!");
                    await addDoc(collection(db, "orders"), { name: user.displayName, phone: p, hood: h, vegQty: cart.veg, nvQty: cart.nonveg, trialDate: activeTrialDate, timestamp: Date.now(), date: new Date().toLocaleString(), email: user.email });
                    alert("Order Confirmed! 🚀");
                    setUserMode(null);
                  }} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl uppercase">Place Order</button>
                  <button onClick={() => setUserMode(null)} className="w-full text-[10px] font-black text-stone-300 uppercase">Cancel</button>
               </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-[#B11E48]/5 space-y-4 animate-in slide-in-from-bottom-4">
                <h3 className="text-2xl font-serif font-black italic text-[#B11E48] text-center mb-6">Drop the Verdict</h3>
                <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                <input id="u-hustle" placeholder="Your Profession? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                <textarea id="u-veg-text" placeholder="Veg Bowl Verdict (Optional)..." className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-24 outline-none border border-[#B11E48]/10"></textarea>
                <textarea id="u-nv-text" placeholder="Non-Veg Bowl Verdict (Optional)..." className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-24 outline-none border border-[#B11E48]/10"></textarea>
                <button onClick={async () => {
                   const p = document.getElementById('u-phone').value;
                   const hu = document.getElementById('u-hustle').value;
                   if(!p || !hu) return alert("Fill mandatory fields!");
                   await addDoc(collection(db, "reviews"), { name: user.displayName, phone: p, hustle: hu, vegText: document.getElementById('u-veg-text').value, nvText: document.getElementById('u-nv-text').value, timestamp: Date.now(), date: new Date().toLocaleString(), trialDate: activeTrialDate });
                   alert("Verdict Received! 🥣");
                   setUserMode(null);
                }} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl">SUBMIT VERDICT</button>
                <button onClick={() => setUserMode(null)} className="w-full text-[10px] font-black text-stone-300 uppercase">Back</button>
            </div>
          )}
        </main>
      ) : (
        /* --- ADMIN DASHBOARD --- */
        <main className="max-w-screen-2xl mx-auto pt-16 px-8 flex flex-col">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Command</h2>
                    <div className="flex gap-4 mt-6 bg-white p-2 rounded-2xl border border-[#B11E48]/5">
                        <button onClick={() => setAdminTab('orders')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'orders' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}><ClipboardList size={14} className="inline mr-2"/> Order Desk</button>
                        <button onClick={() => setAdminTab('reviews')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'reviews' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}><MessageSquare size={14} className="inline mr-2"/> Review Desk</button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => exportData(adminTab)} className="bg-[#B11E48] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"><Download size={16}/> Export {adminTab}</button>
                    <button onClick={() => signOut(auth)} className="bg-white border border-[#B11E48]/10 p-4 rounded-2xl shadow-sm text-[#B11E48]"><LogOut/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Admin Controls Column */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><ShieldCheck size={20}/> Admin Access</h4>
                        {user.email === SUPER_ADMIN ? (
                            <div className="space-y-4">
                                <div className="flex gap-2"><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Email..." className="flex-1 bg-[#FFFBEB] p-3 rounded-xl text-xs outline-none" /><button onClick={() => { handleAdminMgmt(adminSearch, 'add'); setAdminSearch(""); }} className="bg-[#B11E48] text-white p-3 rounded-xl"><Plus size={16}/></button></div>
                                <div className="space-y-2">{adminList.map(email => (
                                    <div key={email} className="flex justify-between items-center bg-[#FFFBEB]/50 p-3 rounded-xl border border-[#B11E48]/5 text-[10px] font-bold">{email} {email !== SUPER_ADMIN && <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => handleAdminMgmt(email, 'remove')} />}</div>
                                ))}</div>
                            </div>
                        ) : <p className="text-[10px] italic text-stone-400">Restricted to Super Admin.</p>}
                    </div>
                    {/* Menu Editor */}
                    {['veg', 'nonveg'].map(type => (
                        <div key={type} className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                            <p className="text-[10px] font-black uppercase text-stone-400 mb-4">{type} Editor</p>
                            <input value={type === 'veg' ? vegData.img : nvData.img} onChange={e => type === 'veg' ? setVegData({...vegData, img: e.target.value}) : setNvData({...nvData, img: e.target.value})} className="w-full p-3 bg-[#FFFBEB] rounded-xl text-[10px] mb-2 outline-none" placeholder="PostImg URL" />
                            <button onClick={() => { setDoc(doc(db, "menu", type), type === 'veg' ? vegData : nvData); logAction(`Updated ${type} menu`); }} className="w-full bg-[#B11E48] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Publish</button>
                        </div>
                    ))}
                </div>

                {/* Main Management Area */}
                <div className="xl:col-span-3">
                    {adminTab === 'orders' ? (
                        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[800px] flex flex-col">
                            <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Delivery Tracker</h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                {allOrders.map((o, i) => (
                                    <div key={i} className="p-6 bg-[#FFFBEB]/50 rounded-[2.5rem] border border-[#B11E48]/5 flex justify-between items-center">
                                        <div><p className="font-black text-lg text-[#B11E48] uppercase tracking-tighter">{o.name}</p><p className="text-xs font-bold text-stone-400">{o.phone} • {o.hood}</p></div>
                                        <div className="flex gap-4">
                                            {o.vegQty > 0 && <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-black">VEG: {o.vegQty}</span>}
                                            {o.nvQty > 0 && <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-xs font-black">NV: {o.nvQty}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[800px] flex flex-col">
                            <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Verdict Feed</h3>
                            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                                {reviews.map((r, i) => (
                                    <div key={i} className="p-8 bg-[#FFFBEB]/30 rounded-[3.5rem] border border-[#B11E48]/10 transition-all hover:bg-white">
                                        <div className="flex justify-between items-start mb-6">
                                            <div><p className="font-black text-xl text-[#B11E48] uppercase tracking-tight">{r.name}</p><p className="text-xs font-bold text-stone-400">{r.phone} • {r.hustle}</p></div>
                                            <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{r.date}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {r.vegText && <div className="p-4 bg-white rounded-3xl border border-green-50 text-sm italic text-green-700">Veg: {r.vegText}</div>}
                                            {r.nvText && <div className="p-4 bg-white rounded-3xl border border-red-50 text-sm italic text-red-700">NV: {r.nvText}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
      )}
    </div>
  );
}
