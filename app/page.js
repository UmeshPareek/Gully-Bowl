"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, ShieldCheck, ArrowUpDown, Trash2, ShoppingBag, Clock, Plus, Minus, ClipboardList, MessageSquare, Tag, Flame, Zap, Wheat, Navigation, Map, CreditCard, IndianRupee } from 'lucide-react';

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
  const [userMode, setUserMode] = useState(null); 
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", img: "", p: "0", f: "0", c: "0" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", img: "", p: "0", f: "0", c: "0" });
  const [paySettings, setPaySettings] = useState({ fee: "150", upi: "pareeku01@okaxis" });
  const [isOrderActive, setIsOrderActive] = useState(false);
  
  const [cart, setCart] = useState({ veg: 0, nonveg: 0 });
  const [reviews, setReviews] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeDate, setActiveDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [adminTab, setAdminTab] = useState('orders'); 
  const [sortOrder, setSortOrder] = useState('desc');

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
    onSnapshot(doc(db, "settings", "payment"), (d) => d.exists() && setPaySettings(d.data()));
    onSnapshot(doc(db, "settings", "orderControl"), (d) => d.exists() && setIsOrderActive(d.data().active));
    
    onSnapshot(query(collection(db, "reviews"), orderBy("timestamp", sortOrder)), (s) => {
        const allData = s.docs.map(d => d.data());
        setReviews(allData.filter(r => !r.trialDate || r.trialDate === activeDate));
    });

    onSnapshot(query(collection(db, "orders"), where("trialDate", "==", activeDate), orderBy("timestamp", sortOrder)), (s) => setAllOrders(s.docs.map(d => d.data())));
    onSnapshot(query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(8)), (s) => setLogs(s.docs.map(d => d.data())));
    
    return () => unsubscribe();
  }, [activeDate, sortOrder]);

  const totals = allOrders.reduce((acc, curr) => ({
    veg: acc.veg + (curr.vegQty || 0),
    nv: acc.nv + (curr.nvQty || 0),
    total: acc.total + (curr.vegQty || 0) + (curr.nvQty || 0)
  }), { veg: 0, nv: 0, total: 0 });

  const handlePlaceOrder = async () => {
    const p = document.getElementById('o-phone').value;
    const a = document.getElementById('o-addr').value;
    const m = document.getElementById('o-maps').value;
    if(!p || !a || (cart.veg + cart.nonveg === 0)) return alert("Quantity & Address Required!");

    const orderData = { 
        name: user.displayName, phone: p, fullAddress: a, mapsLink: m,
        vegQty: cart.veg, nvQty: cart.nonveg, trialDate: activeDate, 
        fee: paySettings.fee, timestamp: Date.now(), date: new Date().toLocaleString() 
    };

    const upiIntent = `upi://pay?pa=${paySettings.upi}&pn=Gully%20Bowl&am=${paySettings.fee}&cu=INR&tn=DeliveryFee_Batch_${activeDate}`;
    await addDoc(collection(db, "orders"), orderData);
    
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = upiIntent;
    } else {
        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntent)}`, '_blank');
    }
    setUserMode(null);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl text-center max-w-sm w-full border border-[#B11E48]/10">
        <img src={BRAND_LOGO} className="w-32 md:w-40 mx-auto mb-8" alt="Gully Bowl" />
        <button onClick={() => signInWithPopup(auth, provider)} className="w-full py-4 bg-[#B11E48] text-white rounded-2xl font-black shadow-xl uppercase">Enter Gully</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] pb-24 font-sans overflow-x-hidden">
      {isAdmin && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-[#B11E48] text-white p-1.5 rounded-full shadow-2xl w-max max-w-[90%]">
          <button onClick={() => setView('user')} className={`px-5 py-2.5 rounded-full text-[10px] font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Store</button>
          <button onClick={() => setView('admin')} className={`px-5 py-2.5 rounded-full text-[10px] font-bold transition-all ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="w-full max-w-md mx-auto pt-8 md:pt-16 px-4">
          <img src={BRAND_LOGO} className="w-24 md:w-28 mx-auto mb-8 md:mb-10" alt="Logo" />
          {!userMode ? (
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-[#B11E48]/5 text-center space-y-4 md:space-y-6">
              <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#B11E48]">The Gully Path</h3>
              <button onClick={() => setUserMode('order')} className="w-full py-5 md:py-6 bg-[#B11E48] text-white rounded-[1.5rem] md:rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3">ORDER BOWL <ShoppingBag size={18}/></button>
              <button onClick={() => setUserMode('review')} className="w-full py-5 md:py-6 bg-white border-2 border-[#B11E48] text-[#B11E48] rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3">GIVE VERDICT <MessageSquare size={18}/></button>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4">
               {[ {id:'veg', data:vegData, tag:'100% VEG', dot:'bg-green-600', txt:'text-green-600'}, {id:'nonveg', data:nvData, tag:'NON-VEG', dot:'bg-[#B11E48]', txt:'text-[#B11E48]'} ].map(item => (
                 <div key={item.id} className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-[#B11E48]/5 overflow-hidden">
                    <div className="relative aspect-square bg-stone-100">
                        <img src={item.data.img || "https://images.unsplash.com"} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${item.dot}`}></div>
                            <span className={`text-[7px] md:text-[8px] font-black tracking-widest ${item.txt}`}>{item.tag}</span>
                        </div>
                    </div>
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex-1">
                                <h3 className="text-3xl md:text-4xl font-serif font-black text-[#B11E48] leading-none">{item.data.name}</h3>
                                <p className="text-[9px] md:text-[10px] font-bold text-stone-400 mt-1 italic uppercase tracking-tight line-clamp-1">"{item.data.tagline}"</p>
                            </div>
                            {userMode === 'order' && (
                                <div className="flex items-center gap-3 bg-[#FFFBEB] p-1.5 rounded-xl border border-[#B11E48]/10">
                                    <button onClick={() => setCart({...cart, [item.id]: Math.max(0, cart[item.id]-1)})} className="p-1.5 text-[#B11E48]"><Minus size={14}/></button>
                                    <span className="font-black text-lg w-4 text-center">{cart[item.id]}</span>
                                    <button onClick={() => setCart({...cart, [item.id]: cart[item.id]+1})} className="p-1.5 text-[#B11E48]"><Plus size={14}/></button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:gap-3 pt-6 border-t border-stone-50">
                            <div className="bg-[#FFFBEB] p-3 rounded-2xl text-center">
                                <Zap size={14} className="mx-auto mb-1 text-[#B11E48]" /><p className="text-[7px] font-black text-[#B11E48]/60 uppercase tracking-widest leading-none mb-1">Protein</p><p className="text-sm md:text-xl font-black">{item.data.p}g</p>
                            </div>
                            <div className="bg-[#FFFBEB] p-3 rounded-2xl text-center">
                                <Wheat size={14} className="mx-auto mb-1 text-[#B11E48]" /><p className="text-[7px] font-black text-[#B11E48]/60 uppercase tracking-widest leading-none mb-1">Fiber</p><p className="text-sm md:text-xl font-black">{item.data.f}g</p>
                            </div>
                            <div className="bg-[#FFFBEB] p-3 rounded-2xl text-center">
                                <Flame size={14} className="mx-auto mb-1 text-[#B11E48]" /><p className="text-[7px] font-black text-[#B11E48]/60 uppercase tracking-widest leading-none mb-1">Calories</p><p className="text-sm md:text-xl font-black">{item.data.c}</p>
                            </div>
                        </div>
                    </div>
                 </div>
               ))}
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-[#B11E48]/5 space-y-4 mb-8">
                  <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#B11E48] text-center">{userMode === 'order' ? 'Checkout' : 'Verdict'}</h3>
                  {userMode === 'order' ? (
                    <>
                        <p className="text-[9px] text-center font-black text-green-600 uppercase mb-4 tracking-tighter">BOWL IS FREE • DELIVERY ₹{paySettings.fee}</p>
                        <div className="space-y-3">
                            <input id="o-phone" type="tel" placeholder="Mobile Number *" className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 text-sm" />
                            <textarea id="o-addr" placeholder="Flat No, Building, Location *" className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 h-20 md:h-24 text-sm"></textarea>
                            <input id="o-maps" placeholder="Google Maps Link" className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 text-sm" />
                        </div>
                        <button onClick={handlePlaceOrder} className="w-full bg-[#B11E48] text-white py-5 rounded-[2rem] font-black shadow-xl uppercase mt-2">Pay & Confirm</button>
                    </>
                  ) : (
                    <>
                        <input id="u-phone" type="tel" placeholder="Mobile Number *" className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 text-sm" />
                        <input id="u-hustle" placeholder="Your Profession? *" className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10 text-sm" />
                        <textarea id="u-veg-text" placeholder="Veg Verdict..." className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl h-20 outline-none border border-[#B11E48]/10 text-sm"></textarea>
                        <textarea id="u-nv-text" placeholder="NV Verdict..." className="w-full p-4 md:p-5 bg-[#FFFBEB]/40 rounded-2xl h-20 outline-none border border-[#B11E48]/10 text-sm"></textarea>
                        <button onClick={async () => {
                            const p = document.getElementById('u-phone').value;
                            if(!p) return alert("Phone Required!");
                            await addDoc(collection(db, "reviews"), { name: user.displayName, phone: p, hustle: document.getElementById('u-hustle').value, vegText: document.getElementById('u-veg-text').value, nvText: document.getElementById('u-nv-text').value, timestamp: Date.now(), trialDate: activeDate, date: new Date().toLocaleString() });
                            alert("Gossip Received! 🥣"); setUserMode(null);
                        }} className="w-full bg-[#B11E48] text-white py-5 rounded-[2rem] font-black shadow-xl uppercase mt-2">Submit Verdict</button>
                    </>
                  )}
                  <button onClick={() => setUserMode(null)} className="w-full py-2 text-[10px] font-black text-stone-300 uppercase tracking-widest text-center">Back</button>
               </div>
            </div>
          )}
        </main>
      ) : (
        /* --- ADMIN DASHBOARD --- */
        <main className="w-full max-w-7xl mx-auto pt-8 md:pt-16 px-4 md:px-8 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                <div><h2 className="text-4xl md:text-5xl font-serif font-black italic text-[#B11E48]">Operational Control</h2>
                    <div className="flex gap-2 md:gap-4 mt-4 bg-white p-1.5 rounded-2xl border border-[#B11E48]/5">
                        <button onClick={() => setAdminTab('orders')} className={`px-4 md:px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'orders' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}>Orders</button>
                        <button onClick={() => setAdminTab('reviews')} className={`px-4 md:px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'reviews' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}>Reviews</button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4 items-center w-full md:w-auto">
                    <div className="bg-white border border-[#B11E48]/10 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm flex-1 md:flex-none">
                        <Calendar size={14} className="text-[#B11E48]"/><input type="date" value={activeDate.split('/').reverse().join('-')} onChange={(e) => setActiveDate(new Date(e.target.value).toLocaleDateString('en-GB'))} className="text-[10px] font-black outline-none bg-transparent w-full" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="bg-white border border-[#B11E48]/10 p-3 rounded-xl text-[#B11E48] shadow-sm"><ArrowUpDown size={16}/></button>
                        <button onClick={() => exportData(adminTab)} className="bg-[#B11E48] text-white p-3 rounded-xl shadow-lg"><Download size={16}/></button>
                        <button onClick={() => signOut(auth)} className="bg-white border border-[#B11E48]/10 p-3 rounded-xl text-[#B11E48]"><LogOut size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
                <div className="xl:col-span-1 space-y-6 md:space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4 italic">Daily Fulfillment ({activeDate})</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center"><p className="text-[10px] font-bold text-green-600 uppercase">Veg Total</p><p className="text-xl font-black">{totals.veg}</p></div>
                            <div className="flex justify-between items-center"><p className="text-[10px] font-bold text-[#B11E48] uppercase">Meat Total</p><p className="text-xl font-black">{totals.nv}</p></div>
                            <div className="pt-3 border-t flex justify-between items-center"><p className="text-xs font-black uppercase">Grand Total</p><p className="text-3xl font-black text-[#B11E48]">{totals.total}</p></div>
                        </div>
                    </div>
                    {['veg', 'nonveg'].map(type => {
                        const data = type === 'veg' ? vegData : nvData;
                        const set = type === 'veg' ? setVegData : setNvData;
                        return (
                        <div key={type} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#B11E48]/5">
                            <p className="text-[9px] font-black uppercase text-stone-400 mb-4 italic">{type} Bowl Manager</p>
                            <div className="space-y-2.5">
                                <input value={data.img} onChange={e => set({...data, img: e.target.value})} className="w-full p-2.5 bg-[#FFFBEB]/50 rounded-xl text-[9px] font-mono outline-none" placeholder="Image URL" />
                                <input value={data.name} onChange={e => set({...data, name: e.target.value})} className="w-full p-2.5 bg-[#FFFBEB]/50 rounded-xl font-bold text-[10px]" placeholder="Bowl Name" />
                                <input value={data.tagline} onChange={e => set({...data, tagline: e.target.value})} className="w-full p-2.5 bg-[#FFFBEB]/50 rounded-xl italic text-[10px]" placeholder="Description..." />
                                <div className="grid grid-cols-3 gap-1.5">{['p', 'f', 'c'].map(m => (<input key={m} value={data[m]} onChange={e => set({...data, [m]: e.target.value})} className="w-full p-1.5 bg-[#FFFBEB] rounded-lg text-center font-bold text-[10px]" placeholder={m.toUpperCase()} />))}</div>
                                <button onClick={() => setDoc(doc(db, "menu", type), data)} className="w-full bg-[#B11E48] text-white py-2.5 rounded-xl text-[9px] font-black uppercase shadow-sm">Update Live</button>
                            </div>
                        </div>
                    )})}
                </div>

                <div className="xl:col-span-3">
                    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-[#B11E48]/5 min-h-[600px] flex flex-col">
                        <h3 className="text-2xl md:text-3xl font-serif font-black italic text-[#B11E48] mb-6 md:mb-8">{adminTab === 'orders' ? 'Batch Orders' : 'Trial Gossip'}</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 md:pr-4 custom-scrollbar">
                            {adminTab === 'orders' ? (
                                allOrders.length === 0 ? <p className="text-center py-20 italic opacity-20 text-stone-400">No orders logged.</p> : allOrders.map((o, i) => (
                                    <div key={i} className="p-5 md:p-6 bg-[#FFFBEB]/50 rounded-[1.5rem] md:rounded-[2.5rem] border border-[#B11E48]/5 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div><p className="font-black text-md md:text-lg text-[#B11E48] uppercase leading-none tracking-tighter">{o.name}</p><p className="text-[10px] font-bold text-stone-400 mt-2">{o.phone}</p></div>
                                            <div className="flex gap-2">{o.vegQty > 0 && <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-[9px] font-black shadow-sm">VEG: {o.vegQty}</span>}{o.nvQty > 0 && <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-[9px] font-black shadow-sm">NV: {o.nvQty}</span>}</div>
                                        </div>
                                        <div className="pt-3 border-t border-stone-100 flex items-start gap-3">
                                            <MapPin size={16} className="text-[#B11E48] shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-stone-600 leading-snug uppercase tracking-tight line-clamp-2">{o.fullAddress}</p>
                                                {o.mapsLink && <a href={o.mapsLink} target="_blank" className="inline-flex items-center gap-2 mt-2 text-[9px] font-black text-white bg-[#B11E48] px-3 py-1.5 rounded-lg"><Navigation size={10}/> GOOGLE MAPS</a>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                reviews.length === 0 ? <p className="text-center py-20 italic opacity-20 text-stone-400">No verdicts found.</p> : reviews.map((r, i) => (
                                    <div key={i} className="p-6 md:p-8 bg-[#FFFBEB]/30 rounded-[1.5rem] md:rounded-[3.5rem] border border-[#B11E48]/10">
                                        <div className="flex justify-between items-start mb-4 md:mb-6">
                                            <div>
                                                <p className="font-black text-lg md:text-xl text-[#B11E48] uppercase tracking-tighter">{r.name}</p>
                                                <p className="text-[9px] font-bold text-stone-400 tracking-widest">{r.phone} • {r.hustle || "Sampler"}</p>
                                            </div>
                                            <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{r.trialDate || "Legacy"}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                            {(r.vegText || r.text) && <div className="p-4 bg-white rounded-2xl border border-green-50 text-[11px] italic text-stone-600 leading-relaxed shadow-sm">Veg: {r.vegText || r.text}</div>}
                                            {r.nvText && <div className="p-4 bg-white rounded-2xl border border-red-50 text-[11px] italic text-stone-600 leading-relaxed shadow-sm">Meat: {r.nvText}</div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
      )}
    </div>
  );
}
