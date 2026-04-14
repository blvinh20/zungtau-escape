import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CloudUpload, Loader2, X, Trash2, Download, ChevronLeft, ChevronRight,
  Clock, ImagePlus, Check, Sparkles, Waves, Utensils, MapPin, Users,
  Image as ImageIcon, Camera, CheckSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getMemories, addMemory as addMemorySupabase, uploadImage, deleteMemory as deleteMemorySupabase } from '../lib/supabase';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';

// ── Album definitions ──

interface AlbumDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
}

const ALBUMS: AlbumDef[] = [
  { key: 'Tất cả', label: 'Tất cả', icon: <Sparkles size={14} />, activeClass: 'bg-primary text-white shadow-lg shadow-primary/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
  { key: 'Biển', label: 'Biển', icon: <Waves size={14} />, activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
  { key: 'Ẩm thực', label: 'Ẩm thực', icon: <Utensils size={14} />, activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
  { key: 'Hoạt động', label: 'Hoạt động', icon: <MapPin size={14} />, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
  { key: 'Nhóm', label: 'Nhóm', icon: <Users size={14} />, activeClass: 'bg-pink-500 text-white shadow-lg shadow-pink-500/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
  { key: 'Khác', label: 'Khác', icon: <ImageIcon size={14} />, activeClass: 'bg-gray-500 text-white shadow-lg shadow-gray-500/20', inactiveClass: 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant' },
];





// ── Component ──

export default function Memories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeAlbum, setActiveAlbum] = useState('Tất cả');
  const [uploadAlbum, setUploadAlbum] = useState('Khác');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridAreaRef = useRef<HTMLDivElement>(null);



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

  // Filter by album and sort by date (newest first)
  const filteredMemories = useMemo(() => {
    const filtered = activeAlbum === 'Tất cả' ? memories : memories.filter(m => (m.album || 'Khác') === activeAlbum);
    return [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [memories, activeAlbum]);



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
            aspect_ratio: 'aspect-square',
            album: uploadAlbum,
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

  const handleBatchDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: `Xóa ${count} ảnh`,
      message: `Bạn có chắc chắn muốn xóa ${count} ảnh đã chọn? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all([...selectedIds].map(id => deleteMemorySupabase(id)));
          setMemories(prev => prev.filter(m => !selectedIds.has(m.id)));
          showToast(`Đã xóa ${count} ảnh`, 'success');
          setSelectedIds(new Set());
          setSelectionMode(false);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error batch deleting:', error);
          showToast('Xóa thất bại', 'error');
        }
      }
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredMemories.map(m => m.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
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

  const openLightbox = (globalIndex: number) => {
    if (selectionMode) return;
    setLightboxIndex(globalIndex);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex(prev => prev !== null ? Math.max(0, prev - 1) : null);
  const goNext = () => setLightboxIndex(prev => prev !== null ? Math.min(filteredMemories.length - 1, prev + 1) : null);
  const currentMemory = lightboxIndex !== null ? filteredMemories[lightboxIndex] : null;



  // Click outside to deselect
  useEffect(() => {
    if (!selectionMode) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!gridAreaRef.current) return;
      if (!gridAreaRef.current.contains(e.target as Node)) {
        clearSelection();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-28 sm:pb-20">
      {/* Header */}
      <header className="group relative mb-8 h-44 sm:h-56 rounded-[2rem] sm:rounded-[3rem] overflow-visible flex flex-col justify-center px-6 sm:px-12 shadow-sm border border-outline-variant/10">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
          <img
            src="/images/background.png"
            alt="Memories Background"
            className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-primary mb-2 font-headline">
              Kỷ niệm
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Lưu giữ những khoảnh khắc tuyệt vời nhất tại thành phố biển Vũng Tàu.
            </p>
          </div>
        </div>
      </header>

      {/* Album Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8 px-1">
        {ALBUMS.map(album => (
          <button
            key={album.key}
            onClick={() => { setActiveAlbum(album.key); setSelectionMode(false); setSelectedIds(new Set()); }}
            className={cn(
              'px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95',
              activeAlbum === album.key ? album.activeClass : album.inactiveClass
            )}
          >
            {album.icon}
            {album.label}
          </button>
        ))}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploading}
      />

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
              <div className="p-6 space-y-4">
                {/* Album selector */}
                <div>
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest ml-1 mb-2 block">Album</label>
                  <div className="flex flex-wrap gap-2">
                    {ALBUMS.filter(a => a.key !== 'Tất cả').map(album => (
                      <button
                        key={album.key}
                        onClick={() => setUploadAlbum(album.key)}
                        className={cn(
                          'px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all',
                          uploadAlbum === album.key ? album.activeClass : album.inactiveClass
                        )}
                      >
                        {album.icon}
                        {album.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview grid */}
                <div className="max-h-[40vh] overflow-y-auto">
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

      {/* Lightbox — chỉ close + prev/next */}
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
              className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-10"
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
              >
                <X size={24} />
              </button>

              <div className="relative max-w-4xl w-full max-h-[80vh] flex items-center justify-center">
                <img
                  src={currentMemory.image_url || currentMemory.imageUrl}
                  alt={currentMemory.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              {lightboxIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              {lightboxIndex < filteredMemories.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-20"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải kỷ niệm...</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <ImagePlus size={64} className="opacity-30 mb-4" />
          <p className="font-bold text-lg mb-1">Chưa có kỷ niệm nào</p>
          <p className="text-sm opacity-60">
            {activeAlbum === 'Tất cả'
              ? 'Nhấn nút + để bắt đầu lưu giữ khoảnh khắc'
              : `Chưa có ảnh trong album "${activeAlbum}"`}
          </p>
        </div>
      ) : (
        <div
          ref={gridAreaRef}
          className="relative"
        >

          {/* Inline Selection Toolbar */}
            <AnimatePresence>
              {selectionMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="sticky top-16 z-[60] bg-primary text-white px-4 py-3 flex items-center justify-between shadow-lg rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <button onClick={clearSelection} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                      <X size={22} />
                    </button>
                    <span className="font-bold">
                      {selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : 'Chọn ảnh'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Chọn tất cả
                    </button>
                    {selectedIds.size > 0 && (
                      <>
                        <button
                          onClick={async () => {
                            for (const id of selectedIds) {
                              const m = memories.find(mem => mem.id === id);
                              if (m) await handleDownload(m.image_url || m.imageUrl, m.title);
                            }
                          }}
                          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Download size={14} />
                          Lưu
                        </button>
                        <button
                          onClick={handleBatchDelete}
                          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Trash2 size={14} />
                          Xóa ({selectedIds.size})
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Photo Grid - single layout, sorted by date, first photo featured */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {filteredMemories.map((memory, index) => {
                const isFirst = index === 0;
                const isSelected = selectedIds.has(memory.id);
                const globalIdx = index;

                return (
                  <motion.div
                    key={memory.id}
                    data-photo-card
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelect(memory.id);
                      } else {
                        openLightbox(globalIdx);
                      }
                    }}
                    className={cn(
                      "relative cursor-pointer group overflow-hidden rounded-xl sm:rounded-2xl aspect-square",
                      isFirst && "col-span-2 row-span-2",
                      selectionMode && isSelected && "ring-3 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <img
                      src={memory.image_url || memory.imageUrl}
                      alt={memory.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />

                    {/* Selection Checkbox */}
                    {selectionMode && (
                      <div className={cn(
                        "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        isSelected ? "bg-primary" : "bg-black/30 group-hover:bg-black/50"
                      )}>
                        {isSelected ? <Check size={14} className="text-white" /> : <div className="w-3 h-3 rounded-full border-2 border-white/60" />}
                      </div>
                    )}

                    {/* Hover select checkbox (non-selection mode) */}
                    {!selectionMode && (
                      <div
                        onClick={(e) => { e.stopPropagation(); setSelectionMode(true); toggleSelect(memory.id); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 bg-black/30 hover:bg-black/50 cursor-pointer z-10"
                      >
                        <div className="w-3 h-3 rounded-full border-2 border-white/60" />
                      </div>
                    )}

                    {/* Hover info overlay (non-selection mode) - shows date + time */}
                    {!selectionMode && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2.5 pointer-events-none">
                        <p className="text-white font-bold text-[10px] truncate">{memory.title}</p>
                        <p className="text-white/70 text-[9px] flex items-center gap-1 mt-0.5">
                          <Clock size={9} />
                          {memory.created_at && new Date(memory.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
        </div>
      )}

      {/* FAB Upload Button */}
      <AnimatePresence>
        {!selectionMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "fixed z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/30",
              "hover:brightness-110 active:scale-90 transition-all duration-200",
              "flex items-center justify-center",
              "right-4 bottom-24 sm:right-8 sm:bottom-8",
              uploading && "opacity-70 cursor-not-allowed"
            )}
          >
            {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
