"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, CreditCard as CreditCardIcon, X, CheckCircle2, MoreVertical, Loader2, Trash2 } from "lucide-react";
import { 
  getUserAddresses, 
  addUserAddress, 
  deleteUserAddress, 
  updateUserAddress,
  addCreditCardToken, 
  setDefaultCreditCard,
  CreditCardItem, 
  UserAddress 
} from "@/services/profileApi";

export default function PaymentSettings() {
  const [cards, setCards] = useState<CreditCardItem[]>([
    {
      id: "card-1",
      cardNumberMasked: "•••• •••• •••• 4242",
      last4: "4242",
      expiry: "12/26",
      cardholderName: "MICHAEL RODRIGUEZ",
      brand: "Visa",
      isDefault: true,
      token: "tok_visa_4242",
    },
    {
      id: "card-2",
      cardNumberMasked: "•••• •••• •••• 8899",
      last4: "8899",
      expiry: "08/28",
      cardholderName: "MICHAEL RODRIGUEZ",
      brand: "Mastercard",
      isDefault: false,
      token: "tok_mc_8899",
    },
  ]);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // New Card Form state
  const [newCard, setNewCard] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // New Address Form state
  const [newAddr, setNewAddr] = useState({
    name: "",
    phone: "",
    street: "",
    subdistrict: "",
    district: "",
    province: "",
    postalCode: "",
  });

  useEffect(() => {
    const fetchAddr = async () => {
      try {
        setIsLoadingAddresses(true);
        const data = await getUserAddresses();
        setAddresses(data);
      } catch (err) {
        console.error("Failed to load addresses", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    fetchAddr();
  }, []);

  const handleSetDefaultCard = async (id: string) => {
    try {
      setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
      await setDefaultCreditCard(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.cardNumber || !newCard.cardholderName || !newCard.expiry) {
      alert("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
      return;
    }
    try {
      setIsSavingCard(true);
      const createdCard = await addCreditCardToken(newCard);
      setCards([...cards, createdCard]);
      setIsCardModalOpen(false);
      setNewCard({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อบัตรเครดิต");
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
      await updateUserAddress(id, { isDefault: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      setAddresses(addresses.filter(a => a.id !== id));
      await deleteUserAddress(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.street) {
      alert("กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน");
      return;
    }
    try {
      setIsSavingAddress(true);
      const created = await addUserAddress({
        ...newAddr,
        isDefault: addresses.length === 0,
      });
      setAddresses([...addresses, created]);
      setIsAddressModalOpen(false);
      setNewAddr({ name: "", phone: "", street: "", subdistrict: "", district: "", province: "", postalCode: "" });
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเพิ่มที่อยู่");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const defaultCard = cards.find(c => c.isDefault) || cards[0];
  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-8">Payment & Address</h1>

      <div className="flex flex-col gap-10">
        
        {/* Credit Card Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <CreditCardIcon size={20} /> Credit / Debit Cards
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card) => (
              <div 
                key={card.id} 
                onClick={() => handleSetDefaultCard(card.id)}
                className={`relative h-48 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
                  card.isDefault 
                    ? "bg-neutral-50/50 border-2 border-black text-black shadow-lg shadow-black/10 ring-4 ring-black/5" 
                    : "bg-white border-2 border-neutral-200 text-black hover:border-black hover:shadow-sm"
                }`}
              >
                {/* Top: Bank Logo / Type & Menu */}
                <div className="flex justify-between items-start">
                  <div className="text-lg font-black italic tracking-wider">
                    {card.brand}
                  </div>
                  {card.isDefault ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-xs font-bold text-white shadow-sm">
                      <CheckCircle2 size={14} /> Default
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400 hover:text-black">Set Default</span>
                  )}
                </div>

                {/* Middle: Card Number */}
                <div className="flex items-center gap-3 font-mono text-xl sm:text-2xl tracking-widest mt-4">
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <span>{card.last4}</span>
                </div>

                {/* Bottom: Name and Expiry */}
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${card.isDefault ? "text-neutral-400" : "text-neutral-500"}`}>Cardholder Name</div>
                    <div className="font-bold text-sm sm:text-base uppercase">{card.cardholderName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${card.isDefault ? "text-neutral-400" : "text-neutral-500"}`}>Expiry</div>
                    <div className="font-bold text-sm sm:text-base font-mono">{card.expiry}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Card Button */}
            <button 
              onClick={() => setIsCardModalOpen(true)}
              className="h-48 rounded-[2rem] border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-bold">Add New Card</span>
            </button>
          </div>
        </section>

        {/* Delivery Address Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <MapPin size={20} /> Delivery Addresses
            </h2>
          </div>

          {isLoadingAddresses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-neutral-100 rounded-[2rem] animate-pulse"></div>
              <div className="h-48 bg-neutral-100 rounded-[2rem] animate-pulse"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div 
                  key={addr.id}
                  onClick={() => handleSetDefaultAddress(addr.id)}
                  className={`rounded-[2rem] p-6 sm:p-8 cursor-pointer transition-all relative ${
                    addr.isDefault
                      ? "bg-neutral-50/50 border-2 border-black text-black shadow-lg shadow-black/10 ring-4 ring-black/5"
                      : "bg-white border-2 border-neutral-200 text-black hover:border-black hover:shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        addr.isDefault ? "bg-black text-white shadow-sm" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {addr.name}
                      </div>
                      {addr.isDefault && (
                        <div className="flex items-center gap-1 text-xs font-bold text-black">
                          <CheckCircle2 size={14} /> Default
                        </div>
                      )}
                    </div>
                    {!addr.isDefault && (
                      <button 
                        className="text-neutral-300 hover:text-red-500 transition-colors p-1" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(addr.id);
                        }}
                        title="Delete address"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="font-bold text-lg mb-1">{addr.name}</div>
                  <div className={`text-sm mb-4 ${addr.isDefault ? "text-neutral-600 font-medium" : "text-neutral-500"}`}>
                    {addr.phone}
                  </div>

                  <div className={`text-sm leading-relaxed ${addr.isDefault ? "text-neutral-700" : "text-neutral-600"}`}>
                    {addr.street}<br />
                    {addr.subdistrict} {addr.district}<br />
                    {addr.province} {addr.postalCode}
                  </div>
                </div>
              ))}

              {/* Add New Address Button */}
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="min-h-[220px] rounded-[2rem] border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-bold">Add New Address</span>
              </button>
            </div>
          )}
        </section>

      </div>

      {/* Credit Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95">
            <button 
              onClick={() => setIsCardModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-black mb-6">Add New Card</h2>
            
            <form onSubmit={handleSaveCard} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Cardholder Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={newCard.cardholderName}
                  onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Card Number</label>
                <input 
                  type="text" 
                  placeholder="4242 4242 4242 4242" 
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Expiry Date</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">CVV</label>
                  <input 
                    type="text" 
                    placeholder="123" 
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSavingCard}
                className="w-full bg-black text-white font-bold rounded-xl py-4 mt-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                {isSavingCard ? <Loader2 size={18} className="animate-spin" /> : "Save Card"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button 
              onClick={() => setIsAddressModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-black mb-6">Add New Address</h2>
            
            <form onSubmit={handleSaveAddress} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Address Name</label>
                  <input 
                    type="text" 
                    placeholder="Home / Office" 
                    value={newAddr.name}
                    onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="081-234-5678" 
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Street Address</label>
                <input 
                  type="text" 
                  placeholder="99/1 ซอย สุขุมวิท 21 (อโศก)" 
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Subdistrict</label>
                  <input 
                    type="text" 
                    placeholder="คลองเตยเหนือ" 
                    value={newAddr.subdistrict}
                    onChange={(e) => setNewAddr({ ...newAddr, subdistrict: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">District</label>
                  <input 
                    type="text" 
                    placeholder="วัฒนา" 
                    value={newAddr.district}
                    onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Province</label>
                  <input 
                    type="text" 
                    placeholder="กรุงเทพมหานคร" 
                    value={newAddr.province}
                    onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase">Postal Code</label>
                  <input 
                    type="text" 
                    placeholder="10110" 
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSavingAddress}
                className="w-full bg-black text-white font-bold rounded-xl py-4 mt-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                {isSavingAddress ? <Loader2 size={18} className="animate-spin" /> : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
