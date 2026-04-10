import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Plus, X, UserPlus, Loader2, Calendar, DollarSign, Tag, Trash2, Edit2, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, PiggyBank, Receipt, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Participant } from '../types';
import { getParticipants, addParticipant as addParticipantSupabase, deleteParticipant as deleteParticipantSupabase, getExpenses, addExpense as addExpenseSupabase, deleteExpense as deleteExpenseSupabase, updateExpense as updateExpenseSupabase, getFundContributions, addFundContribution } from '../lib/supabase';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';
import FundContributionView from './FundContributionView';

type ViewMode = 'dashboard' | 'fund';

export default function Expenses() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fundContributions, setFundContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const { showToast } = useToast();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEndTripModalOpen, setIsEndTripModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'time' | 'name' | 'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 5;

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
        const [pData, eData, fData] = await Promise.all([
          getParticipants(),
          getExpenses(),
          getFundContributions()
        ]);
        setParticipants(pData);
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

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;
    const initials = newParticipantName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-primary-fixed text-primary',
      'bg-secondary-fixed text-on-secondary-fixed',
      'bg-tertiary-fixed text-on-tertiary-fixed',
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const newP = await addParticipantSupabase({
        name: newParticipantName,
        initials,
        color_class: randomColor || 'bg-gray-100 text-gray-700'
      });
      setParticipants([...participants, { ...newP, colorClass: newP.color_class }]);
      setNewParticipantName('');
    } catch (error) {
      console.error('Error adding participant:', error);
    }
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

  const handleRemoveParticipant = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa thành viên',
      message: 'Xóa thành viên này sẽ xóa tất cả các khoản chi liên quan. Bạn có chắc chắn muốn tiếp tục?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteParticipantSupabase(id);
          setParticipants(participants.filter(p => p.id !== id));
          // Also refresh expenses since they might have been deleted by cascade
          const updatedExpenses = await getExpenses();
          setExpenses(updatedExpenses);
          showToast('Xóa thành viên thành công', 'success');
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error removing participant:', error);
          showToast('Xóa thành viên thất bại', 'error');
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

  if (viewMode === 'fund') {
    return (
      <FundContributionView
        participants={participants}
        contributions={fundContributions}
        onBack={() => setViewMode('dashboard')}
        onAddContribution={handleAddFundContribution}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
      <header className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-on-surface font-headline mb-4">
              Quản lý chi phí
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-8 py-6 rounded-[2.5rem] flex items-center gap-8 shadow-sm border border-outline-variant/10">
              <div className="flex flex-col border-r border-outline-variant/20 pr-8">
                <p className="text-[10px] uppercase font-bold text-secondary tracking-widest leading-none mb-3">THÀNH VIÊN</p>
                <div className="flex items-center gap-3 group cursor-pointer relative">
                  <div className="flex -space-x-3">
                    {participants.slice(0, 3).map(p => (
                      <div key={p.id} className={cn("w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-110", p.colorClass || p.color_class)}>
                        {p.initials}
                      </div>
                    ))}
                    {participants.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-surface-container flex items-center justify-center text-xs font-bold text-secondary shadow-sm group-hover:scale-110">
                        +{participants.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-secondary opacity-60 whitespace-nowrap">{participants.length} thành viên tham gia</span>

                  {/* Hover Tooltip for Members */}
                  <div className="absolute top-full left-0 mt-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/10 min-w-[200px]">
                      <p className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest">Danh sách nhóm</p>
                      <div className="space-y-2">
                        {participants.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold", p.colorClass || p.color_class)}>
                              {p.initials}
                            </div>
                            <span className="text-xs font-bold text-on-surface">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsManageModalOpen(true)}
                className="flex flex-col items-center gap-1 text-secondary hover:text-primary transition-colors group"
              >
                <div className="p-2 bg-surface-container-low rounded-xl group-hover:bg-primary/10 transition-colors">
                  <UserPlus size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase">Quản lý</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-surface-container p-8 md:p-10 rounded-[3rem] shadow-sm overflow-hidden border border-outline-variant/10 cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">TỔNG NGÂN SÁCH</h3>
            <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Wallet size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-4xl font-black text-on-surface font-headline mb-6 whitespace-nowrap">
            {totalFund.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
          </p>
          <button
            onClick={() => setViewMode('fund')}
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
          className="bg-surface-container p-8 md:p-10 rounded-[3rem] shadow-sm overflow-hidden border border-outline-variant/10 cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">THỰC CHI</h3>
            <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Receipt size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-4xl font-black text-primary font-headline mb-6 whitespace-nowrap">
            {totalSpending.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-primary px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-widest">THỰC TẾ</div>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Cập nhật theo hóa đơn</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className={cn(
            "p-8 md:p-10 rounded-[3rem] shadow-sm overflow-hidden border-l-[12px] bg-surface-container cursor-pointer hover:shadow-xl transition-shadow duration-300",
            remainingFund < 0 ? "border-red-500" : remainingFund > totalFund * 0.3 ? "border-emerald-500" : "border-[#8b7e3d]"
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h3 className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">QUỸ CÒN LẠI</h3>
            <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center", remainingFund < 0 ? "bg-red-500/10" : remainingFund > totalFund * 0.3 ? "bg-emerald-500/10" : "bg-[#8b7e3d]/10")}>
              <PiggyBank size={24} className={cn(remainingFund < 0 ? "text-red-600" : remainingFund > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]")} />
            </div>
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

      {/* Participant Management Modal */}
      <AnimatePresence>
        {isManageModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <button onClick={() => setIsManageModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Tên thành viên mới..."
                    className="flex-grow bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddParticipant}
                    className="bg-primary text-on-primary p-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", p.colorClass || p.color_class)}>
                          {p.initials}
                        </div>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="p-3 hover:bg-red-100 rounded-xl text-red-500 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-surface-container-low">
                <button
                  onClick={() => setIsManageModalOpen(false)}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  Xong
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center">
                  <Wallet size={24} className="text-secondary opacity-60" />
                </div>
                <div>
                  <h2 className="text-3xl font-black font-headline text-on-surface">Danh sách khoản chi</h2>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">CẬP NHẬT: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
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
                    Số tiền <ArrowUpDown size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus size={20} />
                  Thêm khoản chi
                </button>
                <button
                  onClick={() => setIsEndTripModalOpen(true)}
                  className="flex items-center gap-2 bg-[#ffdc2e] text-on-surface-variant px-8 py-4 rounded-2xl font-black shadow-xl shadow-[#ffdc2e]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <CheckCircle2 size={20} />
                  Kết thúc hành trình
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-secondary text-[10px] font-bold uppercase tracking-widest text-left">
                      <th className="px-6 pb-2">NGƯỜI CHI</th>
                      <th className="px-6 pb-2">CHI TIẾT</th>
                      <th className="px-6 pb-2">THỜI GIAN</th>
                      <th className="px-6 pb-2 text-right">SỐ TIỀN</th>
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
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm", expense.participants?.color_class)}>
                              {expense.participants?.initials}
                            </div>
                            <span className="text-base font-bold text-on-surface">{expense.participants?.name}</span>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEndTripModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <button
                onClick={() => setIsEndTripModalOpen(false)}
                className="absolute right-6 top-6 p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-[#ffcc00] rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <h2 className="text-3xl font-black font-headline text-on-background mb-4 leading-tight">
                  Xác nhận Kết thúc Hành trình
                </h2>
                <p className="text-secondary font-medium leading-relaxed">
                  Chuyến đi của bạn đã hoàn thành? Hãy kiểm tra lại các khoản chi trước khi chốt quyết toán cuối cùng.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsEndTripModalOpen(false);
                    showToast('Đã chốt quyết toán thành công!', 'success');
                  }}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all"
                >
                  Xác nhận & Chốt quyết toán 🚩
                </button>
                <button
                  onClick={() => setIsEndTripModalOpen(false)}
                  className="w-full bg-[#ffcc00] text-on-background py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:brightness-95 active:scale-95 transition-all"
                >
                  <Tag size={18} />
                  Xem bản Xem trước (Preview)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
