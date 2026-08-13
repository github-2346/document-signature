import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  users: { email: string; password: string; user: User }[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

// BCrypt-like hash simulation (in real app, this would be done server-side)
const hashPassword = (password: string): string => {
  return btoa(password + '_hashed_salt_secure');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// Default user as specified
const defaultUsers = [
  {
    email: 'sampleuser@example.com',
    password: hashPassword('sign123'),
    user: {
      id: 'usr_default_001',
      name: 'sampleuser',
      email: 'sampleuser@example.com',
      role: 'USER' as const,
      createdAt: new Date().toISOString(),
    },
  },
  {
    email: 'admin@docusignpro.com',
    password: hashPassword('admin123'),
    user: {
      id: 'usr_admin_001',
      name: 'Admin User',
      email: 'admin@docusignpro.com',
      role: 'ADMIN' as const,
      createdAt: new Date().toISOString(),
    },
  },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      users: defaultUsers,

      login: async (email: string, password: string) => {
        const { users } = get();
        const userRecord = users.find((u) => u.email === email);

        if (!userRecord) {
          return { success: false, message: 'User not found' };
        }

        if (!verifyPassword(password, userRecord.password)) {
          return { success: false, message: 'Invalid password' };
        }

        // Generate JWT-like token
        const token = `jwt_${uuidv4()}_${Date.now()}`;

        set({
          user: userRecord.user,
          token,
          isAuthenticated: true,
        });

        return { success: true, message: 'Login successful' };
      },

      register: async (name: string, email: string, password: string) => {
        const { users } = get();

        if (users.find((u) => u.email === email)) {
          return { success: false, message: 'Email already registered' };
        }

        const newUser: User = {
          id: `usr_${uuidv4()}`,
          name,
          email,
          role: 'USER',
          createdAt: new Date().toISOString(),
        };

        const newUserRecord = {
          email,
          password: hashPassword(password),
          user: newUser,
        };

        const token = `jwt_${uuidv4()}_${Date.now()}`;

        set({
          users: [...users, newUserRecord],
          user: newUser,
          token,
          isAuthenticated: true,
        });

        return { success: true, message: 'Registration successful' };
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'docusign-auth-storage',
    }
  )
);
