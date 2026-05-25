import React, { useState } from 'react';
import { GameState } from '../types';
import { ShoppingBag, Plus, Disc, Image as ImageIcon, Check, X, Package, Trash } from 'lucide-react';
import { compressImage } from '../imageUtils';

interface MerchStoreViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const MERCH_TYPES = [
   { type: 'Vinyl', cost: 8, defaultPrice: 30 },
   { type: 'CD', cost: 4, defaultPrice: 15 },
   { type: 'Cassette', cost: 3, defaultPrice: 12 },
   { type: 'T-Shirt', cost: 10, defaultPrice: 35 },
   { type: 'Box Set', cost: 30, defaultPrice: 100 },
   { type: 'Single Pack', cost: 5, defaultPrice: 15 },
   { type: 'Digital Download', cost: 0, defaultPrice: 5 }
];

export function MerchStoreView({ gameState, setGameState }: MerchStoreViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState('Vinyl');
  const [merchName, setMerchName] = useState('');
  const [linkedRelease, setLinkedRelease] = useState('');
  const [stockToOrder, setStockToOrder] = useState(1000);
  const [merchPrice, setMerchPrice] = useState(30);
  const [merchImage, setMerchImage] = useState('');
  const [merchColor, setMerchColor] = useState('#ffffff');
  
  const [restockAmount, setRestockAmount] = useState<Record<string, number>>({});

  const merchTypeInfo = MERCH_TYPES.find(t => t.type === selectedType) || MERCH_TYPES[0];
  const upfrontCost = merchTypeInfo.cost * stockToOrder;
  const potentialRevenue = merchPrice * stockToOrder;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       try {
          const compressed = await compressImage(file, 400, 400, 0.7);
          setMerchImage(compressed);
       } catch (err) {
          alert('Failed to process image');
       }
    }
  };

  const handleCreateMerch = () => {
     if (!merchName.trim() || !linkedRelease || !merchImage) {
         alert("Please fill all fields and upload an image.");
         return;
     }

     if ((gameState.stats?.money || 0) < upfrontCost) {
         alert("Not enough money to cover the production cost.");
         return;
     }

     const newMerch = {
        id: `merch_${Date.now()}`,
        releaseId: linkedRelease,
        name: merchName,
        type: selectedType as any,
        image: merchImage,
        price: merchPrice,
        cost: merchTypeInfo.cost,
        stock: stockToOrder,
        sold: 0,
        revenue: 0,
        color: merchColor,
     };

     setGameState(prev => {
        if (!prev) return prev;
        return {
           ...prev,
           stats: {
              ...prev.stats,
              money: (prev.stats?.money || 0) - upfrontCost
           },
           merch: [...(prev.merch || []), newMerch]
        };
     });

     setShowCreate(false);
     setMerchName('');
     setMerchImage('');
     setLinkedRelease('');
     setStockToOrder(1000);
     setMerchPrice(MERCH_TYPES[0].defaultPrice);
     setMerchColor('#ffffff');
  };

  const handleRestock = (merchId: string, costPerUnit: number) => {
     const qty = restockAmount[merchId] || 500;
     const totalCost = costPerUnit * qty;
     
     if ((gameState.stats?.money || 0) < totalCost) {
         alert("Not enough money to restock.");
         return;
     }

     setGameState(prev => {
        if (!prev) return prev;
        return {
           ...prev,
           stats: {
              ...prev.stats,
              money: (prev.stats?.money || 0) - totalCost
           },
           merch: (prev.merch || []).map(m => m?.id === merchId ? { ...m, stock: m.stock + qty } : m)
        };
     });
     
     setRestockAmount(prev => ({...prev, [merchId]: 0}));
  };

  const handleDeleteMerch = (merchId: string) => {
     const isConfirmed = window.confirm("Are you sure you want to delete this merch?");
     if (!isConfirmed) return;
     
     setGameState(prev => {
        if (!prev) return prev;
        return {
           ...prev,
           merch: (prev.merch || []).filter(m => m?.id !== merchId)
        };
     });
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white p-6 md:p-8 overflow-y-auto min-h-screen pb-32">
      <div className="flex justify-between items-center mb-10">
         <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-purple-400 uppercase flex items-center gap-3">
               <ShoppingBag className="w-8 h-8" />
               Merch Store
            </h2>
            <p className="text-white/60 font-bold tracking-widest uppercase text-xs mt-2">Design & Sell Your Merchandise</p>
         </div>
         <button 
           onClick={() => setShowCreate(true)}
           className="bg-white text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:scale-105 transition-transform"
         >
           <Plus className="w-4 h-4" /> New Merch
         </button>
      </div>

      {showCreate && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1f1f1f] rounded-3xl w-full max-w-4xl p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black">Release Merchandise</h3>
                  <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white p-2">
                     <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Merch Name</label>
                        <input 
                           type="text" 
                           value={merchName}
                           onChange={e => setMerchName(e.target.value)}
                           className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                           placeholder="e.g. Alter Ego Jewel Case"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Linked Release</label>
                        <select 
                           value={linkedRelease}
                           onChange={e => setLinkedRelease(e.target.value)}
                           className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none appearance-none"
                        >
                           <option value="">-- Select Release --</option>
                           {gameState.releases.map(r => (
                              <option key={r.id} value={r.id}>{r.title} ({r.type}) - {r.status}</option>
                           ))}
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Merch Type</label>
                           <select 
                              value={selectedType}
                              onChange={e => {
                                 setSelectedType(e.target.value);
                                 const t = MERCH_TYPES.find(x => x.type === e.target.value);
                                 if (t) setMerchPrice(t.defaultPrice);
                              }}
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none appearance-none"
                           >
                              {MERCH_TYPES.map(t => (
                                 <option key={t.type} value={t.type}>{t.type}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Selling Price</label>
                           <div className="relative">
                              <span className="absolute left-4 top-3 text-white/40 font-bold">$</span>
                              <input 
                                 type="number" 
                                 min="0"
                                 value={merchPrice}
                                 onChange={e => setMerchPrice(Number(e.target.value))}
                                 className="w-full bg-[#111] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-purple-500 outline-none"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Quantity</label>
                           <input 
                              type="number" 
                              min="10"
                              step="100"
                              value={stockToOrder}
                              onChange={e => setStockToOrder(Number(e.target.value))}
                              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Disc/Vinyl Color</label>
                           <div className="flex items-center gap-2 h-[46px] bg-[#111] border border-white/10 rounded-xl px-2">
                               <input 
                                 type="color" 
                                 value={merchColor}
                                 onChange={e => setMerchColor(e.target.value)}
                                 className="w-8 h-8 rounded shrink-0 cursor-pointer border-0 bg-transparent p-0"
                               />
                               <span className="text-white/60 font-mono text-sm">{merchColor}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Preview & Upload (Click to change)</label>
                        <label className="w-full aspect-square bg-[#0f0f0f] border border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors overflow-hidden group relative">
                           {merchImage ? (
                              <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#151515]">
                                 <div className="absolute top-4 left-4 z-10 flex flex-col items-start bg-black/40 p-2 rounded backdrop-blur">
                                     <span className="text-[10px] font-bold uppercase tracking-widest text-[#d2ba96]">{gameState.artist?.name}</span>
                                     <span className="text-xl font-black uppercase tracking-tighter text-[#d2ba96] leading-none mt-1">{linkedRelease ? gameState.releases.find(r => r?.id === linkedRelease)?.title : 'Release Title'}</span>
                                 </div>
                                 <div className="relative mt-8 mx-auto w-3/4 aspect-square flex items-center justify-center">
                                     <div 
                                       className="absolute top-[5%] right-[-20%] w-[90%] h-[90%] rounded-full shadow-2xl transition-transform duration-500 group-hover:translate-x-4 border border-black/20 z-0"
                                       style={{ background: `linear-gradient(135deg, ${merchColor}, #111)` }}
                                     >
                                        <div className="absolute inset-0 flex justify-center items-center"><div className="w-1/4 h-1/4 rounded-full bg-white/20 border-4 border-[#111]"></div></div>
                                     </div>
                                     <div className="absolute inset-0 bg-[#1f1f1f] border border-white/20 rounded-sm shadow-2xl overflow-hidden flex items-center justify-center z-10 p-[2px]">
                                         <div className="w-full h-full relative z-0">
                                            <img src={merchImage || undefined} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="absolute inset-0 z-20 pointer-events-none rounded-[2px]" style={{
                                             background: 'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 2%, transparent 3%, transparent 97%, rgba(255,255,255,0.1) 98%, rgba(255,255,255,0.4) 100%)',
                                             boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), inset 2px 0 2px rgba(255,255,255,0.4), inset -2px 0 2px rgba(255,255,255,0.1)'
                                         }}></div>
                                     </div>
                                 </div>
                                 <div className="absolute bottom-4 left-0 right-0 text-center z-10 bg-black/40 backdrop-blur py-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2ba96]">{selectedType} version</span>
                                 </div>
                              </div>
                           ) : (
                              <>
                                 <ImageIcon className="w-10 h-10 text-white/20 mb-2" />
                                 <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Upload Cover</span>
                              </>
                           )}
                           <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                           
                           {merchImage && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                   <span className="bg-white text-black px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl">Change Image</span>
                               </div>
                           )}
                        </label>
                     </div>

                     <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4 mt-auto">
                        <div className="flex justify-between text-sm mb-2">
                           <span className="text-white/60">Unit Cost</span>
                           <span className="font-bold text-red-400">-${merchTypeInfo.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-4">
                           <span className="text-white/60">Potential Profit (Unit)</span>
                           <span className="font-bold text-green-400">${(merchPrice - merchTypeInfo.cost).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-purple-500/20 pt-4 flex justify-between items-center">
                           <span className="font-bold text-white uppercase tracking-widest text-xs">Total Production Cost</span>
                           <span className="text-xl font-black text-white">${upfrontCost.toLocaleString()}</span>
                        </div>
                     </div>

                     <button 
                        onClick={handleCreateMerch}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black tracking-widest uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)] flex justify-center items-center gap-2 mt-2"
                     >
                        <Check className="w-5 h-5" /> Confirm & Produce
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Merch List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {(!gameState.merch || gameState.merch.length === 0) ? (
            <div className="col-span-full py-20 text-center">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-white/20" />
               </div>
               <h3 className="text-2xl font-bold mb-2">No Merch Yet</h3>
               <p className="text-white/40 max-w-sm mx-auto">Design and sell merchandise directly to your fans to boost your income and chart performances.</p>
            </div>
         ) : (
            gameState.merch.map((item) => {
               const repRelease = gameState.releases.find(r => r?.id === item.releaseId);
               return (
               <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden group flex flex-col">
                  
                  {/* Generated Cover Design UI */}
                  <div className="relative aspect-square bg-[#0f0f0f] border-b border-white/5 overflow-hidden flex flex-col items-center justify-center group-hover:bg-[#151515] transition-colors p-4">
                     <div className="absolute top-4 left-4 z-10 flex flex-col items-start bg-black/40 p-2 rounded backdrop-blur">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#d2ba96]">{gameState.artist?.name}</span>
                         <span className="text-xl font-black uppercase tracking-tighter text-[#d2ba96] leading-none mt-1 break-words line-clamp-2">{repRelease?.title || 'Unknown'}</span>
                     </div>
                     
                     <div className="relative mt-8 mx-auto w-3/4 aspect-square flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                         {item.type !== 'Digital Download' && item.type !== 'Cassette' && item.type !== 'T-Shirt' && (
                           <div 
                             className="absolute top-[5%] right-[-20%] w-[90%] h-[90%] rounded-full shadow-2xl group-hover:translate-x-6 transition-transform duration-500 border border-black/20 z-0"
                             style={{ background: `linear-gradient(135deg, ${item.color || '#fff'}, #111)` }}
                           >
                              <div className="absolute inset-0 flex justify-center items-center"><div className="w-1/4 h-1/4 rounded-full bg-white/20 border-4 border-[#111]"></div></div>
                           </div>
                         )}
                         <div className="absolute inset-0 bg-[#1f1f1f] border border-white/20 rounded-sm shadow-2xl overflow-hidden flex items-center justify-center z-10 p-[2px]">
                             <div className="w-full h-full relative z-0">
                                {item.image ? (
                                   <img src={item.image || undefined} className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center"><Disc className="w-16 h-16 text-white/10" /></div>
                                )}
                             </div>
                             <div className="absolute inset-0 z-20 pointer-events-none rounded-[2px]" style={{
                                 background: 'linear-gradient(105deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 2%, transparent 3%, transparent 97%, rgba(255,255,255,0.1) 98%, rgba(255,255,255,0.4) 100%)',
                                 boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), inset 2px 0 2px rgba(255,255,255,0.4), inset -2px 0 2px rgba(255,255,255,0.1)'
                             }}></div>
                         </div>
                     </div>
                     <div className="absolute bottom-4 left-0 right-0 text-center z-10 bg-black/40 backdrop-blur py-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2ba96]">{item.type} version</span>
                     </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                     <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className="font-bold text-lg truncate flex-1">{item.name}</h3>
                        <button onClick={() => handleDeleteMerch(item.id)} className="text-white/20 hover:text-red-400 transition-colors p-1 shrink-0">
                           <Trash className="w-4 h-4" />
                        </button>
                     </div>
                     <h4 className="text-xs text-white/40 font-bold uppercase tracking-widest mb-4 truncate flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Cost: ${item.cost} / unit
                     </h4>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#111] rounded-xl p-3">
                           <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Price</div>
                           <div className="font-black text-white">${item.price.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#111] rounded-xl p-3">
                           <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Sold</div>
                           <div className="font-black text-white">{item.sold.toLocaleString()}<span className="text-[10px] text-white/30 ml-1">/{item.stock.toLocaleString()}</span></div>
                        </div>
                     </div>

                     <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden mb-2 shadow-inner">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full" style={{ width: `${Math.min(100, (item.sold / item.stock) * 100)}%` }} />
                     </div>
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-4">
                        <span className="text-white/40">Inventory</span>
                        <span className={item.sold >= item.stock ? "text-red-400 animate-pulse" : "text-green-400"}>
                           {item.sold >= item.stock ? "Sold Out" : `${(item.stock - item.sold).toLocaleString()} Left`}
                        </span>
                     </div>

                     <div className="flex flex-col gap-2 border-t border-white/5 pt-4 mt-auto">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Revenue</span>
                           <span className="font-black text-green-400">${Math.floor(item.revenue).toLocaleString()}</span>
                        </div>
                        
                        {item.type !== 'Digital Download' && (
                        <div className="flex items-stretch gap-2 bg-black/40 rounded-xl overflow-hidden border border-white/5 focus-within:border-purple-500 transition-colors">
                           <input 
                              type="number" 
                              min="100" 
                              step="100"
                              value={restockAmount[item.id] === undefined ? 500 : restockAmount[item.id]}
                              onChange={(e) => setRestockAmount({...restockAmount, [item.id]: Number(e.target.value)})}
                              className="w-16 bg-transparent text-xs text-center font-bold outline-none text-white p-2"
                              placeholder="Qty"
                           />
                           <button 
                              onClick={() => handleRestock(item.id, item.cost)}
                              className="flex-1 bg-white/5 hover:bg-white/10 font-bold uppercase tracking-widest text-[10px] border-l border-white/5 transition-colors"
                           >
                              Restock 
                           </button>
                        </div>
                        )}
                     </div>
                  </div>
               </div>
               );
            })
         )}
      </div>
    </div>
  );
}
