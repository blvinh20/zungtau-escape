import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, MapPin, Edit2, Trash2, X, Clock, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Activity } from '../types';
import { cn } from '../lib/utils';
import { getActivities, addActivity as addActivitySupabase, deleteActivity as deleteActivitySupabase, updateActivity as updateActivitySupabase } from '../lib/supabase';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

// Parse "HH:MM" → minutes for sorting
function parseTime(time: string): number {
  if (!time) return 9999;
  const parts = time.split(':');
  if (parts.length < 2) return 9999;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

export default function Itinerary() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const [selectedDay, setSelectedDay] = useState(1);
  const [formData, setFormData] = useState({
    time: '',
    period: 'Sáng',
    title: '',
    location: '',
    location_url: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getActivities();
        const mappedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.image_url || a.imageUrl,
          location_url: a.location_url || a.locationUrl
        }));
        // Sort by day, then by time
        mappedData.sort((a: Activity, b: Activity) => {
          if (a.day !== b.day) return a.day - b.day;
          return parseTime(a.time) - parseTime(b.time);
        });
        setActivities(mappedData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const days = [
    { number: 1, date: 'Chủ Nhật, 26 Tháng 4', short: '26/04', label: 'CN' },
    { number: 2, date: 'Thứ Hai, 27 Tháng 4', short: '27/04', label: 'T2' },
  ];
  const currentActivities = activities.filter(a => a.day === selectedDay);

  const handleSaveActivity = async () => {
    try {
      const activityPayload = {
        day: currentDay,
        time: formData.time,
        period: formData.period,
        title: formData.title,
        location: formData.location,
        location_url: formData.location_url,
        description: formData.description,
        image_url: formData.imageUrl
      };

      if (editingId) {
        const updated = await updateActivitySupabase(editingId, activityPayload);
        setActivities(prev => {
          const list = prev.map(a => a.id === editingId ? { ...updated, imageUrl: updated.image_url, location_url: updated.location_url } : a);
          list.sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return parseTime(a.time) - parseTime(b.time);
          });
          return list;
        });
        showToast('Cập nhật hoạt động thành công', 'success');
      } else {
        const newActivity = await addActivitySupabase(activityPayload);
        setActivities(prev => {
          const list = [...prev, { ...newActivity, imageUrl: newActivity.image_url, location_url: newActivity.location_url }];
          list.sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return parseTime(a.time) - parseTime(b.time);
          });
          return list;
        });
        showToast('Thêm hoạt động thành công', 'success');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving activity:', error);
      showToast('Lưu hoạt động thất bại', 'error');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa hoạt động',
      message: 'Bạn có chắc chắn muốn xóa hoạt động này khỏi lịch trình? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteActivitySupabase(id);
          setActivities(activities.filter(a => a.id !== id));
          showToast('Xóa hoạt động thành công', 'success');
        } catch (error) {
          console.error('Error deleting activity:', error);
          showToast('Xóa hoạt động thất bại', 'error');
        }
      }
    });
  };

  const openAddModal = (day: number) => {
    setEditingId(null);
    setCurrentDay(day);
    setFormData({
      time: '',
      period: 'Sáng',
      title: '',
      location: '',
      location_url: '',
      description: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingId(activity.id);
    setCurrentDay(activity.day);
    setFormData({
      time: activity.time,
      period: activity.period,
      title: activity.title,
      location: activity.location,
      location_url: activity.location_url || '',
      description: activity.description,
      imageUrl: activity.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      time: '',
      period: 'Sáng',
      title: '',
      location: '',
      location_url: '',
      description: '',
      imageUrl: ''
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="relative mb-12 mt-4 sm:mt-8 mx-4 sm:mx-6 h-48 sm:h-64 rounded-[2rem] sm:rounded-[3rem] overflow-visible flex flex-col justify-center px-6 sm:px-12 shadow-sm border border-outline-variant/10">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
          <img
            src="/images/background.png"
            alt="Itinerary Background"
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-primary mb-2 font-headline">
            Lịch Trình
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-secondary font-bold tracking-wider uppercase text-sm">
              CHUYẾN ĐI VŨNG TÀU • 26/04 - 27/04
            </span>
          </div>
        </motion.div>
      </header>

      {/* Day Selector Tabs */}
      {!loading && (
        <div className="px-6 mb-12">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory justify-center">
            {days.map(day => (
              <button
                key={day.number}
                onClick={() => setSelectedDay(day.number)}
                className={cn(
                  "relative flex flex-col items-center px-6 py-4 rounded-2xl transition-all duration-300 min-w-[130px] shrink-0 snap-start",
                  selectedDay === day.number
                    ? "bg-primary text-white shadow-xl shadow-primary/25"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:shadow-md"
                )}
              >
                {selectedDay === day.number && (
                  <motion.div
                    layoutId="activeDay"
                    className="absolute inset-0 bg-primary rounded-2xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={cn(
                  "relative z-10 text-[9px] font-black uppercase tracking-widest mb-0.5",
                  selectedDay === day.number ? "text-white/70" : "text-on-surface-variant/60"
                )}>
                  Ngày {String(day.number).padStart(2, '0')}
                </span>
                <span className={cn(
                  "relative z-10 text-xl font-black font-headline tracking-tight",
                  selectedDay === day.number ? "text-white" : "text-on-surface"
                )}>
                  {day.short}
                </span>
                <span className={cn(
                  "relative z-10 text-[10px] font-bold mt-0.5",
                  selectedDay === day.number ? "text-white/80" : "text-on-surface-variant"
                )}>
                  {day.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải lịch trình...</p>
        </div>
      ) : (
        <div className="px-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <DaySection
                dayNumber={selectedDay}
                date={days[selectedDay - 1].date}
                activities={currentActivities}
                onAdd={() => openAddModal(selectedDay)}
                onEdit={openEditModal}
                onDelete={handleDeleteActivity}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Activity Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
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
                  {editingId ? 'Chỉnh sửa hoạt động' : `Thêm hoạt động - Ngày ${currentDay}`}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Giờ</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <input
                        type="text"
                        placeholder="11:30"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Buổi</label>
                    <select
                      value={formData.period}
                      onChange={e => setFormData({ ...formData, period: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                    >
                      <option>Sáng</option>
                      <option>Trưa</option>
                      <option>Chiều</option>
                      <option>Tối</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Tên hoạt động</label>
                  <input
                    type="text"
                    placeholder="Ăn trưa Bánh Khọt Cô Ba"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Địa điểm</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input
                      type="text"
                      placeholder="01 Hoàng Hoa Thám"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Link Google Maps</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input
                      type="text"
                      placeholder="https://maps.google.com/..."
                      value={formData.location_url}
                      onChange={e => setFormData({ ...formData, location_url: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Mô tả</label>
                  <textarea
                    placeholder="Thưởng thức đặc sản bánh khọt tôm nhảy..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Link ảnh (URL)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveActivity}
                  className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  {editingId ? 'Cập nhật' : 'Lưu hoạt động'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DaySectionProps {
  dayNumber: number;
  date: string;
  activities: Activity[];
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

function DaySection({ dayNumber, date, activities, onAdd, onEdit, onDelete }: DaySectionProps) {
  // Auto-sort by time
  const sorted = [...activities].sort((a, b) => parseTime(a.time) - parseTime(b.time));

  return (
    <section>
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-[15px] font-black text-[#ff8c42] uppercase tracking-[0.2em] bg-[#ffead5] px-4 py-1.5 rounded-full">
            Ngày 0{dayNumber}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-on-surface mt-4 font-headline tracking-tight">{date}</h2>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#ffdc2e] text-on-surface-variant px-8 py-4 rounded-[2rem] font-black shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <PlusCircle size={24} />
          Thêm Hoạt Động
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-secondary">
          <p className="font-bold text-lg">Chưa có hoạt động nào</p>
          <p className="text-sm mt-1">Nhấn "Thêm Hoạt Động" để bắt đầu lên lịch trình</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sorted.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex gap-4 md:gap-8 bg-surface-container/40 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden transition-shadow duration-500 hover:shadow-[0_32px_64px_rgba(28,28,17,0.06)] border border-outline-variant/10"
            >
              {/* Time Column */}
              <div className="w-24 md:w-32 shrink-0 text-center border-r-2 border-outline-variant/20 pr-4 md:pr-8 flex flex-col justify-center">
                <div className="text-2xl md:text-3xl font-black text-primary tracking-tighter leading-none">{activity.time}</div>
                <div className="text-[10px] font-black text-secondary uppercase tracking-widest mt-2">{activity.period}</div>
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-black text-on-surface mb-2 font-headline tracking-tight break-words">{activity.title}</h3>
                    {activity.location_url ? (
                      <a
                        href={activity.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1.5 font-bold text-sm"
                      >
                        <MapPin size={16} className="shrink-0" />
                        <span className="truncate">{activity.location}</span>
                      </a>
                    ) : (
                      <p className="text-on-surface-variant flex items-center gap-1.5 font-bold text-sm">
                        <MapPin size={16} className="shrink-0" />
                        <span className="truncate">{activity.location}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 ml-4">
                    <button
                      onClick={() => onEdit(activity)}
                      className="p-2.5 bg-surface-container-lowest/50 hover:bg-surface-container-lowest rounded-2xl text-secondary transition-colors shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 transition-colors shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {activity.imageUrl && (
                  <div className="rounded-3xl overflow-hidden mb-6 shadow-md border border-white/20">
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-full h-auto object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <p className="text-on-surface-variant leading-relaxed font-medium">{activity.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
