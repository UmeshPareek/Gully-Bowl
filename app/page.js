"use client";
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Download, Users, LayoutDashboard, Utensils, Send, CheckCircle, Link as LinkIcon, Phone, User as UserIcon, MapPin, Briefcase, Camera, LogOut, Calendar, TrendingUp, ShieldCheck, History, ArrowUpDown, Trash2, ShoppingBag, Clock, XCircle, Heart, Plus, Minus, ClipboardList } from 'lucide-react';

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
  const [selectedTab, setSelectedTab] = useState('Veg');
  const [adminList, setAdminList] = useState(INITIAL_ADMINS);
  
  // Menu & Settings
  const [vegData, setVegData] = useState({ name: "Gully Green", tagline: "Gourmet Soul", p: "0", f: "0", c: "0", img: "" });
  const [nvData, setNvData] = useState({ name: "Gully Meat", tagline: "Street Flavors", p: "0", f: "0", c: "0", img: "" });
  const [isOrderActive, setIsOrderActive] = useState(false);
  
  // E-commerce Ordering States
  const [cart, setCart] = useState({ veg: 0, nonveg: 0 });
  const [hasOrdered, setHasOrdered] = useState(false);
  const [userOrder, setUserOrder] = useState(null);
  const [forceReviewView, setForceReviewView] = useState(false);
  const [enrollInterest, setEnrollInterest] = useState(false);

  // Admin Management
  const [reviews, setReviews] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTrialDate, setActiveTrialDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [adminSearch, setAdminSearch] = useState("");
  const [adminViewMode, setAdminViewMode] = useState('orders'); // 'orders' or 'reviews'

  const BRAND_LOGO = "https://raw.githubusercontent.com/UmeshPareek/Gully-Bowl/main/Gully%20Bowl%20Logo%20(2).png";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        onSnapshot(doc(db, "settings", "admins"), (d) => {
          let list = d.exists() ? d.data().emails : INITIAL_ADMINS;
          if (!list.includes(SUPER_ADMIN)) list = [SUPER_ADMIN, ...list];
          setAdminList(list);
          if (list.includes(u.email)) setIsAdmin(true);
        });

        onSnapshot(query(collection(db, "orders"), where("email", "==", u.email), where("trialDate", "==", activeTrialDate)), (s) => {
          if (!s.empty) {
            setHasOrdered(true);
            setUserOrder(s.docs[0].data());
          } else {
            setHasOrdered(false);
          }
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
  }, [activeTrialDate]);

  const logAction = async (action) => {
    await addDoc(collection(db, "logs"), { admin: user.email, action, timestamp: Date.now(), date: new Date().toLocaleString() });
  };

  const handleAdminManagement = async (email, action) => {
    if (user.email !== SUPER_ADMIN) return alert("Only the Super Admin can modify partner access.");
    if (email === SUPER_ADMIN) return alert("Super Admin cannot be removed.");
    let newList = action === 'add' ? [...new Set([...adminList, email])] : adminList.filter(e => e !== email);
    await setDoc(doc(db, "settings", "admins"), { emails: newList });
    logAction(`${action === 'add' ? 'Added' : 'Removed'} admin: ${email}`);
  };

  // MASTER REPORT 1: ORDERS
  const exportOrders = () => {
    const headers = ["Date", "Trial Batch", "Name", "Mobile", "Location", "Veg Qty", "NV Qty"];
    const rows = allOrders.map(o => [o.date, o.trialDate, o.name, `'${o.phone}`, o.hood, o.vegQty || 0, o.nvQty || 0]);
    const csv = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;' }));
    link.download = `Gully_Orders_${activeTrialDate}.csv`;
    link.click();
  };

  // MASTER REPORT 2: REVIEWS
  const exportReviews = () => {
    const headers = ["Date", "Trial Batch", "Name", "Mobile", "Enroll Interested", "Veg Review", "NV Review"];
    const rows = reviews.map(r => [r.date, r.trialDate, r.name, `'${r.phone}`, r.interested ? "YES" : "NO", `"${(r.vegText || "").replace(/"/g, '""')}"`, `"${(r.nvText || "").replace(/"/g, '""')}"`]);
    const csv = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;' }));
    link.download = `Gully_Reviews_Master.csv`;
    link.click();
  };

  const handlePlaceOrder = async () => {
    const phone = document.getElementById('o-phone').value.trim();
    const hood = document.getElementById('o-hood').value.trim();
    if (!phone || !hood) return alert("Contact and Location required!");
    if (cart.veg === 0 && cart.nonveg === 0) return alert("Add at least one bowl to your cart!");

    await addDoc(collection(db, "orders"), {
      name: user.displayName, email: user.email, phone, hood,
      vegQty: cart.veg, nvQty: cart.nonveg, trialDate: activeTrialDate,
      timestamp: Date.now(), date: new Date().toLocaleString()
    });
    alert("Order Successful! 🚀");
  };

  const submitVerdict = async () => {
    const hustle = document.getElementById('u-hustle').value.trim();
    const phone = document.getElementById('u-phone')?.value || userOrder?.phone;
    const hood = document.getElementById('u-hood')?.value || userOrder?.hood;
    if (!hustle || !phone || !hood) return alert("Please fill all mandatory fields.");

    await addDoc(collection(db, "reviews"), { 
        name: user.displayName, phone, hustle, hood, vegText: document.getElementById('u-veg-text')?.value || "", nvText: document.getElementById('u-nv-text')?.value || "",
        interested: enrollInterest, trialDate: activeTrialDate, timestamp: Date.now(), date: new Date().toLocaleString() 
    });
    window.location.href = `https://wa.me/917024185979?text=*VERDICT SUBMITTED*%0AFrom: ${user.displayName}`;
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
          <button onClick={() => setView('user')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'user' ? 'bg-white text-[#B11E48]' : ''}`}>Store</button>
          <button onClick={() => setView('admin')} className={`px-6 py-3 rounded-full text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-[#B11E48]' : ''}`}>Admin</button>
        </nav>
      )}

      {view === 'user' ? (
        <main className="max-w-md mx-auto pt-16 px-6">
          <img src={BRAND_LOGO} className="w-28 mx-auto mb-10" alt="Logo" />
          
          {/* E-COMMERCE BOWL SELECTION */}
          <div className="space-y-8 mb-12">
            {[ {id:'veg', data:vegData, color:'green'}, {id:'nonveg', data:nvData, color:'[#B11E48]'} ].map(bowl => (
                <div key={bowl.id} className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-[#B11E48]/5 transition-all active:scale-95">
                    <div className="aspect-square rounded-[3rem] overflow-hidden mb-6 shadow-inner bg-stone-100">
                        <img src={bowl.data.img || "https://images.unsplash.com"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h3 className="text-3xl font-serif font-black text-[#B11E48]">{bowl.data.name}</h3>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{bowl.data.tagline}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-[#FFFBEB] p-2 rounded-2xl border border-[#B11E48]/10">
                            <button onClick={() => setCart({...cart, [bowl.id]: Math.max(0, cart[bowl.id]-1)})} className="p-2 text-[#B11E48] hover:scale-110"><Minus size={18}/></button>
                            <span className="font-black text-lg w-6 text-center">{cart[bowl.id]}</span>
                            <button onClick={() => setCart({...cart, [bowl.id]: cart[bowl.id]+1})} className="p-2 text-[#B11E48] hover:scale-110"><Plus size={18}/></button>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* ORDER & REVIEW CARD */}
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-[#B11E48]/5">
            {!hasOrdered && !forceReviewView ? (
              <div className="space-y-4 text-center">
                <h3 className="text-3xl font-serif font-black italic text-[#B11E48]">Checkout</h3>
                {isOrderActive ? (
                  <>
                    <input id="o-phone" type="tel" placeholder="Mobile Number *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                    <input id="o-hood" placeholder="Delivery Location? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl outline-none border border-[#B11E48]/10" />
                    <button onClick={handlePlaceOrder} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl flex items-center justify-center gap-3">CONFIRM {cart.veg + cart.nonveg} BOWLS <ShoppingBag size={20}/></button>
                    <p className="text-[10px] font-black text-[#B11E48]/30 uppercase tracking-widest pt-4 cursor-pointer" onClick={() => setForceReviewView(true)}>Already sampled? Skip to Review</p>
                  </>
                ) : (
                  <div className="py-8 opacity-40"><Clock size={48} className="mx-auto mb-4"/><p className="font-black uppercase tracking-widest text-xs">Ordering Closed for Batch {activeTrialDate}</p><button onClick={() => setForceReviewView(true)} className="mt-6 px-10 py-3 bg-[#B11E48]/5 text-[#B11E48] rounded-xl text-[10px] font-black uppercase">Write Review Only</button></div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-3xl font-serif font-black italic text-[#B11E48] text-center mb-6">The Verdict</h3>
                {forceReviewView && (
                    <><input id="u-phone" type="tel" placeholder="Mobile *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 outline-none" /><input id="u-hood" placeholder="Location *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 outline-none" /></>
                )}
                <input id="u-hustle" placeholder="Your Profession? *" className="w-full p-5 bg-[#FFFBEB]/40 rounded-2xl border border-[#B11E48]/10 outline-none" />
                <textarea id="u-veg-text" placeholder="Veg Bowl Verdict (Optional)..." className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-24 border border-[#B11E48]/10 outline-none"></textarea>
                <textarea id="u-nv-text" placeholder="Non-Veg Bowl Verdict (Optional)..." className="w-full p-5 bg-[#FFFBEB]/40 rounded-3xl h-24 border border-[#B11E48]/10 outline-none"></textarea>
                <div onClick={() => setEnrollInterest(!enrollInterest)} className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer ${enrollInterest ? 'bg-[#B11E48] text-white' : 'bg-[#FFFBEB]/40 text-[#B11E48]'}`}><span className="text-xs font-black uppercase">Enroll for future bowls?</span><Heart size={20} fill={enrollInterest ? "white" : "none"} /></div>
                <button onClick={submitVerdict} className="w-full bg-[#B11E48] text-white py-6 rounded-[2.5rem] font-black shadow-xl">SUBMIT VERDICT 🥗</button>
                <button onClick={() => {setForceReviewView(false); setHasOrdered(false);}} className="w-full text-[10px] font-black text-stone-300 uppercase">Back</button>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* --- DUAL-MODE ADMIN DASHBOARD --- */
        <main className="max-w-screen-2xl mx-auto pt-16 px-8 flex flex-col">
            <div className="flex flex-wrap justify-between items-center mb-12 gap-8">
                <div>
                    <h2 className="text-5xl font-serif font-black italic text-[#B11E48]">Operational Command</h2>
                    <div className="flex gap-4 mt-6 bg-white p-2 rounded-2xl shadow-sm border border-[#B11E48]/5">
                        <button onClick={() => setAdminViewMode('orders')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminViewMode === 'orders' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}><ClipboardList size={14} className="inline mr-2"/> Order Desk</button>
                        <button onClick={() => setAdminViewMode('reviews')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminViewMode === 'reviews' ? 'bg-[#B11E48] text-white shadow-md' : 'text-[#B11E48]/40'}`}><MessageSquare size={14} className="inline mr-2"/> Review Desk</button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={adminViewMode === 'orders' ? exportOrders : exportReviews} className="bg-[#B11E48] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"><Download size={16}/> Master Export</button>
                    <button onClick={() => signOut(auth)} className="bg-white border border-[#B11E48]/10 p-4 rounded-2xl shadow-sm text-[#B11E48] hover:rotate-12 transition-all"><LogOut size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* ADMIN SETTINGS COLUMN */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><ShieldCheck size={20}/> Admin Access</h4>
                        {user.email === SUPER_ADMIN ? (
                            <div className="space-y-4">
                                <div className="flex gap-2"><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Email..." className="flex-1 bg-[#FFFBEB] p-3 rounded-xl text-xs outline-none" /><button onClick={() => { handleAdminManagement(adminSearch, 'add'); setAdminSearch(""); }} className="bg-[#B11E48] text-white p-3 rounded-xl"><Plus size={16}/></button></div>
                                <div className="space-y-2">{adminList.map(email => (
                                    <div key={email} className="flex justify-between items-center bg-[#FFFBEB]/50 p-3 rounded-xl border border-[#B11E48]/5 text-[10px] font-bold">{email} {email !== SUPER_ADMIN && <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => handleAdminManagement(email, 'remove')} />}</div>
                                ))}</div>
                            </div>
                        ) : <p className="text-[10px] italic text-stone-400">Restricted to Super Admin.</p>}
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#B11E48]/5">
                        <h4 className="text-xl font-serif font-black italic text-[#B11E48] mb-6 flex items-center gap-2"><LayoutDashboard size={20}/> Order Controls</h4>
                        <button onClick={() => { setDoc(doc(db, "settings", "orderControl"), {active: !isOrderActive}); logAction(`${!isOrderActive?'Opened':'Closed'} orders`); }} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase mb-4 ${isOrderActive ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400'}`}>Ordering: {isOrderActive?'Live':'Closed'}</button>
                        <div className="bg-[#FFFBEB] p-4 rounded-xl border border-[#B11E48]/10"><Calendar size={14} className="text-[#B11E48] mb-2"/><input type="date" value={activeTrialDate.split('/').reverse().join('-')} onChange={(e) => setActiveTrialDate(new Date(e.target.value).toLocaleDateString('en-GB'))} className="w-full text-xs font-black bg-transparent outline-none" /></div>
                    </div>
                </div>

                {/* MAIN MANAGEMENT AREA */}
                <div className="xl:col-span-3">
                    {adminViewMode === 'orders' ? (
                        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[800px] flex flex-col">
                            <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Active Order Tracker</h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                {allOrders.filter(o => o.trialDate === activeTrialDate).map((o, i) => (
                                    <div key={i} className="p-6 bg-[#FFFBEB]/50 rounded-[2.5rem] border border-[#B11E48]/5 flex justify-between items-center">
                                        <div><p className="font-black text-lg text-[#B11E48]">{o.name}</p><p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{o.phone} • {o.hood}</p></div>
                                        <div className="flex gap-4">{o.vegQty > 0 && <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-black">VEG: {o.vegQty}</span>}{o.nvQty > 0 && <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-xs font-black">NV: {o.nvQty}</span>}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-[#B11E48]/5 h-[800px] flex flex-col">
                            <h3 className="text-3xl font-serif font-black italic text-[#B11E48] mb-8">Verdict Feed</h3>
                            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                                {reviews.filter(r => r.trialDate === activeTrialDate).map((r, i) => (
                                    <div key={i} className={`p-8 bg-[#FFFBEB]/30 rounded-[3.5rem] border transition-all ${r.interested ? 'border-[#B11E48] shadow-lg' : 'border-[#B11E48]/10'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div><p className="font-black text-xl text-[#B11E48]">{r.name} {r.interested && <span className="ml-2 bg-[#B11E48] text-white px-2 py-0.5 rounded text-[8px] uppercase">Interested</span>}</p><p className="text-xs font-bold text-stone-400">{r.phone} • {r.hustle} • {r.hood}</p></div>
                                            <span className="text-[10px] font-black bg-[#B11E48] text-white px-4 py-1 rounded-full">{r.tried}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {r.vegText && <div className="p-4 bg-white rounded-3xl border border-green-50 text-sm italic">Veg: {r.vegText}</div>}
                                            {r.nvText && <div className="p-4 bg-white rounded-3xl border border-red-50 text-sm italic">NV: {r.nvText}</div>}
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
