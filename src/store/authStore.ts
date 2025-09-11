import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { database } from '../services/database';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  tier: 'free' | 'pro' | 'enterprise' | 'basic';
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  org_id: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, orgName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  createUserProfile: (userId: string, orgName?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      userProfile: null,
      loading: true,
      error: null,

      // Actions
      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });
        
        try {
          // Simulate auth delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (email === 'demo@cognis.digital' && password === 'demo123') {
            const user = {
              id: 'demo-user-id',
              email: 'demo@cognis.digital',
              created_at: new Date().toISOString()
            } as User;
            
            const session = { 
              user, 
              access_token: 'mock-token', 
              expires_at: Date.now() + 3600000 
            } as Session;
            
            set({ user, session });
            
            // Set profile directly for demo user
            const demoProfile: UserProfile = {
              id: 'demo-profile-id',
              user_id: 'demo-user-id',
              display_name: 'Demo User',
              role: 'admin',
              tier: 'pro',
              trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              org_id: 'demo-org-id'
            };
            
            set({ userProfile: demoProfile, loading: false });
            return { data: { user, session }, error: null };
          } else if (email && password) {
            const user = {
              id: `user-${Date.now()}`,
              email,
              created_at: new Date().toISOString()
            } as User;
            
            const session = { 
              user, 
              access_token: 'mock-token', 
              expires_at: Date.now() + 3600000 
            } as Session;
            
            set({ user, session, loading: false });
            await get().fetchUserProfile(user.id);
            return { data: { user, session }, error: null };
          }
          
          throw new Error('Invalid email or password');
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, orgName?: string) => {
        set({ loading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const user = {
            id: `user-${Date.now()}`,
            email,
            created_at: new Date().toISOString()
          } as User;
          
          const session = { 
            user, 
            access_token: 'mock-token', 
            expires_at: Date.now() + 3600000 
          } as Session;
          
          set({ user, session });
          await get().createUserProfile(user.id, orgName);
          set({ loading: false });
          
          return { data: { user, session }, error: null };
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ loading: true });
        
        try {
          await database.auth.signOut();
          set({ 
            user: null, 
            session: null, 
            userProfile: null, 
            loading: false,
            error: null 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          const { data, error } = await database
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create one
            await get().createUserProfile(userId);
          } else if (data) {
            set({ userProfile: data });
          }
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          set({ error: error.message });
        }
      },

      createUserProfile: async (userId: string, orgName?: string) => {
        try {
          // Create organization first
          const { data: org, error: orgError } = await database
            .from('organizations')
            .insert([{ name: orgName || 'My Organization' }])
            .select()
            .single();

          if (orgError) throw orgError;

          // Create user profile
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial

          const { data: profile, error: profileError } = await database
            .from('user_profiles')
            .insert([{
              user_id: userId,
              org_id: org.id,
              display_name: get().user?.email?.split('@')[0] || 'User',
              role: 'admin',
              tier: 'free',
              trial_ends_at: null, // Start with free tier, no trial
              subscription_ends_at: null // Free tier doesn't have an expiration
            }])
            .select()
            .single();

          if (profileError) throw profileError;
          set({ userProfile: profile });
        } catch (error: any) {
          console.error('Error creating user profile:', error);
          set({ error: error.message });
        }
      },

      updateUserProfile: async (updates: Partial<UserProfile>) => {
        const { userProfile } = get();
        if (!userProfile) return;

        try {
          const { data, error } = await database
            .from('user_profiles')
            .update(updates)
            .eq('id', userProfile.id)
            .select()
            .single();

          if (error) throw error;
          set({ userProfile: data });
        } catch (error: any) {
          console.error('Error updating user profile:', error);
          set({ error: error.message });
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      initialize: async () => {
        set({ loading: true });
        
        try {
          // Get initial session
          const { data: { session } } = await database.auth.getSession();
          
          if (session?.user) {
            set({ user: session.user, session });
            await get().fetchUserProfile(session.user.id);
          }
          
          // Listen for auth changes
          database.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              set({ user: session.user, session });
              await get().fetchUserProfile(session.user.id);
            } else {
              set({ user: null, session: null, userProfile: null });
            }
          });
          
        } catch (error: any) {
          console.error('Error initializing auth:', error);
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        userProfile: state.userProfile
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle state migrations for future versions
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            error: null,
            loading: false
          };
        }
        return persistedState;
      }
    }
  )
);

// Selectors for optimized component subscriptions
export const useUser = () => useAuthStore(state => state.user);
export const useUserProfile = () => useAuthStore(state => state.userProfile);
export const useAuthLoading = () => useAuthStore(state => state.loading);
export const useAuthError = () => useAuthStore(state => state.error);
export const useIsAuthenticated = () => useAuthStore(state => !!state.user);

// Actions for components to use
export const useAuthActions = () => useAuthStore(state => ({
  signIn: state.signIn,
  signUp: state.signUp,
  signOut: state.signOut,
  updateUserProfile: state.updateUserProfile,
  setError: state.setError,
  clearError: state.clearError
}));