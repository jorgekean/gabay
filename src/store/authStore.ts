import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'Teacher' | 'Guidance' | 'Admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  advisoryClass?: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Default to a Guidance counselor for MVP testing if null
      user: {
        id: 'u-1',
        name: 'MVP Guidance',
        role: 'Guidance'
      },
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'gabay-auth-storage',
    }
  )
);
