import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';

/**
 * Permission definition with resource-action mapping
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: Array<'create' | 'read' | 'update' | 'delete' | 'manage'>;
}

/**
 * Role definition with permissions
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];  // Permission IDs
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

/**
 * Feature access definition for feature flags
 */
export interface FeatureAccess {
  id: string;
  name: string;
  enabled: boolean;
  requiredPlan?: 'free' | 'pro' | 'enterprise';
  requiredRoles?: string[];  // Role IDs
}

/**
 * Full RBAC state with temporal tracking
 */
export interface RBACState {
  roles: Record<string, Role>;
  permissions: Record<string, Permission>;
  userRoles: Record<string, string[]>;  // userId -> roleIds
  features: Record<string, FeatureAccess>; // Feature flags
  changeHistory: Array<{
    timestamp: number;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'assign' | 'revoke';
    target: 'role' | 'permission' | 'userRole' | 'feature';
    targetId: string;
    previousState?: any;
  }>;
}

// Define initial RBAC state based on the application screenshots
const initialRBACState: RBACState = {
  roles: {
    'admin': {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['manage_users', 'manage_roles', 'manage_system', 'view_analytics'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    'user': {
      id: 'user',
      name: 'Standard User',
      description: 'Basic system access',
      permissions: ['view_dashboard', 'manage_own_profile'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    'demo': {
      id: 'demo',
      name: 'Demo User',
      description: 'Limited access for demonstration',
      permissions: ['view_dashboard', 'view_analytics'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    'pro': {
      id: 'pro',
      name: 'Pro User',
      description: 'Access to pro features',
      permissions: ['view_dashboard', 'view_analytics', 'use_pro_features'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  },
  permissions: {
    'manage_users': {
      id: 'manage_users',
      name: 'Manage Users',
      description: 'Create, update, and delete user accounts',
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete']
    },
    'manage_roles': {
      id: 'manage_roles',
      name: 'Manage Roles',
      description: 'Create, update, and delete roles',
      resource: 'roles',
      actions: ['create', 'read', 'update', 'delete']
    },
    'manage_system': {
      id: 'manage_system',
      name: 'Manage System',
      description: 'Configure system settings',
      resource: 'system',
      actions: ['read', 'update']
    },
    'view_analytics': {
      id: 'view_analytics',
      name: 'View Analytics',
      description: 'Access analytics and reports',
      resource: 'analytics',
      actions: ['read']
    },
    'view_dashboard': {
      id: 'view_dashboard',
      name: 'View Dashboard',
      description: 'Access the main dashboard',
      resource: 'dashboard',
      actions: ['read']
    },
    'manage_own_profile': {
      id: 'manage_own_profile',
      name: 'Manage Own Profile',
      description: 'Update own user profile',
      resource: 'profile',
      actions: ['read', 'update']
    },
    'use_pro_features': {
      id: 'use_pro_features',
      name: 'Use Pro Features',
      description: 'Access to premium features',
      resource: 'pro_features',
      actions: ['read', 'use']
    }
  },
  userRoles: {
    'demo@cognisdigital.com': ['demo', 'pro']
  },
  features: {
    'ai_chat': {
      id: 'ai_chat',
      name: 'AI Chat',
      enabled: true,
      requiredPlan: 'free'
    },
    'lead_generation': {
      id: 'lead_generation',
      name: 'Lead Generation',
      enabled: true,
      requiredPlan: 'pro'
    },
    'multi_agent': {
      id: 'multi_agent',
      name: 'Multi-Agent Orchestration',
      enabled: true,
      requiredPlan: 'pro'
    },
    'blockchain_logging': {
      id: 'blockchain_logging',
      name: 'Blockchain Logging',
      enabled: true,
      requiredRoles: ['pro']
    },
    'knowledge_verification': {
      id: 'knowledge_verification',
      name: 'Knowledge Base Verification',
      enabled: true,
      requiredPlan: 'pro'
    },
    'think_longer': {
      id: 'think_longer',
      name: 'Think Longer',
      enabled: true,
      requiredPlan: 'pro'
    }
  },
  changeHistory: []
};

// Create time-series store for RBAC
export const rbacStore = createTimeSeriesStore(initialRBACState, {
  maxHistory: 200, // Keep more history for audit purposes
  autoSnapshot: true
});

// Register with evolution manager
evolutionManager.registerStateEvolution('rbacSystem', initialRBACState);

/**
 * Recursive function to check permissions
 * Uses recursive pattern to traverse permission hierarchies
 * 
 * @param userId User identifier
 * @param permissionId Permission to check
 * @param depth Current recursion depth
 * @param maxDepth Maximum recursion depth
 * @returns Whether the user has the permission
 */
export const hasPermission = (
  userId: string, 
  permissionId: string,
  depth: number = 0,
  maxDepth: number = 5
): boolean => {
  // Prevent infinite recursion
  if (depth >= maxDepth) return false;
  
  const { current } = rbacStore.getState();
  
  // Get user roles
  const userRoleIds = current.userRoles[userId] || [];
  
  // Direct permission check
  if (userRoleIds.some(roleId => {
    const role = current.roles[roleId];
    return role && role.permissions.includes(permissionId);
  })) {
    return true;
  }
  
  // Look for implied permissions recursively
  const permission = current.permissions[permissionId];
  if (!permission) return false;
  
  // Check if the user has manage permission on the resource
  const managePermissionId = Object.keys(current.permissions).find(id => {
    const p = current.permissions[id];
    return p.resource === permission.resource && p.actions.includes('manage');
  });
  
  if (managePermissionId) {
    return hasPermission(userId, managePermissionId, depth + 1, maxDepth);
  }
  
  return false;
};

/**
 * Check if user has access to a feature
 * @param userId User identifier
 * @param featureId Feature to check
 * @param userPlan User's subscription plan
 */
export const hasFeatureAccess = (
  userId: string, 
  featureId: string,
  userPlan: 'free' | 'pro' | 'enterprise' = 'free'
): boolean => {
  const { current } = rbacStore.getState();
  
  // Check if feature exists and is enabled
  const feature = current.features[featureId];
  if (!feature || !feature.enabled) return false;
  
  // Check plan requirements
  if (feature.requiredPlan) {
    const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
    if (planHierarchy[userPlan] < planHierarchy[feature.requiredPlan]) {
      return false;
    }
  }
  
  // Check role requirements
  if (feature.requiredRoles && feature.requiredRoles.length > 0) {
    const userRoleIds = current.userRoles[userId] || [];
    if (!feature.requiredRoles.some(role => userRoleIds.includes(role))) {
      return false;
    }
  }
  
  return true;
};

/**
 * Add a new role with time-series tracking
 * @param adminId Admin creating the role
 * @param role Role definition
 */
export const addRole = (adminId: string, role: Omit<Role, 'createdAt' | 'updatedAt' | 'createdBy'>) => {
  const { current } = rbacStore.getState();
  
  const timestamp = Date.now();
  const newRole: Role = {
    ...role,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: adminId
  };
  
  rbacStore.getState().update({
    roles: {
      ...current.roles,
      [role.id]: newRole
    },
    changeHistory: [
      ...current.changeHistory,
      {
        timestamp,
        userId: adminId,
        action: 'create',
        target: 'role',
        targetId: role.id
      }
    ]
  }, 'user');
  
  // Record for state analysis
  stateAnalysisEngine.recordTransition(
    { roles: current.roles },
    { roles: { ...current.roles, [role.id]: newRole } },
    'add_role'
  );
  
  // Create snapshot after role addition
  rbacStore.getState().createSnapshot(`role-added-${role.id}`);
  
  return newRole;
};

/**
 * Update an existing role
 * @param adminId Admin updating the role
 * @param roleId Role ID to update
 * @param updates Role changes
 */
export const updateRole = (
  adminId: string, 
  roleId: string, 
  updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
) => {
  const { current } = rbacStore.getState();
  
  if (!current.roles[roleId]) {
    throw new Error(`Role ${roleId} does not exist`);
  }
  
  const timestamp = Date.now();
  const updatedRole = {
    ...current.roles[roleId],
    ...updates,
    updatedAt: timestamp
  };
  
  rbacStore.getState().update({
    roles: {
      ...current.roles,
      [roleId]: updatedRole
    },
    changeHistory: [
      ...current.changeHistory,
      {
        timestamp,
        userId: adminId,
        action: 'update',
        target: 'role',
        targetId: roleId,
        previousState: current.roles[roleId]
      }
    ]
  }, 'user');
  
  // Create snapshot after significant role update
  if (updates.permissions) {
    rbacStore.getState().createSnapshot(`role-updated-${roleId}-${timestamp}`);
  }
  
  return updatedRole;
};

/**
 * Assign role to user
 * @param adminId Admin assigning the role
 * @param userId User receiving the role
 * @param roleId Role being assigned
 */
export const assignRoleToUser = (adminId: string, userId: string, roleId: string) => {
  const { current } = rbacStore.getState();
  
  if (!current.roles[roleId]) {
    throw new Error(`Role ${roleId} does not exist`);
  }
  
  const timestamp = Date.now();
  const currentUserRoles = current.userRoles[userId] || [];
  
  if (currentUserRoles.includes(roleId)) {
    return; // User already has this role
  }
  
  rbacStore.getState().update({
    userRoles: {
      ...current.userRoles,
      [userId]: [...currentUserRoles, roleId]
    },
    changeHistory: [
      ...current.changeHistory,
      {
        timestamp,
        userId: adminId,
        action: 'assign',
        target: 'userRole',
        targetId: userId,
        previousState: { roles: currentUserRoles }
      }
    ]
  });
  
  // Record significant access change
  stateAnalysisEngine.recordTransition(
    { userRoles: current.userRoles[userId] || [] },
    { userRoles: [...currentUserRoles, roleId] },
    'assign_role'
  );
};

/**
 * Remove role from user
 * @param adminId Admin removing the role
 * @param userId Affected user
 * @param roleId Role to remove
 */
export const removeRoleFromUser = (adminId: string, userId: string, roleId: string) => {
  const { current } = rbacStore.getState();
  
  const timestamp = Date.now();
  const currentUserRoles = current.userRoles[userId] || [];
  
  if (!currentUserRoles.includes(roleId)) {
    return; // User doesn't have this role
  }
  
  const updatedRoles = currentUserRoles.filter(id => id !== roleId);
  
  rbacStore.getState().update({
    userRoles: {
      ...current.userRoles,
      [userId]: updatedRoles
    },
    changeHistory: [
      ...current.changeHistory,
      {
        timestamp,
        userId: adminId,
        action: 'revoke',
        target: 'userRole',
        targetId: userId,
        previousState: { roles: currentUserRoles }
      }
    ]
  });
  
  // Create snapshot for audit purposes
  rbacStore.getState().createSnapshot(`role-removed-${userId}-${roleId}-${timestamp}`);
};

/**
 * Update feature access configuration
 * @param adminId Admin making the change
 * @param featureId Feature to update
 * @param updates Feature changes
 */
export const updateFeatureAccess = (
  adminId: string, 
  featureId: string, 
  updates: Partial<Omit<FeatureAccess, 'id' | 'name'>>
) => {
  const { current } = rbacStore.getState();
  
  if (!current.features[featureId]) {
    throw new Error(`Feature ${featureId} does not exist`);
  }
  
  const timestamp = Date.now();
  const updatedFeature = {
    ...current.features[featureId],
    ...updates
  };
  
  rbacStore.getState().update({
    features: {
      ...current.features,
      [featureId]: updatedFeature
    },
    changeHistory: [
      ...current.changeHistory,
      {
        timestamp,
        userId: adminId,
        action: 'update',
        target: 'feature',
        targetId: featureId,
        previousState: current.features[featureId]
      }
    ]
  }, 'user');
  
  // Record for analysis
  stateAnalysisEngine.recordTransition(
    { features: { [featureId]: current.features[featureId] } },
    { features: { [featureId]: updatedFeature } },
    'update_feature'
  );
};

/**
 * Get audit trail for a specific user or role
 * @param targetId User or role ID
 * @param targetType Type of target
 */
export const getAuditTrail = (
  targetId: string, 
  targetType: 'user' | 'role' | 'feature'
) => {
  const { changeHistory } = rbacStore.getState().current;
  
  return changeHistory
    .filter(entry => {
      if (targetType === 'user') {
        return (
          (entry.target === 'userRole' && entry.targetId === targetId) || 
          (entry.userId === targetId)
        );
      }
      
      return entry.target === targetType && entry.targetId === targetId;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
};
