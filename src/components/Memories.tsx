import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CloudUpload, Loader2, X, Image as ImageIcon, Type, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getMemories, addMemory as addMemorySupabase, uploadImage, deleteMemory as deleteMemorySupabase } from '../lib/supabase';
import { AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';

export default function Memories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
  const [uploadForm, setUploadForm] = useState({
    title: '',
    caption: '',
    file: null as File | null,
    previewUrl: ''
  });

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadForm({
        ...uploadForm,
        file,
        previewUrl: reader.result as string,
        title: file.name.split('.')[0]
      });
      setIsUploadModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(uploadForm.file);
      const newMemory = await addMemorySupabase({
        title: uploadForm.title || 'Kỷ niệm mới',
        caption: uploadForm.caption || 'Khoảnh khắc tuyệt vời',
        image_url: imageUrl,
        aspect_ratio: 'aspect-[4/5]'
      });
      setMemories([newMemory, ...memories]);
      showToast('Tải kỷ niệm thành công', 'success');
      closeUploadModal();
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Tải ảnh thất bại. Vui lòng kiểm tra cấu hình Supabase Storage.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadForm({
      title: '',
      caption: '',
      file: null,
      previewUrl: ''
    });
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
          showToast('Xóa kỷ niệm thành công', 'success');
        } catch (error) {
          console.error('Error deleting memory:', error);
          showToast('Xóa kỷ niệm thất bại', 'error');
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-6xl font-black tracking-tighter text-primary mb-4 font-headline">
            Tường Kỷ Niệm
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Lưu giữ những khoảnh khắc tuyệt vời nhất tại thành phố biển Vũng Tàu. Những cơn sóng, nắng vàng và nụ cười rạng rỡ.
          </p>
        </div>
        <div className="relative">
          <input 
            type="file" 
            id="memory-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label 
            htmlFor="memory-upload"
            className={cn(
              "flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3.5 rounded-xl font-bold shadow-[0_12px_32px_rgba(28,28,17,0.06)] active:scale-95 transition-all duration-200 cursor-pointer",
              uploading && "opacity-70 cursor-not-allowed"
            )}
          >
            <CloudUpload size={20} />
            <span>Tải ảnh lên</span>
          </label>
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

      {/* Upload Modal */}
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
              className="relative bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-1/2 bg-surface-container-low flex items-center justify-center p-4">
                {uploadForm.previewUrl && (
                  <img 
                    src={uploadForm.previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[400px] rounded-2xl shadow-lg object-cover aspect-[4/5]"
                  />
                )}
              </div>
              <div className="w-full md:w-1/2 p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold font-headline text-primary">Thêm kỷ niệm</h2>
                  <button onClick={closeUploadModal} className="p-2 hover:bg-surface-container rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6 flex-grow">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase ml-1 flex items-center gap-2">
                      <Type size={14} /> Tiêu đề
                    </label>
                    <input 
                      type="text" 
                      placeholder="Tên kỷ niệm..."
                      value={uploadForm.title}
                      onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase ml-1 flex items-center gap-2">
                      <MessageSquare size={14} /> Mô tả khoảnh khắc
                    </label>
                    <textarea 
                      placeholder="Bạn đang cảm thấy thế nào?..."
                      rows={4}
                      value={uploadForm.caption}
                      onChange={e => setUploadForm({...uploadForm, caption: e.target.value})}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={closeUploadModal}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <CloudUpload size={20} />}
                    <span>{uploading ? 'Đang tải...' : 'Lưu kỷ niệm'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-secondary">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-bold">Đang tải kỷ niệm...</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          {memories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-6 break-inside-avoid group cursor-pointer"
            >
              <div className="relative overflow-hidden breeze-mask bg-surface-container-low shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img
                  src={memory.image_url || memory.imageUrl}
                  alt={memory.title}
                  className={cn("w-full object-cover group-hover:scale-105 transition-transform duration-700", memory.aspect_ratio || memory.aspectRatio)}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMemory(memory.id);
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-5 bg-surface-container-lowest">
                  <h3 className="font-headline font-bold text-primary mb-1">{memory.title}</h3>
                  <p className="text-sm text-on-surface-variant italic">{memory.caption}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
