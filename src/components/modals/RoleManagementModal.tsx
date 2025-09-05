import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Settings } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useNotificationActions } from '../../store/appStore';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  agentCount: number;
  isDefault: boolean;
  color: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const availablePermissions: Permission[] = [
  { id: 'agent.create', name: 'Create Agents', description: 'Create new AI agents', category: 'Agent Management' },
  { id: 'agent.edit', name: 'Edit Agents', description: 'Modify existing agents', category: 'Agent Management' },
  { id: 'agent.delete', name: 'Delete Agents', description: 'Remove agents from workspace', category: 'Agent Management' },
  { id: 'knowledge.create', name: 'Create Knowledge Bases', description: 'Create new knowledge bases', category: 'Knowledge Management' },
  { id: 'knowledge.edit', name: 'Edit Knowledge Bases', description: 'Modify knowledge bases', category: 'Knowledge Management' },
  { id: 'knowledge.delete', name: 'Delete Knowledge Bases', description: 'Remove knowledge bases', category: 'Knowledge Management' },
  { id: 'leads.view', name: 'View Leads', description: 'Access lead information', category: 'Lead Management' },
  { id: 'leads.create', name: 'Create Leads', description: 'Generate new leads', category: 'Lead Management' },
  { id: 'leads.edit', name: 'Edit Leads', description: 'Modify lead information', category: 'Lead Management' },
  { id: 'billing.view', name: 'View Billing', description: 'Access billing information', category: 'Administration' },
  { id: 'billing.manage', name: 'Manage Billing', description: 'Modify subscription and billing', category: 'Administration' },
  { id: 'users.invite', name: 'Invite Users', description: 'Invite new team members', category: 'User Management' },
  { id: 'users.manage', name: 'Manage Users', description: 'Edit user roles and permissions', category: 'User Management' }
];

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: availablePermissions.map(p => p.id),
    agentCount: 0,
    isDefault: true,
    color: 'from-red-500 to-pink-400'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage agents, knowledge bases, and leads',
    permissions: ['agent.create', 'agent.edit', 'knowledge.create', 'knowledge.edit', 'leads.view', 'leads.create', 'leads.edit'],
    agentCount: 3,
    isDefault: true,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Use existing agents and view data',
    permissions: ['leads.view', 'knowledge.edit'],
    agentCount: 1,
    isDefault: true,
    color: 'from-green-500 to-emerald-400'
  }
];

export default function RoleManagementModal({ isOpen, onClose }: RoleManagementModalProps) {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: 'from-purple-500 to-pink-400'
  });
  
  const { addNotification } = useNotificationActions();

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Role name is required.'
      });
      return;
    }

    const role: Role = {
      id: `role-${Date.now()}`,
      name: newRole.name,
      description: newRole.description,
      permissions: newRole.permissions,
      agentCount: 0,
      isDefault: false,
      color: newRole.color
    };

    setRoles(prev => [...prev, role]);
    setNewRole({ name: '', description: '', permissions: [], color: 'from-purple-500 to-pink-400' });
    setShowCreateForm(false);
    
    addNotification({
      type: 'success',
      title: 'Role Created',
      message: `${role.name} role has been created successfully.`
    });
  };

  const handleDeleteRole = () => {
    if (!deletingRole) return;

    setRoles(prev => prev.filter(role => role.id !== deletingRole.id));
    addNotification({
      type: 'success',
      title: 'Role Deleted',
      message: `${deletingRole.name} role has been deleted.`
    });
    setDeletingRole(null);
  };

  const togglePermission = (permissionId: string, rolePermissions: string[], setPermissions: (permissions: string[]) => void) => {
    if (rolePermissions.includes(permissionId)) {
      setPermissions(rolePermissions.filter(p => p !== permissionId));
    } else {
      setPermissions([...rolePermissions, permissionId]);
    }
  };

  const permissionsByCategory = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Role Management"
        size="xl"
      >
        <div className="p-6">
          {!showCreateForm && !editingRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-white/60">
                  Manage user roles and permissions for your organization.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Role
                </button>
              </div>

              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white/5 border border-white/20 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center`}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">{role.name}</h3>
                            {role.isDefault && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-white/60">{role.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                            <span>{role.permissions.length} permissions</span>
                            <span>{role.agentCount} agents assigned</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-white/60" />
                        </button>
                        {!role.isDefault && (
                          <button
                            onClick={() => setDeletingRole(role)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Create/Edit Role Form */
            <div className="space-y-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingRole(null);
                  setNewRole({ name: '', description: '', permissions: [], color: 'from-purple-500 to-pink-400' });
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to Roles
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Role Name *</label>
                  <input
                    type="text"
                    value={editingRole ? editingRole.name : newRole.name}
                    onChange={(e) => {
                      if (editingRole) {
                        setEditingRole({ ...editingRole, name: e.target.value });
                      } else {
                        setNewRole(prev => ({ ...prev, name: e.target.value }));
                      }
                    }}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter role name..."
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-2">Color Theme</label>
                  <select
                    value={editingRole ? editingRole.color : newRole.color}
                    onChange={(e) => {
                      if (editingRole) {
                        setEditingRole({ ...editingRole, color: e.target.value });
                      } else {
                        setNewRole(prev => ({ ...prev, color: e.target.value }));
                      }
                    }}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="from-purple-500 to-pink-400">Purple to Pink</option>
                    <option value="from-blue-500 to-cyan-400">Blue to Cyan</option>
                    <option value="from-green-500 to-emerald-400">Green to Emerald</option>
                    <option value="from-orange-500 to-red-400">Orange to Red</option>
                    <option value="from-indigo-500 to-purple-400">Indigo to Purple</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Description</label>
                <textarea
                  value={editingRole ? editingRole.description : newRole.description}
                  onChange={(e) => {
                    if (editingRole) {
                      setEditingRole({ ...editingRole, description: e.target.value });
                    } else {
                      setNewRole(prev => ({ ...prev, description: e.target.value }));
                    }
                  }}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Describe this role..."
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-4">Permissions</label>
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="text-white font-medium mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(editingRole ? editingRole.permissions : newRole.permissions).includes(permission.id)}
                              onChange={() => {
                                const currentPermissions = editingRole ? editingRole.permissions : newRole.permissions;
                                const setPermissions = editingRole 
                                  ? (permissions: string[]) => setEditingRole({ ...editingRole, permissions })
                                  : (permissions: string[]) => setNewRole(prev => ({ ...prev, permissions }));
                                
                                togglePermission(permission.id, currentPermissions, setPermissions);
                              }}
                              className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                            />
                            <div>
                              <p className="text-white text-sm font-medium">{permission.name}</p>
                              <p className="text-white/60 text-xs">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRole(null);
                    setNewRole({ name: '', description: '', permissions: [], color: 'from-purple-500 to-pink-400' });
                  }}
                  className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRole ? () => {
                    setRoles(prev => prev.map(role => role.id === editingRole.id ? editingRole : role));
                    addNotification({
                      type: 'success',
                      title: 'Role Updated',
                      message: `${editingRole.name} role has been updated.`
                    });
                    setEditingRole(null);
                  } : handleCreateRole}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the "${deletingRole?.name}" role? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Role"
      />
    </>
  );
}