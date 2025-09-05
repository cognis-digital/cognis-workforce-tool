import { database } from './database';

/**
 * Authentication service prepared for Clerk integration
 * Currently uses Supabase auth but structured for easy Clerk migration
 */

interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
  twoFactorEnabled?: boolean;
}

interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class AuthService {
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private authListeners: Array<(user: AuthUser | null) => void> = [];

  // Core auth methods
  async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      // Current Supabase implementation
      const { data, error } = await database.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.user) {
        this.setCurrentUser({
          id: data.user.id,
          email: data.user.email || '',
          displayName: data.user.user_metadata?.display_name
        });
      }

      return this.currentUser;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, metadata?: any): Promise<AuthUser | null> {
    try {
      const { data, error } = await database.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;
      if (data.user) {
        this.setCurrentUser({
          id: data.user.id,
          email: data.user.email || '',
          displayName: metadata?.display_name
        });
      }

      return this.currentUser;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await database.auth.signOut();
      this.setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Session management
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // User management
  private setCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    this.notifyAuthListeners(user);
  }

  // Event listeners
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.authListeners.push(callback);
    
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  private notifyAuthListeners(user: AuthUser | null) {
    this.authListeners.forEach(listener => listener(user));
  }

  // Future Clerk integration methods (prepared but not implemented)
  
  /**
   * Prepare for Clerk 2FA integration
   * These methods will be implemented when Clerk is integrated
   */
  async enableTwoFactor(): Promise<boolean> {
    // TODO: Implement with Clerk
    console.log('Two-factor authentication will be implemented with Clerk');
    return false;
  }

  async disableTwoFactor(): Promise<boolean> {
    // TODO: Implement with Clerk
    console.log('Two-factor authentication will be implemented with Clerk');
    return false;
  }

  async verifyTwoFactor(code: string): Promise<boolean> {
    // TODO: Implement with Clerk
    console.log('Two-factor verification will be implemented with Clerk');
    return false;
  }

  // Profile management (prepared for Clerk)
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser | null> {
    if (!this.currentUser) return null;

    try {
      // Update in database
      const { data, error } = await database
        .from('user_profiles')
        .update({
          display_name: updates.displayName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Update current user
      this.setCurrentUser({
        ...this.currentUser,
        ...updates
      });

      return this.currentUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Initialize service
  async initialize(): Promise<void> {
    try {
      const { data: { session } } = await database.auth.getSession();
      
      if (session?.user) {
        this.setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name
        });
      }

      // Listen for auth state changes
      database.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          this.setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name
          });
        } else {
          this.setCurrentUser(null);
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }
}

export const authService = new AuthService();