import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, CheckCircle2, History, ChevronLeft, ChevronRight, ArrowUpDown, Banknote, PenLine, Info, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { Participant } from '../types';

interface FundContributionViewProps {
  participants: Participant[];
  contributions: any[];
  onBack: () => void;
  onAddContribution: (participantId: string, amount: number) => void | Promise<void>;
}

type SortKey = 'time' | 'name';

export default function FundContributionView({ participants, contributions, onBack, onAddContribution }: FundContributionViewProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [amount, setAmount] = useState('500000');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 5;

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map(p => p.id));
    }
  };

  const handleConfirm = async () => {
    if (selectedParticipants.length === 0 || !amount) return;
    for (const pid of selectedParticipants) {
      await onAddContribution(pid, Number(amount));
    }
    setSelectedParticipants([]);
  };

  const sortedContributions = [...contributions].sort((a, b) => {
    if (sortKey === 'time') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const nameA = a.participants?.name || '';
      const nameB = b.participants?.name || '';
      return sortOrder === 'desc'
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    }
  });

  const totalPages = Math.ceil(sortedContributions.length / itemsPerPage);
  const paginatedContributions = sortedContributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <span className="text-2xl font-bold text-primary font-headline">Quay lại</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <History size={22} className="text-primary" />
                </div>
                <h2 className="text-3xl font-black font-headline">Lịch sử</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSort('name')}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    sortKey === 'name' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-low text-secondary hover:bg-surface-container"
                  )}
                >
                  Tên <ArrowUpDown size={14} />
                </button>
                <button
                  onClick={() => toggleSort('time')}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    sortKey === 'time' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-low text-secondary hover:bg-surface-container"
                  )}
                >
                  Thời gian <ArrowUpDown size={14} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-outline-variant/10 overflow-hidden">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-secondary text-[10px] font-bold uppercase tracking-widest text-left">
                    <th className="pb-2 px-4">THÀNH VIÊN</th>
                    <th className="pb-2 px-4">THỜI GIAN</th>
                    <th className="pb-2 px-4 text-right">SỐ TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContributions.map((c) => (
                    <tr key={c.id} className="group hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-4 rounded-l-2xl border-y border-l border-outline-variant/5">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm", c.participants?.color_class)}>
                            {c.participants?.initials}
                          </div>
                          <span className="text-base font-bold">{c.participants?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-y border-outline-variant/5 text-sm text-secondary font-medium">
                        {new Date(c.created_at).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(',', '')}
                      </td>
                      <td className="py-4 px-4 rounded-r-2xl border-y border-r border-outline-variant/5 text-right font-black text-primary text-lg">
                        {Number(c.amount).toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  ))}
                  {paginatedContributions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-20 text-center text-secondary text-sm font-medium italic">
                        Chưa có lịch sử nộp quỹ nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-10">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-widest">TRANG</span>
                    <span className="text-sm font-black text-primary">{currentPage}</span>
                    <span className="text-xs font-bold text-secondary">/</span>
                    <span className="text-sm font-black text-secondary">{totalPages}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plus size={22} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black font-headline">Nộp quỹ</h2>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-outline-variant/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-secondary tracking-widest ml-1 flex items-center gap-1.5">
                      <Users size={12} /> THÀNH VIÊN
                    </label>
                    <button
                      onClick={toggleAll}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-all",
                        selectedParticipants.length === participants.length
                          ? "bg-primary text-white"
                          : "bg-surface-container-low text-primary hover:bg-primary/10"
                      )}
                    >
                      {selectedParticipants.length === participants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                  <div className="bg-[#fdfaf5] rounded-2xl p-4 max-h-48 overflow-y-auto scrollbar-hide space-y-1 border border-outline-variant/5">
                    {participants.map(p => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                          selectedParticipants.includes(p.id)
                            ? "bg-primary/10"
                            : "hover:bg-[#f9f4eb]"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(p.id)}
                          onChange={() => toggleParticipant(p.id)}
                          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
                        />
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0", p.colorClass || p.color_class)}>
                          {p.initials}
                        </div>
                        <span className="text-sm font-bold text-on-surface">{p.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedParticipants.length > 0 && (
                    <p className="text-[9px] text-primary font-bold ml-1">
                      Đã chọn {selectedParticipants.length}/{participants.length} thành viên
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-secondary tracking-widest ml-1 flex items-center gap-1.5">
                    <Banknote size={12} />
                    SỐ TIỀN nộp (VNĐ)
                    <span className="relative group/tip cursor-help inline-flex">
                      <Info size={11} className="text-primary/40" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 bg-on-surface text-white text-[9px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
                        Mặc định: 500.000đ / người
                      </span>
                    </span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[500000, 1000000, 2000000, 5000000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-xs font-black transition-all",
                          amount === preset.toString()
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-surface-container-low text-secondary hover:bg-surface-container"
                        )}
                      >
                        {(preset / 1000).toLocaleString('vi-VN')}k
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <PenLine className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Hoặc nhập số tiền khác..."
                      className="w-full bg-[#fdfaf5] border-none rounded-2xl pl-14 pr-14 py-5 focus:ring-2 focus:ring-primary font-black text-2xl transition-all hover:bg-[#f9f4eb]"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/10 px-3 py-1.5 rounded-lg font-bold text-primary text-sm">
                      đ
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={selectedParticipants.length === 0 || !amount}
                  className="w-full bg-primary text-white py-6 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={24} />
                  Xác nhận
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
