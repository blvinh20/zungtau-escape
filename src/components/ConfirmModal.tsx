import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${
                type === 'danger' ? 'bg-red-100 text-red-600' : 
                type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold font-headline">{title}</h2>
            </div>
            
            <p className="text-secondary mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${
                  type === 'danger' ? 'bg-red-500' : 
                  type === 'warning' ? 'bg-amber-500' : 
                  'bg-primary'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
