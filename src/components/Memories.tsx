import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudUpload, Loader2, X, Trash2, Download, ChevronLeft, ChevronRight, Clock, ImagePlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { getMemories, addMemory as addMemorySupabase, uploadImage, deleteMemory as deleteMemorySupabase } from '../lib/supabase';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(',', '');
}

export default function Memories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger'
  });

  const [uploadFiles, setUploadFiles] = useState<{ file: File; preview: string; name: string }[]>([]);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const data = await getMemories();
        setMemories(data);
      } catch (error) {
        console.error('Error fetching memories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const entries: { file: File; preview: string; name: string }[] = [];
    Array.from(files).forEach((f: File) => {
      const preview = URL.createObjectURL(f);
      entries.push({ file: f, preview, name: f.name.split('.')[0] });
    });
    setUploadFiles(entries);
    setIsUploadModalOpen(true);
    event.target.value = '';
  };

  const handleUploadAll = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const results = await Promise.all(
        uploadFiles.map(async ({ file, name }) => {
          const imageUrl = await uploadImage(file);
          return addMemorySupabase({
            title: name || 'Kỷ niệm mới',
            caption: 'Khoảnh khắc tuyệt vời',
            image_url: imageUrl,
            aspect_ratio: 'aspect-square'
          });
        })
      );
      setMemories([...results.reverse(), ...memories]);
      showToast(`Tải ${results.length} ảnh thành công`, 'success');
      closeUploadModal();
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast('Tải ảnh thất bại', 'error');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    uploadFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setUploadFiles([]);
  };

  const handleDeleteMemory = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa kỷ niệm',
      message: 'Bạn có chắc chắn muốn xóa kỷ niệm này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteMemorySupabase(id);
          setMemories(memories.filter(m => m.id !== id));
          if (lightboxIndex !== null) setLightboxIndex(null);
          showToast('Xóa kỷ niệm thành công', 'success');
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting memory:', error);
          showToast('Xóa kỷ niệm thất bại', 'error');
        }
      }
    });
  };

  const handleDownload = useCallback(async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob: Blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'memory'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã lưu ảnh về thiết bị', 'success');
    } catch {
      showToast('Lưu ảnh thất bại', 'error');
    }
  }, [showToast]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex(prev => prev !== null ? Math.max(0, prev - 1) : null);
  const goNext = () => setLightboxIndex(prev => prev !== null ? Math.min(memories.length - 1, prev + 1) : null);

  const currentMemory = lightboxIndex !== null ? memories[lightboxIndex] : null;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-20">
      <header className="relative mb-12 h-64 rounded-[3rem] overflow-visible flex flex-col justify-center px-12 shadow-sm border border-outline-variant/10">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[3rem]">
          <img
            src="/images/background.png"
            alt="Memories Background"
            className="w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black tracking-tighter text-primary mb-3 font-headline">
              Tường Kỷ Niệm
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Lưu giữ những khoảnh khắc tuyệt vời nhất tại thành phố biển Vũng Tàu.
            </p>
          </div>
          <div className="relative">
            <input
              type="file"
              id="memory-upload"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label
              htmlFor="memory-upload"
              className={cn(
                "flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all duration-200 cursor-pointer hover:brightness-110",
                uploading && "opacity-70 cursor-not-allowed"
              )}
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}
              <span>{uploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
            </label>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      {/* Upload Preview Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeUploadModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">
                  {uploadFiles.length} ảnh đã chọn
                </h2>
                <button onClick={closeUploadModal} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {uploadFiles.map((f, i) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container-low">
                        <img src={f.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => {
                          const updated = [...uploadFiles];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setUploadFiles(updated);
                        }}
                        placeholder="Tên ảnh..."
                        className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-surface-container-low flex gap-3">
                <button
                  onClick={closeUploadModal}
                  className="flex-1 bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : <CloudUpload size={20} />}
                  {uploading ? 'Đang tải...' : `Tải ${uploadFiles.length} ảnh`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentMemory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 md:p-10"
            >
              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
              >
                <X size={24} />
              </button>

              {/* Image */}
              <div className="relative max-w-4xl w-full max-h-[80vh] flex items-center justify-center">
                <img
                  src={currentMemory.image_url || currentMemory.imageUrl}
                  alt={currentMemory.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Navigation */}
              {lightboxIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              {lightboxIndex < memories.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              {/* Counter */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold">
                {lightboxIndex + 1} / {memories.length}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải kỷ niệm...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <ImagePlus size={64} className="opacity-30 mb-4" />
          <p className="font-bold text-lg mb-1">Chưa có kỷ niệm nào</p>
          <p className="text-sm opacity-60">Nhấn "Thêm ảnh" để bắt đầu lưu giữ khoảnh khắc</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {memories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => openLightbox(index)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low shadow-sm group-hover:shadow-xl transition-all duration-300">
                <img
                  src={memory.image_url || memory.imageUrl}
                  alt={memory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(memory.image_url || memory.imageUrl, memory.title); }}
                      className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMemory(memory.id); }}
                      className="p-2 bg-red-500/60 hover:bg-red-500/80 text-white rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm truncate">{memory.title}</p>
                    <div className="flex items-center gap-1 text-white/70 text-[10px] mt-0.5">
                      <Clock size={10} />
                      <span>{formatRelativeTime(memory.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
