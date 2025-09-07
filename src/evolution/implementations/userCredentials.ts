import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';

/**
 * UserCredentialState
 * Enhanced user profile with time-series tracking
 */
export interface UserCredentialState {
  profile: {
    displayName: string;
    email: string;
    role: string;
    organization: string;
    avatar: string;
    lastModified: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  security: {
    mfaEnabled: boolean;
    lastPasswordChange: number;
    sessionTimeout: number;
  };
  accessHistory: Array<{
    timestamp: number;
    action: string;
    ip: string;
    device: string;
    location?: string;
  }>;
  previousVersions: Array<{
    timestamp: number;
    displayName: string;
    organization: string;
    changedBy: string;
  }>;
}

// Initialize with default values from the Settings page
const initialUserState: UserCredentialState = {
  profile: {
    displayName: 'Demo User',
    email: 'demo@cognisdigital.com',
    role: 'admin',
    organization: 'My Organization',
    avatar: '',
    lastModified: Date.now(),
  },
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
  security: {
    mfaEnabled: false,
    lastPasswordChange: Date.now(),
    sessionTimeout: 30,
  },
  accessHistory: [],
  previousVersions: []
};

// Create time-series store for user credentials
export const userCredentialsStore = createTimeSeriesStore(initialUserState, {
  maxHistory: 50,  // Keep last 50 state changes
  autoSnapshot: true,  // Automatically create snapshots
  persistKey: 'cognis-user-credentials' // Optional local storage persistence
});

// Register with evolution manager
evolutionManager.registerStateEvolution('userCredentials', initialUserState);

/**
 * Record user access/action history
 * @param action Action performed
 * @param ip Client IP address
 * @param device Device information
 * @param location Optional location info
 */
export const recordUserAction = (
  action: string, 
  ip: string = '127.0.0.1', 
  device: string = 'Unknown Device',
  location?: string
) => {
  const { current } = userCredentialsStore.getState();
  
  // Update access history
  userCredentialsStore.getState().update({
    accessHistory: [
      {
        timestamp: Date.now(),
        action,
        ip,
        device,
        location
      },
      ...current.accessHistory // Keep newest first
    ].slice(0, 100) // Limit history length
  });
};

/**
 * Update user profile with version tracking
 * @param updates Profile fields to update
 * @param updatedBy Who made the change
 */
export const updateUserProfile = (
  updates: Partial<UserCredentialState['profile']>, 
  updatedBy: string = 'user'
) => {
  const { current } = userCredentialsStore.getState();
  const now = Date.now();
  
  // Record previous version if display name or organization changes
  const previousVersions = [...current.previousVersions];
  if (updates.displayName || updates.organization) {
    previousVersions.unshift({
      timestamp: now,
      displayName: current.profile.displayName,
      organization: current.profile.organization,
      changedBy: updatedBy
    });
  }
  
  // Update profile with new values
  userCredentialsStore.getState().update({
    profile: {
      ...current.profile,
      ...updates,
      lastModified: now
    },
    previousVersions
  }, updatedBy === 'user' ? 'user' : 'system');
  
  // Create named snapshot after profile update
  userCredentialsStore.getState().createSnapshot(`profile-update-${now}`);
  
  // Record transition for analysis
  stateAnalysisEngine.recordTransition(
    { profile: current.profile },
    { profile: { ...current.profile, ...updates } },
    'update_profile'
  );
  
  // Record this action in user history
  recordUserAction('profile_update', '127.0.0.1', navigator.userAgent);
};

/**
 * Update user preferences
 * @param preferences New preference values
 */
export const updateUserPreferences = (preferences: Partial<UserCredentialState['preferences']>) => {
  const { current } = userCredentialsStore.getState();
  
  userCredentialsStore.getState().update({
    preferences: {
      ...current.preferences,
      ...preferences
    }
  }, 'user');
  
  // Record transition for analysis
  stateAnalysisEngine.recordTransition(
    { preferences: current.preferences },
    { preferences: { ...current.preferences, ...preferences } },
    'update_preferences'
  );
};

/**
 * Update security settings
 * @param security New security values
 */
export const updateUserSecurity = (security: Partial<UserCredentialState['security']>) => {
  const { current } = userCredentialsStore.getState();
  const now = Date.now();
  
  // Set last password change time if changing password
  const securityUpdates = { ...security };
  if ('password' in securityUpdates) {
    securityUpdates.lastPasswordChange = now;
    delete securityUpdates.password; // Don't store actual password in state
  }
  
  userCredentialsStore.getState().update({
    security: {
      ...current.security,
      ...securityUpdates
    }
  }, 'user');
  
  // Create security snapshot
  userCredentialsStore.getState().createSnapshot(`security-update-${now}`);
  
  // Record action in user history
  recordUserAction('security_update', '127.0.0.1', navigator.userAgent);
};

/**
 * Revert to previous profile state
 * @param timestamp Timestamp to revert to
 */
export const revertProfileChanges = (timestamp: number) => {
  userCredentialsStore.getState().revertTo(timestamp);
  recordUserAction('profile_revert', '127.0.0.1', navigator.userAgent);
};

/**
 * Get user profile version history
 * @returns Array of profile versions
 */
export const getProfileHistory = () => {
  const { current, history } = userCredentialsStore.getState();
  
  return history
    .filter(item => 
      // Only include history items where profile was changed
      'profile' in item.state && 
      item.timestamp !== current.profile.lastModified // Skip current state
    )
    .map(item => ({
      timestamp: item.timestamp,
      profile: (item.state as any).profile,
      origin: item.origin
    }))
    .slice(0, 10); // Limit to 10 most recent changes
};

/**
 * Get user credentials export
 * @param includeHistory Whether to include history data
 * @returns User data object for export
 */
export const exportUserCredentials = (includeHistory: boolean = false) => {
  const { current } = userCredentialsStore.getState();
  
  const exportData = {
    profile: current.profile,
    preferences: current.preferences,
    security: {
      mfaEnabled: current.security.mfaEnabled,
      sessionTimeout: current.security.sessionTimeout
    }
  };
  
  if (includeHistory) {
    return {
      ...exportData,
      accessHistory: current.accessHistory,
      previousVersions: current.previousVersions
    };
  }
  
  return exportData;
};
