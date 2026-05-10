import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  username: string;
  exam_region: string;
  grade: string;
  school: string;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
  last_login_at: string;
}

export interface UserStats {
  user_id: string;
  mistake_count: number;
  due_for_review: number;
  latest_power: number;
  power_records: number;
}

interface AuthStore {
  token: string | null;
  user: UserProfile | null;
  stats: UserStats | null;

  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setStats: (stats: UserStats | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      stats: null,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setStats: (stats) => set({ stats }),
      logout: () => set({ token: null, user: null, stats: null }),
    }),
    {
      name: 'readwise-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
