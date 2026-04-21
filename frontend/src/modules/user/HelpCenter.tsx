import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/config';

interface SupportTicket {
  _id: string;
  ticketId: string;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function HelpCenter() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Order Issue',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/my-tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch tickets", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/support', formData);
      if (res.data.success) {
        setShowCreate(false);
        fetchTickets();
      }
    } catch (e) {
      alert("Failed to raise ticket. Please try again.");
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 p-6 pt-12 md:pt-16">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-2xl font-black text-neutral-800 tracking-tighter">Help Center</h1>
        </div>
        <p className="text-neutral-500 font-medium">Have a problem with an order? We're here to help.</p>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Statistics or FAQs quick list */}
        <div className="grid grid-cols-2 gap-4">
           <button className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm text-left group">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-all">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15.5a3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1 7 0z"/><path d="M12 12l8-8"/><path d="M9 12l8-8"/><path d="M20 13.5a3.5 3.5 0 0 1-7 0 3.5 3.5 0 0 1 7 0z"/></svg>
              </div>
              <div className="text-sm font-black text-neutral-800">Track Order</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Real-time update</div>
           </button>
           <button className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm text-left group">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-all">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="text-sm font-black text-neutral-800">Refund Status</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Wallet updates</div>
           </button>
        </div>

        {/* Existing Tickets */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-neutral-800 tracking-tight">Recent Tickets</h2>
              <button 
                onClick={() => setShowCreate(true)}
                className="text-xs font-black text-teal-600 uppercase tracking-widest"
              >
                + New Ticket
              </button>
           </div>

           {loading ? (
             <div className="p-10 text-center text-neutral-400 font-bold animate-pulse uppercase text-xs tracking-[0.2em]">Syncing Tickets...</div>
           ) : tickets.length === 0 ? (
             <div className="bg-white p-10 rounded-[2rem] border border-neutral-100 text-center shadow-sm">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-sm font-bold text-neutral-800 mb-1">No Active Tickets</p>
                <p className="text-xs text-neutral-400 font-medium px-6">You haven't raised any complaints yet. We hope you're having a great experience!</p>
             </div>
           ) : (
             tickets.map(ticket => (
                <div key={ticket._id} className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all">
                   <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">{ticket.ticketId}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         ticket.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                         {ticket.status}
                      </span>
                   </div>
                   <div className="text-base font-black text-neutral-800 tracking-tight leading-tight mb-1">{ticket.subject}</div>
                   <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{ticket.category}</div>
                   <div className="mt-4 pt-4 border-t border-neutral-50 flex justify-between items-center">
                      <div className="text-[10px] font-bold text-neutral-400">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                      <button className="text-[10px] font-black text-neutral-800 uppercase tracking-widest hover:underline">View History ›</button>
                   </div>
                </div>
             ))
           )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-500">
              <h3 className="text-2xl font-black text-neutral-800 tracking-tighter mb-6">Raise a Concern</h3>
              <form onSubmit={handleCreateTicket} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Issue Category</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['Order Issue', 'Payment Issue', 'Delivery Issue', 'Other'].map(cat => (
                          <button 
                            key={cat}
                            type="button"
                            onClick={() => setFormData({...formData, category: cat})}
                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.category === cat ? 'bg-teal-500 border-teal-400 text-white shadow-lg' : 'bg-neutral-50 border-neutral-100 text-neutral-400'}`}
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Subject (e.g. My order is late)" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-neutral-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-neutral-800 focus:ring-2 focus:ring-teal-500/20"
                      required
                    />
                    <textarea 
                      placeholder="Detailed description..." 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-neutral-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-neutral-800 focus:ring-2 focus:ring-teal-500/20"
                      required
                    />
                 </div>

                 <button 
                    type="submit"
                    className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                 >
                    Submit Ticket
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
