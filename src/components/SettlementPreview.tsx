import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, CheckCircle2, Edit2, Wallet, Receipt, PiggyBank, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Participant } from '../types';

interface SettlementRow {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
  avatarUrl?: string;
  fundContributed: number;
  paidOnBehalf: number;
  balance: number;
  isTreasurer: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  expenses: any[];
  fundContributions: any[];
  treasurerId: string;
  onConfirmSettlement: () => void;
}

export default function SettlementPreview({
  isOpen,
  onClose,
  participants,
  expenses,
  fundContributions,
  treasurerId,
  onConfirmSettlement
}: Props) {
  const { totalFund, totalSpending, remaining, sharePerPerson, settlementData } = useMemo(() => {
    const tFund = fundContributions.reduce((acc: number, c: any) => acc + Number(c.amount), 0);
    const tSpending = expenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);
    const share = participants.length > 0 ? tSpending / participants.length : 0;

    const rows: SettlementRow[] = participants.map(p => {
      const fundContributed = fundContributions
        .filter((c: any) => c.participant_id === p.id)
        .reduce((acc: number, c: any) => acc + Number(c.amount), 0);

      const paidOnBehalf = expenses
        .filter((e: any) => e.payer_id === p.id)
        .reduce((acc: number, e: any) => acc + Number(e.amount), 0);

      const isTreasurer = p.id === treasurerId;

      // Thủ quỹ: tiền chi hộ là từ quỹ chung → không tính hoàn lại
      // Thành viên thường: chi hộ = tiền túi → được hoàn
      const effectivePaid = isTreasurer ? 0 : paidOnBehalf;
      const balance = (fundContributed + effectivePaid) - share;

      return {
        id: p.id,
        name: p.name,
        initials: p.initials,
        colorClass: p.colorClass || p.color_class,
        avatarUrl: p.avatar_url,
        fundContributed,
        paidOnBehalf,
        balance,
        isTreasurer
      };
    });

    return {
      totalFund: tFund,
      totalSpending: tSpending,
      remaining: tFund - tSpending,
      sharePerPerson: share,
      settlementData: rows
    };
  }, [participants, expenses, fundContributions, treasurerId]);

  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-primary">Xem trước Quyết toán</h2>
                <p className="text-xs text-secondary mt-1">
                  Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 flex-1 space-y-6 scrollbar-hide">
              {/* Visual Summary Card - TOP */}
              <div className="relative w-full h-40 rounded-2xl overflow-hidden group">
                <img
                  alt="Vung Tau coastline"
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-transform duration-700"
                  src="/images/background.png"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <div>
                    <h4 className="text-white font-headline text-lg font-bold mb-1">Tổng kết hành trình</h4>
                    <p className="text-white/80 text-xs">
                      {remaining >= 0
                        ? `Chuyến đi hoàn thành xuất sắc, quỹ còn dư ${formatCurrency(remaining)} VND.`
                        : `Chuyến đi hoàn thành, quỹ thiếu ${formatCurrency(Math.abs(remaining))} VND cần bổ sung.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container p-5 rounded-xl flex flex-col justify-between border-l-4 border-primary">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Wallet size={12} className="text-primary" />
                    Tổng Ngân sách (Quỹ)
                  </span>
                  <div>
                    <span className="text-xl font-headline font-extrabold text-on-surface">{formatCurrency(totalFund)}</span>
                    <span className="text-xs font-bold text-on-surface-variant"> VND</span>
                  </div>
                </div>

                <div className="bg-surface-container p-5 rounded-xl flex flex-col justify-between border-l-4 border-tertiary">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Receipt size={12} className="text-tertiary" />
                    Tổng Thực chi
                  </span>
                  <div>
                    <span className="text-xl font-headline font-extrabold text-on-surface">{formatCurrency(totalSpending)}</span>
                    <span className="text-xs font-bold text-on-surface-variant"> VND</span>
                  </div>
                </div>

                <div className={cn(
                  "bg-surface-container p-5 rounded-xl flex flex-col justify-between border-l-4",
                  remaining < 0 ? "border-red-500" : remaining > totalFund * 0.3 ? "border-emerald-500" : "border-[#8b7e3d]"
                )}>
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <PiggyBank size={12} className={cn(
                      remaining < 0 ? "text-red-500" : remaining > totalFund * 0.3 ? "text-emerald-500" : "text-[#8b7e3d]"
                    )} />
                    Số dư / Thiếu
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-headline font-extrabold",
                      remaining < 0 ? "text-red-600" : remaining > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]"
                    )}>
                      {remaining >= 0 ? '+' : ''}{formatCurrency(remaining)}
                    </span>
                    {remaining >= 0 ? (
                      <TrendingUp size={18} className={cn(
                        remaining > totalFund * 0.3 ? "text-emerald-600" : "text-[#8b7e3d]"
                      )} />
                    ) : (
                      <TrendingDown size={18} className="text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Settlement Table */}
              <div className="bg-surface-container rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-outline-variant/10">
                  <h3 className="text-lg font-headline font-bold text-on-surface">Chi tiết từng thành viên</h3>
                  <p className="text-xs text-secondary mt-1">
                    Mức chi bình quân: <span className="font-black text-primary">{formatCurrency(sharePerPerson)} VND</span> / người
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high/50">
                        <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest">Thành viên</th>
                        <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Đã đóng quỹ</th>
                        <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Đã chi hộ</th>
                        <th className="px-5 py-3 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {settlementData.map((row) => (
                        <tr key={row.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {row.avatarUrl ? (
                                <img src={row.avatarUrl} alt={row.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                              ) : (
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm", row.colorClass)}>
                                  {row.initials}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-sm">{row.name}</span>
                                {row.isTreasurer && (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-0.5">
                                    <ShieldCheck size={10} /> Thủ quỹ
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm font-medium">{formatCurrency(row.fundContributed)}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-medium text-tertiary">{formatCurrency(row.paidOnBehalf)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={cn(
                              "font-bold text-sm flex items-center justify-end gap-1",
                              row.balance >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {row.balance >= 0 ? '+' : ''}{formatCurrency(row.balance)}
                              {row.balance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {settlementData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-16 text-center text-secondary text-sm italic">
                            Chưa có dữ liệu quyết toán
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-outline-variant/10 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirmSettlement}
                className="flex-1 bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 active:scale-95 duration-200 flex justify-center items-center gap-2 hover:brightness-110 transition-all"
              >
                <CheckCircle2 size={18} />
                Xác nhận Chốt Quyết toán
              </button>
              <button
                onClick={onClose}
                className="flex-1 border-2 border-primary text-primary font-bold py-3.5 px-6 rounded-xl hover:bg-primary/5 active:scale-95 duration-200 flex justify-center items-center gap-2 transition-all"
              >
                <Edit2 size={18} />
                Quay lại chỉnh sửa
              </button>
            </div>

            {/* Bottom Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary-container to-tertiary opacity-80" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
