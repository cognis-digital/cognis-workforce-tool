import React, { useState, useEffect } from 'react';
import { 
  rbacLoggingService, 
  InteractionLog, 
  InteractionType 
} from '../../services/rbacLogging';
import { useAuthStore } from '../../store/authStore';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Filter, 
  DownloadCloud, 
  RefreshCw, 
  Activity,
  Eye,
  MousePointer,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useTracking } from '../../hooks/useActivityTracking';

// Define the props for this component
interface RBACMonitoringDashboardProps {
  title?: string;
  defaultRole?: string;
}

// Create the dashboard component
const RBACMonitoringDashboard: React.FC<RBACMonitoringDashboardProps> = ({
  title = 'User Activity Monitoring',
  defaultRole
}) => {
  // State for storing logs
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalInteractions: 0,
    uniqueUsers: 0,
    interactionsByType: {} as Record<string, number>,
    interactionsByRole: {} as Record<string, number>,
    interactionsByPage: {} as Record<string, number>,
    mostActiveUsers: [] as {userId: string, count: number}[]
  });
  
  // Role options from the current user profile
  const userProfile = useAuthStore(state => state.userProfile);
  const currentUserRole = userProfile?.role || 'user';
  
  // Track dashboard usage with our RBAC logging
  const { trackInteraction } = useTracking('RBACMonitoringDashboard', 'Admin');
  
  // Get available roles
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  
  // Load logs when the component mounts
  useEffect(() => {
    loadLogs();
    
    // Log dashboard view
    trackInteraction(
      InteractionType.PAGE_VIEW, 
      'view', 
      'RBACMonitoringDashboard',
      { initialRole: selectedRole }
    );
    
    // Refresh logs every 30 seconds
    const interval = setInterval(() => {
      loadLogs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [logs, selectedRole, selectedType, selectedTimeframe, searchQuery]);
  
  // Load logs from the service
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedLogs: InteractionLog[] = [];
      
      // If admin, load all logs
      if (currentUserRole === 'admin') {
        // Get logs for all roles (in a real app, this might need pagination)
        const allRoles = ['admin', 'manager', 'user', 'guest', 'anonymous'];
        
        // Extract unique roles from logs to populate filter options
        const roleLogs: InteractionLog[] = [];
        const roles = new Set<string>();
        
        for (const role of allRoles) {
          const roleLogs = await rbacLoggingService.getRoleLogs(role);
          fetchedLogs = [...fetchedLogs, ...roleLogs];
          
          // Extract roles
          roleLogs.forEach(log => {
            roles.add(log.user_role);
          });
        }
        
        setAvailableRoles(Array.from(roles));
      } 
      // Otherwise just load logs for the current user
      else {
        if (userProfile) {
          fetchedLogs = await rbacLoggingService.getUserLogs(userProfile.id);
          setAvailableRoles([userProfile.role]);
        }
      }
      
      setLogs(fetchedLogs);
      
      // Track log loading
      trackInteraction(
        InteractionType.API_RESPONSE, 
        'load', 
        'logs',
        { count: fetchedLogs.length }
      );
    } catch (error: any) {
      console.error('Failed to load logs:', error);
      setError(`Failed to load logs: ${error.message}`);
      
      // Track error
      trackInteraction(
        InteractionType.ERROR,
        'load_logs',
        'RBACMonitoringDashboard',
        { error: error.message }
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Apply all filters to the logs
  const applyFilters = () => {
    try {
      // Apply role filter
      let filtered = logs;
      if (selectedRole !== 'all') {
        filtered = filtered.filter(log => log.user_role === selectedRole);
      }
      
      // Apply type filter
      if (selectedType !== 'all') {
        filtered = filtered.filter(log => log.interaction_type === selectedType);
      }
      
      // Apply timeframe filter
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      switch (selectedTimeframe) {
        case 'today':
          filtered = filtered.filter(log => new Date(log.timestamp) >= dayStart);
          break;
        case 'week':
          filtered = filtered.filter(log => new Date(log.timestamp) >= weekStart);
          break;
        case 'month':
          filtered = filtered.filter(log => new Date(log.timestamp) >= monthStart);
          break;
      }
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(log => 
          log.component.toLowerCase().includes(query) ||
          log.page?.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.target?.toLowerCase().includes(query) ||
          log.user_id.toLowerCase().includes(query)
        );
      }
      
      // Update filtered logs
      setFilteredLogs(filtered);
      
      // Calculate statistics
      calculateStats(filtered);
      
      // Track filter application
      trackInteraction(
        InteractionType.TABLE_FILTER, 
        'filter', 
        'logs',
        { 
          role: selectedRole, 
          type: selectedType, 
          timeframe: selectedTimeframe,
          resultCount: filtered.length
        }
      );
    } catch (error: any) {
      console.error('Error applying filters:', error);
      setError(`Error applying filters: ${error.message}`);
    }
  };
  
  // Calculate statistics from the filtered logs
  const calculateStats = (filteredLogs: InteractionLog[]) => {
    try {
      // Total interactions
      const totalInteractions = filteredLogs.length;
      
      // Unique users
      const uniqueUsers = new Set(filteredLogs.map(log => log.user_id)).size;
      
      // Interactions by type
      const interactionsByType: Record<string, number> = {};
      filteredLogs.forEach(log => {
        const type = log.interaction_type;
        interactionsByType[type] = (interactionsByType[type] || 0) + 1;
      });
      
      // Interactions by role
      const interactionsByRole: Record<string, number> = {};
      filteredLogs.forEach(log => {
        const role = log.user_role;
        interactionsByRole[role] = (interactionsByRole[role] || 0) + 1;
      });
      
      // Interactions by page
      const interactionsByPage: Record<string, number> = {};
      filteredLogs.forEach(log => {
        const page = log.page || 'unknown';
        interactionsByPage[page] = (interactionsByPage[page] || 0) + 1;
      });
      
      // Most active users
      const userCounts: Record<string, number> = {};
      filteredLogs.forEach(log => {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });
      
      const mostActiveUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Update stats
      setStats({
        totalInteractions,
        uniqueUsers,
        interactionsByType,
        interactionsByRole,
        interactionsByPage,
        mostActiveUsers
      });
    } catch (error: any) {
      console.error('Error calculating statistics:', error);
      setError(`Error calculating statistics: ${error.message}`);
    }
  };
  
  // Export logs to CSV
  const exportToCSV = () => {
    try {
      // Create CSV header
      const header = 'timestamp,user_id,user_role,session_id,interaction_type,component,page,action,target\n';
      
      // Create CSV rows
      const rows = filteredLogs.map(log => {
        return `"${log.timestamp}","${log.user_id}","${log.user_role}","${log.session_id}","${log.interaction_type}","${log.component}","${log.page || ''}","${log.action}","${log.target || ''}"`;
      }).join('\n');
      
      // Combine header and rows
      const csv = header + rows;
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `user-activity-${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Track export
      trackInteraction(
        InteractionType.FILE_DOWNLOAD, 
        'export', 
        'csv',
        { count: filteredLogs.length }
      );
    } catch (error: any) {
      console.error('Error exporting logs:', error);
      setError(`Error exporting logs: ${error.message}`);
    }
  };
  
  // Get icon for interaction type
  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case InteractionType.PAGE_VIEW:
        return <Eye className="w-4 h-4" />;
      case InteractionType.BUTTON_CLICK:
        return <MousePointer className="w-4 h-4" />;
      case InteractionType.ERROR:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };
  
  // Render the dashboard
  return (
    <div className="bg-white/5 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-400" />
          {title}
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="p-2 hover:bg-white/10 rounded transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          
          <button
            onClick={exportToCSV}
            className="p-2 hover:bg-white/10 rounded transition-colors flex items-center gap-2"
            disabled={filteredLogs.length === 0}
          >
            <DownloadCloud className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Role filter */}
        <div>
          <label className="block text-sm mb-1 opacity-70">User Role</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm"
          >
            <option value="all">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        {/* Interaction type filter */}
        <div>
          <label className="block text-sm mb-1 opacity-70">Interaction Type</label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm"
          >
            <option value="all">All Types</option>
            {Object.values(InteractionType).map(type => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        
        {/* Timeframe filter */}
        <div>
          <label className="block text-sm mb-1 opacity-70">Timeframe</label>
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        {/* Search */}
        <div>
          <label className="block text-sm mb-1 opacity-70">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search components, pages, actions..."
              className="w-full bg-white/5 border border-white/10 rounded p-2 pl-8 text-sm"
            />
            <Search className="w-4 h-4 absolute left-2 top-2.5 opacity-50" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total interactions */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-lg font-bold">{stats.totalInteractions}</div>
          <div className="text-sm opacity-70">Total Interactions</div>
        </div>
        
        {/* Unique users */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-lg font-bold">{stats.uniqueUsers}</div>
          <div className="text-sm opacity-70">Unique Users</div>
        </div>
        
        {/* Most common interaction */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-lg font-bold capitalize">
            {Object.entries(stats.interactionsByType).length > 0 
              ? Object.entries(stats.interactionsByType)
                  .sort((a, b) => b[1] - a[1])[0][0]
                  .replace(/_/g, ' ')
              : 'None'
            }
          </div>
          <div className="text-sm opacity-70">Most Common Interaction</div>
        </div>
        
        {/* Most active page */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-lg font-bold">
            {Object.entries(stats.interactionsByPage).length > 0 
              ? Object.entries(stats.interactionsByPage)
                  .sort((a, b) => b[1] - a[1])[0][0]
              : 'None'
            }
          </div>
          <div className="text-sm opacity-70">Most Active Page</div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          <AlertTriangle className="w-4 h-4 inline-block mr-2" />
          {error}
        </div>
      )}
      
      {/* Activity table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin opacity-70" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 opacity-70">
            No activity logs found for the selected filters.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Component</th>
                <th className="px-4 py-2 text-left">Page</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 100).map((log, index) => (
                <tr 
                  key={log.id || index} 
                  className="hover:bg-white/5 border-b border-white/5"
                >
                  <td className="px-4 py-2 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.user_id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.user_role}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <div className="flex items-center gap-1">
                      {getInteractionTypeIcon(log.interaction_type)}
                      <span>{log.interaction_type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.component}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.page || '-'}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.action}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {log.target || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredLogs.length > 100 && (
          <div className="text-center py-2 text-xs opacity-70">
            Showing 100 of {filteredLogs.length} logs. Export to CSV to see all logs.
          </div>
        )}
      </div>
    </div>
  );
};

export default RBACMonitoringDashboard;
