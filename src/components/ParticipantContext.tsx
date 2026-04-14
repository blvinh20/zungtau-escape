import React, { useState, useEffect, createContext, useContext } from 'react';
import { Participant } from '../types';
import { getParticipants, addParticipant as addParticipantSupabase, deleteParticipant as deleteParticipantSupabase, updateParticipant as updateParticipantSupabase, uploadImage, getTreasurerId as getTreasurerIdDB, setTreasurerId as setTreasurerIdDB } from '../lib/supabase';
import { useToast } from './Toast';

interface ParticipantContextType {
  participants: Participant[];
  loading: boolean;
  treasurerId: string;
  setTreasurerId: (id: string) => void;
  addParticipant: (name: string, avatarFile?: File | null) => Promise<void>;
  removeParticipant: (id: string) => Promise<void>;
  updateAvatar: (id: string, file: File) => Promise<void>;
}

const ParticipantContext = createContext<ParticipantContextType>({
  participants: [],
  loading: true,
  treasurerId: '',
  setTreasurerId: () => {},
  addParticipant: async () => {},
  removeParticipant: async () => {},
  updateAvatar: async () => {},
});

export const useParticipants = () => useContext(ParticipantContext);

const sortByName = (list: Participant[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

export default function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [treasurerId, setTreasurerIdRaw] = useState('');
  const { showToast } = useToast();

  // Load treasurerId from database on mount
  useEffect(() => {
    const fetchTreasurer = async () => {
      try {
        const id = await getTreasurerIdDB();
        setTreasurerIdRaw(id);
      } catch (error) {
        console.error('Error fetching treasurer from DB:', error);
        // Fallback to localStorage
        try {
          const localId = localStorage.getItem('treasurerId') || '';
          setTreasurerIdRaw(localId);
        } catch {}
      }
    };
    fetchTreasurer();
  }, []);

  const setTreasurerId = async (id: string) => {
    setTreasurerIdRaw(id);
    // Save to database
    try {
      await setTreasurerIdDB(id);
    } catch (error) {
      console.error('Error saving treasurer to DB:', error);
    }
    // Also save to localStorage as fallback
    try { localStorage.setItem('treasurerId', id); } catch {}
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getParticipants();
        setParticipants(
          sortByName(data.map((p: any) => ({ ...p, colorClass: p.color_class })))
        );
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const addParticipant = async (name: string, avatarFile?: File | null) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-primary-fixed text-primary',
      'bg-secondary-fixed text-on-secondary-fixed',
      'bg-tertiary-fixed text-on-tertiary-fixed',
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      let avatarUrl = '';
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatars');
      }
      const newP = await addParticipantSupabase({
        name,
        initials,
        color_class: randomColor || 'bg-gray-100 text-gray-700',
        avatar_url: avatarUrl
      });
      setParticipants(prev =>
        sortByName([...prev, { ...newP, colorClass: newP.color_class }])
      );
      showToast(`Đã thêm ${name} thành công`, 'success');
    } catch (error) {
      console.error('Error adding participant:', error);
      showToast('Thêm thành viên thất bại', 'error');
    }
  };

  const removeParticipant = async (id: string) => {
    try {
      await deleteParticipantSupabase(id);
      setParticipants(prev => prev.filter(p => p.id !== id));
      if (treasurerId === id) {
        setTreasurerId('');
        try { localStorage.removeItem('treasurerId'); } catch {}
        try { await setTreasurerIdDB(''); } catch {}
      }
      showToast('Xóa thành viên thành công', 'success');
    } catch (error) {
      console.error('Error removing participant:', error);
      showToast('Xóa thành viên thất bại', 'error');
    }
  };

  const updateAvatar = async (id: string, file: File) => {
    try {
      const avatarUrl = await uploadImage(file, 'avatars');
      await updateParticipantSupabase(id, { avatar_url: avatarUrl });
      setParticipants(prev =>
        prev.map(p => p.id === id ? { ...p, avatar_url: avatarUrl } : p)
      );
      showToast('Cập nhật avatar thành công', 'success');
    } catch (error) {
      console.error('Error updating avatar:', error);
      showToast('Cập nhật avatar thất bại', 'error');
    }
  };

  return (
    <ParticipantContext.Provider value={{ participants, loading, treasurerId, setTreasurerId, addParticipant, removeParticipant, updateAvatar }}>
      {children}
    </ParticipantContext.Provider>
  );
}