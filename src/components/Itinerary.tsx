import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, MapPin, Edit2, Trash2, X, Clock, Image as ImageIcon, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { Activity } from '../types';
import { cn } from '../lib/utils';
import { getActivities, addActivity as addActivitySupabase, deleteActivity as deleteActivitySupabase, updateActivity as updateActivitySupabase } from '../lib/supabase';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

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
    onConfirm: () => {},
    type: 'danger'
  });
  
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
        // Map image_url from snake_case to camelCase if needed, 
        // but getActivities returns raw data. Let's handle both.
        const mappedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.image_url || a.imageUrl,
          location_url: a.location_url || a.locationUrl
        }));
        setActivities(mappedData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const day1 = activities.filter(a => a.day === 1);
  const day2 = activities.filter(a => a.day === 2);

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
        setActivities(activities.map(a => a.id === editingId ? { ...updated, imageUrl: updated.image_url, location_url: updated.location_url } : a));
        showToast('Cập nhật hoạt động thành công', 'success');
      } else {
        const newActivity = await addActivitySupabase(activityPayload);
        setActivities([...activities, { ...newActivity, imageUrl: newActivity.image_url, location_url: newActivity.location_url }]);
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
      <header className="relative mb-12 mt-8 mx-6 h-64 rounded-[3rem] overflow-hidden flex flex-col justify-center px-12 shadow-sm border border-outline-variant/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/background.png" 
            alt="Itinerary Background" 
            className="w-full h-full object-cover opacity-60 brightness-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <h1 className="text-6xl font-black tracking-tighter text-[#005c8d] mb-2 font-headline">
            Lịch Trình
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[#8b6e30] font-bold tracking-wider uppercase text-sm">
              CHUYẾN ĐI VŨNG TÀU • 26/04 - 27/04
            </span>
          </div>
        </motion.div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải lịch trình...</p>
        </div>
      ) : (
        <div className="px-6 grid grid-cols-1 gap-16 pb-24">
          <DaySection 
            dayNumber={1} 
            date="Chủ Nhật, 26 Tháng 4" 
            activities={day1} 
            onAdd={() => openAddModal(1)}
            onEdit={openEditModal}
            onDelete={handleDeleteActivity}
          />
          <DaySection 
            dayNumber={2} 
            date="Thứ Hai, 27 Tháng 4" 
            activities={day2} 
            onAdd={() => openAddModal(2)}
            onEdit={openEditModal}
            onDelete={handleDeleteActivity}
          />
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
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase ml-1">Buổi</label>
                    <select 
                      value={formData.period}
                      onChange={e => setFormData({...formData, period: e.target.value})}
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
                    onChange={e => setFormData({...formData, title: e.target.value})}
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
                      onChange={e => setFormData({...formData, location: e.target.value})}
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
                      onChange={e => setFormData({...formData, location_url: e.target.value})}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase ml-1">Mô tả</label>
                  <textarea 
                    placeholder="Thưởng thức đặc sản bánh khọt tôm nhảy..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
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
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low flex gap-3">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
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
  return (
    <section>
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-[10px] font-black text-[#ff8c42] uppercase tracking-[0.2em] bg-[#ffead5] px-4 py-1.5 rounded-full">
            NGÀY 0{dayNumber}
          </span>
          <h2 className="text-4xl font-black text-[#1c1c11] mt-4 font-headline tracking-tight">{date}</h2>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#ffdc2e] text-[#4a4a4a] px-8 py-4 rounded-[2rem] font-black shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <PlusCircle size={24} />
          Thêm Hoạt Động
        </button>
      </div>

      <div className="space-y-8">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex gap-8 bg-[#f5f5e9]/40 p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 hover:shadow-[0_32px_64px_rgba(28,28,17,0.06)] border border-outline-variant/10"
          >
            <div className="w-32 shrink-0 text-center border-r-2 border-outline-variant/20 pr-8 flex flex-col justify-center">
              <div className="text-3xl font-black text-[#005c8d] tracking-tighter leading-none">{activity.time}</div>
              <div className="text-[10px] font-black text-secondary uppercase tracking-widest mt-2">{activity.period}</div>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-[#1c1c11] mb-2 font-headline tracking-tight">{activity.title}</h3>
                  {activity.location_url ? (
                    <a 
                      href={activity.location_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#005c8d] hover:underline flex items-center gap-1.5 font-bold text-sm"
                    >
                      <MapPin size={16} />
                      {activity.location}
                    </a>
                  ) : (
                    <p className="text-on-surface-variant flex items-center gap-1.5 font-bold text-sm">
                      <MapPin size={16} />
                      {activity.location}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => onEdit(activity)}
                    className="p-3 bg-white/50 hover:bg-white rounded-2xl text-secondary transition-colors shadow-sm"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => onDelete(activity.id)}
                    className="p-3 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              {activity.imageUrl && (
                <div className="rounded-3xl overflow-hidden mb-6 shadow-md border border-white/20">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    className="w-full h-auto object-cover max-h-[500px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <p className="text-[#4a4a4a] leading-relaxed font-medium">{activity.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
