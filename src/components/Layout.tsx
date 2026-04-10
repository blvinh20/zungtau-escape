import React, { useState, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Settings, Compass, Wallet, Image as ImageIcon, UserPlus, X, Camera, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useParticipants } from './ParticipantContext';
import { Participant } from '../types';

export default function Layout() {
  const { participants, addParticipant, removeParticipant, updateAvatar } = useParticipants();
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [avatarLightbox, setAvatarLightbox] = useState<Participant | null>(null);
  const editAvatarRef = useRef<HTMLInputElement>(null);
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addParticipant(newName, newAvatar);
    setNewName('');
    setNewAvatar(null);
    setNewAvatarPreview(null);
  };

  const handleEditAvatar = async (id: string, file: File) => {
    await updateAvatar(id, file);
    setEditingAvatarId(null);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-[0_12px_32px_rgba(28,28,17,0.06)]">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-primary font-headline">
            Vũng Tàu Escape
          </div>
          <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight">
            <NavLink
              to="/itinerary"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Itinerary
            </NavLink>
            <NavLink
              to="/expenses"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Expenses
            </NavLink>
            <NavLink
              to="/memories"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Memories
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            {/* Member Avatars */}
            <div className="flex items-center gap-2 group cursor-pointer relative">
              <div className="flex -space-x-2">
                {participants.slice(0, 4).map(p => (
                  <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn("w-full h-full flex items-center justify-center", p.colorClass || p.color_class)}>
                        {p.initials}
                      </div>
                    )}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-[9px] font-bold text-secondary shadow-sm">
                    +{participants.length - 4}
                  </div>
                )}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute top-full right-0 mt-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60]">
                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-outline-variant/10 min-w-[180px]">
                  <p className="text-[9px] font-black uppercase text-primary mb-2 tracking-widest">{participants.length} thành viên</p>
                  <div className="space-y-1.5">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold", p.colorClass || p.color_class)}>
                            {p.initials}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-on-surface">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsManageOpen(true)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Quản lý thành viên"
            >
              <UserPlus size={20} />
            </button>

            <button className="text-primary hover:opacity-70 transition-opacity">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Manage Members Modal */}
      <AnimatePresence>
        {isManageOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">Quản lý thành viên</h2>
                <button onClick={() => setIsManageOpen(false)} className="p-2 hover:bg-surface-container rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-surface-container-low/50 rounded-2xl p-6 space-y-5 border border-outline-variant/5">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Thêm thành viên mới</p>
                  <div className="flex items-center gap-5">
                    <label className="relative cursor-pointer group shrink-0">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 border-dashed border-outline-variant/30 group-hover:border-primary transition-colors",
                        newAvatarPreview ? "border-solid border-primary" : ""
                      )}>
                        {newAvatarPreview ? (
                          <img src={newAvatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-on-surface-variant">
                            <Camera size={20} />
                            <span className="text-[8px] font-bold uppercase">Ảnh</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                        <Camera size={12} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewAvatar(file);
                            setNewAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1 mb-1 block">Tên thành viên</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Nhập tên..."
                        className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={18} />
                    Thêm thành viên
                  </button>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-secondary mb-3">
                    Danh sách ({participants.length} thành viên)
                  </p>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setAvatarLightbox(p)}
                              />
                            ) : (
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", p.colorClass || p.color_class)}>
                                {p.initials}
                              </div>
                            )}
                            <button
                              onClick={() => { setEditingAvatarId(p.id); setTimeout(() => editAvatarRef.current?.click(), 0); }}
                              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                            >
                              <Pencil size={10} />
                            </button>
                          </div>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <button
                          onClick={() => removeParticipant(p.id)}
                          className="p-3 hover:bg-red-100 rounded-xl text-red-500 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <input
                      ref={editAvatarRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && editingAvatarId) handleEditAvatar(editingAvatarId, file);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low">
                <button
                  onClick={() => setIsManageOpen(false)}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  Xong
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar Lightbox */}
      <AnimatePresence>
        {avatarLightbox && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAvatarLightbox(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              <img
                src={avatarLightbox.avatar_url}
                alt={avatarLightbox.name}
                className="w-48 h-48 rounded-full object-cover shadow-2xl border-4 border-white/30"
              />
              <p className="text-white font-bold text-lg">{avatarLightbox.name}</p>
              <button
                onClick={() => setAvatarLightbox(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="pt-20 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-4 pt-2 bg-background/70 backdrop-blur-md shadow-[0_-8px_24px_rgba(28,28,17,0.04)] z-50 rounded-t-[1rem]">
        <NavLink
          to="/itinerary"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <Compass size={24} />
          <span className="text-[10px] font-semibold mt-1">Trip</span>
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <Wallet size={24} />
          <span className="text-[10px] font-semibold mt-1">Split</span>
        </NavLink>
        <NavLink
          to="/memories"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <ImageIcon size={24} />
          <span className="text-[10px] font-semibold mt-1">Gallery</span>
        </NavLink>
      </nav>
    </div>
  );
}
