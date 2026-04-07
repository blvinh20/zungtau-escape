import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Wallet, Send, Plus, MoreVertical, X, UserPlus, Loader2, Calendar, DollarSign, Tag, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Participant, Expense } from '../types';
import { getParticipants, addParticipant as addParticipantSupabase, deleteParticipant as deleteParticipantSupabase, getExpenses, addExpense as addExpenseSupabase, deleteExpense as deleteExpenseSupabase, updateExpense as updateExpenseSupabase } from '../lib/supabase';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

export default function Expenses() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
    onConfirm: () => {},
    type: 'danger'
  });
  
  const [expenseForm, setExpenseForm] = useState({
    payer_id: '',
    reason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, eData] = await Promise.all([
          getParticipants(),
          getExpenses()
        ]);
        setParticipants(pData);
        setExpenses(eData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const participantCount = participants.length || 1;
  const perPerson = total / participantCount;

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const paginatedExpenses = expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    
    try {
      const payload = {
        payer_id: expenseForm.payer_id,
        reason: expenseForm.reason,
        amount: Number(expenseForm.amount),
        date: expenseForm.date
      };

      if (editingExpenseId) {
        await updateExpenseSupabase(editingExpenseId, payload);
        showToast('Cập nhật khoản chi thành công', 'success');
      } else {
        await addExpenseSupabase(payload);
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
      amount: expense.amount.toString(),
      date: expense.date
    });
    setIsAddExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsAddExpenseModalOpen(false);
    setEditingExpenseId(null);
    setExpenseForm({
      payer_id: '',
      reason: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
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
        } catch (error) {
          console.error('Error removing participant:', error);
          showToast('Xóa thành viên thất bại', 'error');
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-2 font-headline">
            Chi phí chuyến đi
          </h1>
          <p className="text-secondary font-medium">Theo dõi và phân bổ ngân sách cho nhóm {participantCount} người</p>
        </div>
        <button 
          onClick={() => setIsManageModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl shadow-sm hover:brightness-95 transition-all active:scale-95"
        >
          <Users size={20} />
          Quản lý người tham gia
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl shadow-[0_12px_32px_rgba(28,28,17,0.04)] flex flex-col justify-center overflow-hidden relative group"
        >
          <div className="z-10">
            <h3 className="text-secondary uppercase tracking-widest text-xs font-bold mb-1">Tổng chi tiêu nhóm</h3>
            <p className="text-7xl font-extrabold text-on-background tracking-tighter font-headline">
              {total.toLocaleString('vi-VN')} <span className="text-2xl font-bold">đ</span>
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet size={192} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-primary bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-white shadow-xl flex flex-col justify-center items-center text-center"
        >
          <h3 className="uppercase tracking-widest text-xs font-bold mb-4 opacity-80">Mỗi người cần đóng</h3>
          <p className="text-4xl font-extrabold tracking-tight mb-2 font-headline">
            {perPerson.toLocaleString('vi-VN')} đ
          </p>
          <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm text-sm font-semibold">
            Dựa trên {participantCount} thành viên
          </div>
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
                <h2 className="text-xl font-bold font-headline">Quản lý người tham gia</h2>
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
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X size={18} />
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
                    onChange={e => setExpenseForm({...expenseForm, payer_id: e.target.value})}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Chọn thành viên...</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Chi tiết chi</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input 
                      type="text" 
                      placeholder="Ăn sáng, Tiền xăng..."
                      value={expenseForm.reason}
                      onChange={e => setExpenseForm({...expenseForm, reason: e.target.value})}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
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
                        onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
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
                        onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
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
        <section className="bg-surface-container-low rounded-[2rem] p-4 md:p-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <h2 className="text-2xl font-bold font-headline">Danh sách khoản chi</h2>
            <button 
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            >
              <Plus size={20} />
              Thêm khoản chi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-secondary text-sm font-bold uppercase tracking-wider text-left">
                  <th className="px-6 py-4">Người chi</th>
                  <th className="px-6 py-4">Chi tiết</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="font-medium">
                {paginatedExpenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-surface-container-lowest rounded-2xl group hover:bg-white transition-colors shadow-sm"
                  >
                    <td className="px-6 py-5 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", expense.participants?.color_class)}>
                          {expense.participants?.initials}
                        </div>
                        <span>{expense.participants?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">{expense.reason}</td>
                    <td className="px-6 py-5 text-on-surface-variant text-sm">{expense.date}</td>
                    <td className="px-6 py-5 text-right font-bold text-primary">
                      {Number(expense.amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-5 rounded-r-2xl text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => openEditExpenseModal(expense)}
                          className="p-2 hover:bg-surface-container-high rounded-lg text-secondary transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between text-sm text-secondary font-semibold gap-4">
            <p>Hiển thị {paginatedExpenses.length} trên {expenses.length} khoản chi</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <div className="flex items-center px-4 bg-primary/10 text-primary rounded-lg font-bold">
                Trang {currentPage} / {totalPages || 1}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
