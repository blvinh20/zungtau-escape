import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, CheckCircle2, History, ChevronLeft, ChevronRight, ArrowUpDown, Banknote, PenLine, Info, Users, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Participant } from '../types';

interface FundContributionViewProps {
  participants: Participant[];
  contributions: any[];
  onBack: () => void;
  onAddContribution: (participantId: string, amount: number) => void | Promise<void>;
}

type SortKey = 'time' | 'name' | 'amount';

export default function FundContributionView({ participants, contributions, onBack, onAddContribution }: FundContributionViewProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [amount, setAmount] = useState('500000');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyModal, setHistoryModal] = useState<{ participantId: string; name: string } | null>(null);
  const itemsPerPage = 5;

  // Aggregate contributions by participant
  const aggregatedData = useMemo(() => {
    const Map = new Map();
    contributions.forEach(c => {
      const pid = c.participant_id;
      if (!Map.has(pid)) {
        Map.set(pid, {
          participantId: pid,
          name: c.participants?.name || 'Unknown',
          initials: c.participants?.initials || '?',
          colorClass: c.participants?.color_class || 'bg-gray-100 text-gray-600',
          totalAmount: 0,
          latestContribution: c.created_at,
          history: []
        });
      }
      const entry = Map.get(pid);
      entry.totalAmount += Number(c.amount);
      entry.history.push(c);
      if (new Date(c.created_at) > new Date(entry.latestContribution)) {
        entry.latestContribution = c.created_at;
      }
    });
    return Array.from(Map.values());
  }, [contributions]);

  // Sort aggregated data
  const sortedContributions = [...aggregatedData].sort((a, b) => {
    if (sortKey === 'time') {
      const dateA = new Date(a.latestContribution).getTime();
      const dateB = new Date(b.latestContribution).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else if (sortKey === 'amount') {
      return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
    } else {
      return sortOrder === 'desc'
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  // Get history for modal
  const historyData = historyModal
    ? contributions.filter(c => c.participant_id === historyModal.participantId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
      {/* History Modal */}
      <AnimatePresence>
        {historyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setHistoryModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <History size={22} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-black font-headline">Lịch sử nộp quỹ</h3>
                </div>
                <button
                  onClick={() => setHistoryModal(null)}
                  className="p-2 hover:bg-surface-container rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm font-bold text-secondary mb-4">Lịch sử nộp quỹ của <span className="text-primary">{historyModal.name}</span></p>
                <div className="space-y-2">
                  {historyData.map((c, idx) => (
                    <div key={c.id || idx} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-secondary" />
                        <span className="text-xs font-medium text-secondary">{formatDateTime(c.created_at)}</span>
                      </div>
                      <span className="text-sm font-black text-primary">{Number(c.amount).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                  {historyData.length === 0 && (
                    <p className="text-center py-8 text-secondary text-sm italic">Chưa có lịch sử nộp quỹ</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <ArrowLeft size={18} />
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
                <button
                  onClick={() => toggleSort('amount')}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    sortKey === 'amount' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-low text-secondary hover:bg-surface-container"
                  )}
                >
                  SỐ TIỀN <ArrowUpDown size={14} />
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-sm border border-outline-variant/10 overflow-hidden">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-secondary text-[10px] font-bold uppercase tracking-widest text-left">
                    <th className="pb-2 px-3">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">THÀNH VIÊN</button>
                    </th>
                    <th className="pb-2 px-3">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">THỜI GIAN</button>
                    </th>
                    <th className="pb-2 px-3 text-right">
                      <button className="inline-flex items-center gap-1 hover:text-primary transition-colors">SỐ TIỀN</button>
                    </th>
                    <th className="pb-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContributions.map((c) => (
                    <tr key={c.participantId} className="group hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 rounded-l-2xl border-y border-l border-outline-variant/5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm", c.colorClass)}>
                            {c.initials}
                          </div>
                          <span className="text-sm font-bold">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-y border-outline-variant/5 text-xs text-secondary font-medium">
                        {formatDateTime(c.latestContribution)}
                      </td>
                      <td className="py-3 px-3 border-y border-outline-variant/5 text-right font-black text-primary">
                        {c.totalAmount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3 px-3 rounded-r-2xl border-y border-r border-outline-variant/5">
                        <button
                          onClick={() => setHistoryModal({ participantId: c.participantId, name: c.name })}
                          className="p-2 hover:bg-surface-container rounded-xl text-secondary opacity-0 group-hover:opacity-100 transition-all"
                          title="Xem lịch sử"
                        >
                          <History size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedContributions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-secondary text-sm font-medium italic">
                        Chưa có lịch sử nộp quỹ nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                  >
                    <ChevronLeft size={18} />
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
                    className="p-2.5 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                  >
                    <ChevronRight size={18} />
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

            <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-outline-variant/10 relative overflow-hidden">
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
                  <div className="bg-surface-container-low rounded-2xl p-4 max-h-48 overflow-y-auto scrollbar-hide space-y-1">
                    {participants.map(p => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                          selectedParticipants.includes(p.id)
                            ? "bg-primary/10"
                            : "hover:bg-surface-container"
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
                      className="w-full bg-surface-container-low border-none rounded-2xl pl-14 pr-14 py-5 focus:ring-2 focus:ring-primary font-black text-2xl transition-all"
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