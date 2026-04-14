import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, X, UserPlus, Loader2, Calendar, DollarSign, Tag, Trash2, Edit2, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, PiggyBank, Receipt, ArrowUpDown, Flag, Eye, Camera, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { getExpenses, addExpense as addExpenseSupabase, deleteExpense as deleteExpenseSupabase, updateExpense as updateExpenseSupabase, getFundContributions, addFundContribution, deleteFundContribution } from '../lib/supabase';
import ConfirmModal from './ConfirmModal';
import SettlementPreview from './SettlementPreview';
import SettlementModal from './SettlementModal';
import { useToast } from './Toast';
import { useParticipants } from './ParticipantContext';

export default function Expenses() {
  const navigate = useNavigate();
  const { participants, treasurerId } = useParticipants();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fundContributions, setFundContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEndTripModalOpen, setIsEndTripModalOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isFundAddOpen, setIsFundAddOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'time' | 'name' | 'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 5;

  // Fund modal state
  const [fundSelectedParticipants, setFundSelectedParticipants] = useState<string[]>([]);
  const [fundAmount, setFundAmount] = useState('500000');
  const [fundSortKey, setFundSortKey] = useState<'time' | 'name' | 'amount'>('time');
  const [fundSortOrder, setFundSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fundCurrentPage, setFundCurrentPage] = useState(1);
  const fundItemsPerPage = 5;

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  });

  const [expenseForm, setExpenseForm] = useState({
    payer_id: '',
    reason: '',
    category: 'Ẩm thực',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    participant_ids: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eData, fData] = await Promise.all([
          getExpenses(),
          getFundContributions()
        ]);
        setExpenses(eData);
        setFundContributions(fData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSpending = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalFund = fundContributions.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remainingFund = totalFund - totalSpending;

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortKey === 'time') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else if (sortKey === 'name') {
      const nameA = a.participants?.name || '';
      const nameB = b.participants?.name || '';
      return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    } else {
      return sortOrder === 'desc' ? Number(b.amount) - Number(a.amount) : Number(a.amount) - Number(b.amount);
    }
  });

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = sortedExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (key: 'time' | 'name' | 'amount') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.payer_id || !expenseForm.reason || !expenseForm.amount) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    // Default to all participants as requested
    const allParticipantIds = participants.map(p => p.id);

    try {
      const payload = {
        payer_id: expenseForm.payer_id,
        reason: expenseForm.reason,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date
      };

      if (editingExpenseId) {
        await updateExpenseSupabase(editingExpenseId, payload, allParticipantIds);
        showToast('Cập nhật khoản chi thành công', 'success');
      } else {
        await addExpenseSupabase(payload, allParticipantIds);
        showToast('Thêm khoản chi thành công', 'success');
      }

      // Refresh expenses to get the joined participant data
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);

      closeExpenseModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('Lưu khoản chi thất bại', 'error');
    }
  };

  const openEditExpenseModal = (expense: any) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      payer_id: expense.payer_id,
      reason: expense.reason,
      category: expense.category || 'Ẩm thực',
      amount: expense.amount.toString(),
      date: expense.date,
      participant_ids: (expense.expense_participants || []).map((p: any) => p.participant_id)
    });
    setIsAddExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsAddExpenseModalOpen(false);
    setEditingExpenseId(null);
    setExpenseForm({
      payer_id: '',
      reason: '',
      category: 'Ẩm thực',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      participant_ids: []
    });
  };

  const handleDeleteExpense = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa khoản chi',
      message: 'Bạn có chắc chắn muốn xóa khoản chi này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteExpenseSupabase(id);
          setExpenses(expenses.filter(e => e.id !== id));
          showToast('Xóa khoản chi thành công', 'success');
        } catch (error) {
          console.error('Error deleting expense:', error);
          showToast('Xóa khoản chi thất bại', 'error');
        }
      }
    });
  };

  const handleAddFundContribution = async (participantId: string, amount: number) => {
    try {
      await addFundContribution({
        participant_id: participantId,
        amount: amount
      });
      const updatedFunds = await getFundContributions();
      setFundContributions(updatedFunds);
      showToast('Đóng quỹ thành công', 'success');
    } catch (error) {
      console.error('Error adding fund contribution:', error);
      showToast('Đóng quỹ thất bại', 'error');
    }
  };

  const handleDeleteFundContribution = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa khoản nộp quỹ',
      message: 'Bạn có chắc chắn muốn xóa khoản nộp quỹ này?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteFundContribution(id);
          setFundContributions(fundContributions.filter(c => c.id !== id));
          showToast('Xóa khoản nộp quỹ thành công', 'success');
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting fund contribution:', error);
          showToast('Xóa khoản nộp quỹ thất bại', 'error');
        }
      }
    });
  };

  const toggleFundParticipant = (id: string) => {
    setFundSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAllFundParticipants = () => {
    if (fundSelectedParticipants.length === participants.length) {
      setFundSelectedParticipants([]);
    } else {
      setFundSelectedParticipants(participants.map(p => p.id));
    }
  };

  const handleFundConfirm = async () => {
    if (fundSelectedParticipants.length === 0 || !fundAmount) return;
    try {
      for (const pid of fundSelectedParticipants) {
        await addFundContribution({
          participant_id: pid,
          amount: Number(fundAmount)
        });
      }
      const updatedFunds = await getFundContributions();
      setFundContributions(updatedFunds);
      showToast(
        `Đóng quỹ thành công cho ${fundSelectedParticipants.length} thành viên (${(Number(fundAmount) * fundSelectedParticipants.length).toLocaleString('vi-VN')}đ)`,
        'success'
      );
      setFundSelectedParticipants([]);
      setIsFundAddOpen(false);
    } catch (error) {
      console.error('Error adding fund contributions:', error);
      showToast('Đóng quỹ thất bại', 'error');
    }
  };

  const sortedFundContributions = [...fundContributions].sort((a, b) => {
    if (fundSortKey === 'time') {
      return fundSortOrder === 'desc'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (fundSortKey === 'amount') {
      return fundSortOrder === 'desc'
        ? Number(b.amount) - Number(a.amount)
        : Number(a.amount) - Number(b.amount);
    }
    const nameA = a.participants?.name || '';
    const nameB = b.participants?.name || '';
    return fundSortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
  });

  const fundTotalPages = Math.ceil(sortedFundContributions.length / fundItemsPerPage);
  const paginatedFundContributions = sortedFundContributions.slice(
    (fundCurrentPage - 1) * fundItemsPerPage,
    fundCurrentPage * fundItemsPerPage
  );

  const toggleFundSort = (key: 'time' | 'name' | 'amount') => {
    if (fundSortKey === key) {
      setFundSortOrder(fundSortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setFundSortKey(key);
      setFundSortOrder('desc');
    }
    setFundCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-20">
      <header className="group relative mb-8 sm:mb-16 h-48 sm:h-72 rounded-[2rem] sm:rounded-[3rem] overflow-visible flex flex-col justify-center px-6 sm:px-12 shadow-sm border border-outline-variant/10">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
          <img
            src="/images/background.png"
            alt="Expenses Background"
            className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-primary font-headline mb-3">
              Quản lý chi phí
            </h1>
            <p className="text-on-surface-variant max-w-md leading-relaxed">
              Theo dõi và quản lý dòng tiền của chuyến đi Vũng Tàu một cách minh bạch và chuyên nghiệp.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-surface-container p-8 md:p-10 rounded-[2rem] shadow-sm overflow-hidden border-l-4 border-primary cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[15px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Wallet size={14} className="text-primary" />
              TỔNG NGÂN SÁCH
            </h3>
          </div>
          <p className="text-4xl font-black text-on-surface font-headline mb-6 whitespace-nowrap">
            {totalFund.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
          </p>
          <button
            onClick={() => setIsFundModalOpen(true)}
            className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline"
          >
            XEM DANH SÁCH NỘP QUỸ <ChevronRight size={16} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="bg-surface-container p-8 md:p-10 rounded-[2rem] shadow-sm overflow-hidden border-l-4 border-tertiary cursor-pointer hover:shadow-xl hover:shadow-tertiary/10 transition-shadow duration-300"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[15px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Receipt size={14} className="text-tertiary" />
              THỰC CHI
            </h3>
          </div>
          <p className="text-4xl font-black text-tertiary font-headline mb-6 whitespace-nowrap">
            {totalSpending.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-tertiary px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">THỰC TẾ</div>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Cập nhật theo khoản chi</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className={cn(
            "p-8 md:p-10 rounded-[2rem] shadow-sm overflow-hidden border-l-4 bg-surface-container cursor-pointer hover:shadow-xl transition-shadow duration-300",
            remainingFund < 0 ? "border-red-500" : remainingFund > totalFund * 0.3 ? "border-emerald-500" : "border-[#8b7e3d]"
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[15px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <PiggyBank size={14} className={cn(remainingFund < 0 ? "text-red-600" : remainingFund > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]")} />
              QUỸ CÒN LẠI
            </h3>
          </div>
          <p className={cn(
            "text-4xl font-black font-headline mb-6 whitespace-nowrap",
            remainingFund < 0 ? "text-red-600" : remainingFund > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]"
          )}>
            {remainingFund.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
          </p>
          <div className="w-full bg-[#e5e2d0] h-2 rounded-full mb-4 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", remainingFund < 0 ? "bg-red-500" : remainingFund > totalFund * 0.3 ? "bg-emerald-500" : "bg-[#8b7e3d]")}
              style={{ width: `${Math.min(100, Math.max(0, (remainingFund / totalFund) * 100))}%` }}
            />
          </div>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
            remainingFund < 0 ? "text-red-600" : remainingFund > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]"
          )}>
            {remainingFund < 0 ? (
              <><AlertTriangle size={12} /> CẢNH BÁO: VƯỢT QUỸ CHI TIÊU</>
            ) : remainingFund > totalFund * 0.3 ? (
              <><CheckCircle2 size={12} /> NGÂN SÁCH CÒN DƯ</>
            ) : (
              <><AlertTriangle size={12} /> CẢNH BÁO: NGÂN SÁCH SẮP CẠN</>
            )}
          </p>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">
                  {editingExpenseId ? 'Chỉnh sửa khoản chi' : 'Thêm khoản chi mới'}
                </h2>
                <button onClick={closeExpenseModal} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Người chi</label>
                  <select
                    value={expenseForm.payer_id}
                    onChange={e => setExpenseForm({ ...expenseForm, payer_id: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Chọn thành viên...</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Chi tiết chi</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <input
                        type="text"
                        placeholder="Ăn sáng, Tiền xăng..."
                        value={expenseForm.reason}
                        onChange={e => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Phân loại</label>
                    <select
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                    >
                      <option value="Ẩm thực">Ẩm thực</option>
                      <option value="Di chuyển">Di chuyển</option>
                      <option value="Giải trí">Giải trí</option>
                      <option value="Lưu trú">Lưu trú</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Số tiền</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <input
                        type="number"
                        placeholder="500000"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Ngày chi</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low flex gap-3">
                <button
                  onClick={closeExpenseModal}
                  className="flex-1 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  {editingExpenseId ? 'Cập nhật' : 'Lưu khoản chi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải dữ liệu chi phí...</p>
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-10 px-2 sm:px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-surface-container-low rounded-2xl flex items-center justify-center">
                  <Wallet size={24} className="text-secondary opacity-60" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-headline text-on-surface">Danh sách khoản chi</h2>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">CẬP NHẬT: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Thêm khoản chi</span>
                  <span className="sm:hidden">Thêm</span>
                </button>
                <button
                  onClick={() => setIsSettlementModalOpen(true)}
                  className="flex items-center gap-2 bg-[#ffdc2e] text-on-surface-variant px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-xl shadow-[#ffdc2e]/20 hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <CheckCircle2 size={20} />
                  Quyết toán
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-secondary text-[10px] font-bold uppercase tracking-widest text-left">
                      <th className="px-6 pb-2">
                        <button
                          onClick={() => toggleSort('name')}
                          className={cn(
                            "flex items-center gap-1 hover:text-primary transition-colors",
                            sortKey === 'name' && "text-primary"
                          )}
                        >
                          NGƯỜI CHI <ArrowUpDown size={12} className={sortKey === 'name' ? "text-primary" : "opacity-40"} />
                        </button>
                      </th>
                      <th className="px-6 pb-2">CHI TIẾT</th>
                      <th className="px-6 pb-2">
                        <button
                          onClick={() => toggleSort('time')}
                          className={cn(
                            "flex items-center gap-1 hover:text-primary transition-colors",
                            sortKey === 'time' && "text-primary"
                          )}
                        >
                          THỜI GIAN <ArrowUpDown size={12} className={sortKey === 'time' ? "text-primary" : "opacity-40"} />
                        </button>
                      </th>
                      <th className="px-6 pb-2 text-right">
                        <button
                          onClick={() => toggleSort('amount')}
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-primary transition-colors",
                            sortKey === 'amount' && "text-primary"
                          )}
                        >
                          SỐ TIỀN <ArrowUpDown size={12} className={sortKey === 'amount' ? "text-primary" : "opacity-40"} />
                        </button>
                      </th>
                      <th className="px-6 pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((expense, index) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-surface-container-low transition-all duration-300"
                      >
                        <td className="px-6 py-5 rounded-l-[2rem] border-y border-l border-outline-variant/5">
                          <div className="flex items-center gap-4">
                            {expense.participants?.avatar_url ? (
                              <img src={expense.participants.avatar_url} alt={expense.participants?.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm", expense.participants?.color_class)}>
                                {expense.participants?.initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-on-surface">{expense.participants?.name}</span>
                              {expense.payer_id === treasurerId && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-0.5">
                                  <ShieldCheck size={10} /> Thủ quỹ
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 border-y border-outline-variant/5">
                          <p className="text-base font-bold text-on-surface">{expense.reason}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest">{expense.category || 'Ẩm thực'}</p>
                        </td>
                        <td className="px-6 py-5 border-y border-outline-variant/5 text-sm text-on-surface-variant font-medium italic">
                          {new Date(expense.created_at).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).replace(',', '')}
                        </td>
                        <td className="px-6 py-5 border-y border-outline-variant/5 text-right font-black text-primary text-xl">
                          {Number(expense.amount).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-5 rounded-r-[2rem] border-y border-r border-outline-variant/5 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditExpenseModal(expense)}
                              className="p-3 hover:bg-primary/10 rounded-xl text-primary transition-all"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-3 hover:bg-red-100 rounded-xl text-red-500 transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
      )}

      {/* End Trip Confirmation Modal */}
      <AnimatePresence>
        {isEndTripModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEndTripModalOpen(false)}
              className="absolute inset-0 bg-inverse-surface/10 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white/70 backdrop-blur-2xl border border-white/40 w-full max-w-lg rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsEndTripModalOpen(false)}
                className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-black/5"
              >
                <X size={24} />
              </button>

              {/* Modal Content */}
              <div className="p-10 text-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
                  <CheckCircle2 size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-4 font-headline">
                  Hoàn thành hành trình?
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-sm mx-auto">
                  Chuyến đi của bạn đã kết thúc. Hãy chắc chắn rằng mọi chi phí đã được ghi nhận trước khi chốt quyết toán.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setIsEndTripModalOpen(false);
                      navigate('/settlement', { state: { expenses, fundContributions } });
                    }}
                    className="w-full bg-primary text-on-primary font-bold py-4.5 px-6 rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-container hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    <span>Xác nhận & Chốt quyết toán</span>
                    <Flag size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEndTripModalOpen(false);
                      setIsSettlementOpen(true);
                    }}
                    className="w-full bg-surface-container-high/50 text-on-surface font-semibold py-4 px-6 rounded-2xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={18} />
                    <span>Xem bản Xem trước (Preview)</span>
                  </button>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-tertiary opacity-80" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fund Contribution Modal */}
      <AnimatePresence>
        {isFundModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFundModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center shrink-0 bg-surface-container-low">
                <h2 className="text-xl font-bold font-headline">Danh sách nộp quỹ</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsFundAddOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Plus size={14} />
                    Nộp quỹ
                  </button>
                  <button onClick={() => setIsFundModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-6 flex-1 bg-surface-container-low/40">
                {/* History Table */}
                <section>
                  <div className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 overflow-hidden">
                    <table className="w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-secondary text-[10px] font-bold uppercase tracking-widest text-left">
                          <th className="pb-2 px-3">
                            <button
                              onClick={() => toggleFundSort('name')}
                              className={cn("flex items-center gap-1 hover:text-primary transition-colors", fundSortKey === 'name' && "text-primary")}
                            >
                              THÀNH VIÊN <ArrowUpDown size={12} className={fundSortKey === 'name' ? "text-primary" : "opacity-40"} />
                            </button>
                          </th>
                          <th className="pb-2 px-3">
                            <button
                              onClick={() => toggleFundSort('time')}
                              className={cn("flex items-center gap-1 hover:text-primary transition-colors", fundSortKey === 'time' && "text-primary")}
                            >
                              THỜI GIAN <ArrowUpDown size={12} className={fundSortKey === 'time' ? "text-primary" : "opacity-40"} />
                            </button>
                          </th>
                          <th className="pb-2 px-3 text-right">
                            <button
                              onClick={() => toggleFundSort('amount')}
                              className={cn("inline-flex items-center gap-1 hover:text-primary transition-colors", fundSortKey === 'amount' && "text-primary")}
                            >
                              SỐ TIỀN <ArrowUpDown size={12} className={fundSortKey === 'amount' ? "text-primary" : "opacity-40"} />
                            </button>
                          </th>
                          <th className="pb-2 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFundContributions.map((c) => (
                          <tr key={c.id} className="group hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-3 rounded-l-2xl border-y border-l border-outline-variant/5">
                              <div className="flex items-center gap-3">
                                {c.participants?.avatar_url ? (
                                  <img src={c.participants.avatar_url} alt={c.participants?.name} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                                ) : (
                                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm", c.participants?.color_class)}>
                                    {c.participants?.initials}
                                  </div>
                                )}
                                <span className="text-sm font-bold">{c.participants?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 border-y border-outline-variant/5 text-xs text-secondary font-medium">
                              {new Date(c.created_at).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              }).replace(',', '')}
                            </td>
                            <td className="py-3 px-3 border-y border-outline-variant/5 text-right font-black text-primary">
                              {Number(c.amount).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-3 rounded-r-2xl border-y border-r border-outline-variant/5">
                              <button
                                onClick={() => handleDeleteFundContribution(c.id)}
                                className="p-2 hover:bg-red-100 rounded-xl text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {paginatedFundContributions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-secondary text-sm font-medium italic">
                              Chưa có lịch sử nộp quỹ nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {fundTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-6 mt-8">
                        <button
                          onClick={() => setFundCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={fundCurrentPage === 1}
                          className="p-2.5 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-secondary uppercase tracking-widest">TRANG</span>
                          <span className="text-sm font-black text-primary">{fundCurrentPage}</span>
                          <span className="text-xs font-bold text-secondary">/</span>
                          <span className="text-sm font-black text-secondary">{fundTotalPages}</span>
                        </div>
                        <button
                          onClick={() => setFundCurrentPage(prev => Math.min(fundTotalPages, prev + 1))}
                          disabled={fundCurrentPage === fundTotalPages}
                          className="p-2.5 rounded-2xl bg-surface-container-low text-secondary disabled:opacity-30 transition-all hover:bg-surface-container active:scale-90"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fund Add Modal (sibling, not nested) */}
      <AnimatePresence>
        {isFundAddOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFundAddOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-outline-variant/20 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                  <Plus size={18} className="text-primary" />
                  Nộp quỹ mới
                </h3>
                <button onClick={() => setIsFundAddOpen(false)} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] uppercase font-bold text-secondary tracking-widest">Thành viên</label>
                    <button
                      onClick={toggleAllFundParticipants}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-all",
                        fundSelectedParticipants.length === participants.length
                          ? "bg-primary text-white"
                          : "bg-surface-container-low text-primary hover:bg-primary/10"
                      )}
                    >
                      {fundSelectedParticipants.length === participants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                  <div className="bg-surface-container-low/50 rounded-2xl p-3 max-h-36 overflow-y-auto scrollbar-hide space-y-1">
                    {participants.map(p => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all",
                          fundSelectedParticipants.includes(p.id) ? "bg-primary/10" : "hover:bg-surface-container-low"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={fundSelectedParticipants.includes(p.id)}
                          onChange={() => toggleFundParticipant(p.id)}
                          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
                        />
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0", p.colorClass || p.color_class)}>
                            {p.initials}
                          </div>
                        )}
                        <span className="text-sm font-bold">{p.name}</span>
                      </label>
                    ))}
                  </div>
                  {fundSelectedParticipants.length > 0 && (
                    <p className="text-[9px] text-primary font-bold mt-2 ml-1">
                      Đã chọn {fundSelectedParticipants.length} thành viên • Tổng: {(Number(fundAmount) * fundSelectedParticipants.length).toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-secondary tracking-widest mb-3 block">Số tiền / người (VNĐ)</label>
                  <div className="flex gap-2 mb-3">
                    {[500000, 1000000, 2000000, 5000000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setFundAmount(preset.toString())}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-black transition-all",
                          fundAmount === preset.toString()
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-surface-container-low text-secondary hover:bg-surface-container"
                        )}
                      >
                        {(preset / 1000).toLocaleString('vi-VN')}k
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Hoặc nhập số tiền khác..."
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary font-bold text-lg"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-outline-variant/10 shrink-0">
                <button
                  onClick={handleFundConfirm}
                  disabled={fundSelectedParticipants.length === 0 || !fundAmount}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  Xác nhận nộp quỹ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settlement Preview Modal */}
      <SettlementPreview
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        participants={participants}
        expenses={expenses}
        fundContributions={fundContributions}
        treasurerId={treasurerId}
        onConfirmSettlement={() => {
          setIsSettlementOpen(false);
          navigate('/settlement', { state: { expenses, fundContributions } });
        }}
      />

      {/* Settlement Modal */}
      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        participants={participants}
        expenses={expenses}
        fundContributions={fundContributions}
        treasurerId={treasurerId}
      />
    </div>
  );
}
