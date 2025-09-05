import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  Filter,
  Search,
  Calendar,
  Bot,
  FileText,
  Zap,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useTasks, useAgents, useUserDownloads, useDataActions, useNotificationActions } from '../store/appStore';
import { useUser, useUserProfile } from '../store/authStore';
import TaskAssignmentModal from '../components/modals/TaskAssignmentModal';
import AnalyticsModal from '../components/modals/AnalyticsModal';
import UpgradeModal from '../components/modals/UpgradeModal';
import { taskService } from '../services/taskService';
import PaygateWrapper from '../components/PaygateWrapper';

export default function TaskCenter() {
  const user = useUser();
  const userProfile = useUserProfile();
  const tasks = useTasks();
  const agents = useAgents();
  const userDownloads = useUserDownloads();
  const { addNotification } = useNotificationActions();
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Filter tasks for current user
  const userTasks = tasks.filter(t => t.userId === user?.id);
  const filteredTasks = userTasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const pendingTasks = userTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const failedTasks = userTasks.filter(t => t.status === 'failed');
  const totalRevenue = userDownloads.filter(d => d.userId === user?.id).reduce((sum, d) => sum + d.cost, 0);
  const downloadCount = userDownloads.filter(d => d.userId === user?.id).length;
  const freeDownloadsRemaining = Math.max(0, 3 - downloadCount);

  const handleDownload = async (taskId: string) => {
    setDownloading(taskId);
    
    try {
      await taskService.downloadDeliverable(taskId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error.message || 'Failed to download file.'
      });
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-orange-400 bg-orange-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="w-8 h-8" />
            Task Assignment Center
          </h1>
          <p className="text-white/60">
            Assign tasks to your AI agents and download professional deliverables powered by Cognis Digital.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowAnalyticsModal(true)}
            className="bg-white/10 text-white px-4 py-3 rounded-2xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <PaygateWrapper action="task_assignment">
            <button 
              onClick={() => setShowTaskModal(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-2xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign New Task
            </button>
          </PaygateWrapper>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{userTasks.length}</p>
              <p className="text-white/60 text-sm">Total Tasks</p>
            </div>
          </div>
          <p className="text-blue-400 text-sm">{pendingTasks.length} in progress</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
              <p className="text-white/60 text-sm">Completed</p>
            </div>
          </div>
          <p className="text-green-400 text-sm">
            {userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0}% success rate
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{downloadCount}</p>
              <p className="text-white/60 text-sm">Downloads</p>
            </div>
          </div>
          {userProfile?.tier === 'free' && (
            <p className="text-orange-400 text-sm">{freeDownloadsRemaining} free remaining</p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-400 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              <p className="text-white/60 text-sm">Total Spent</p>
            </div>
          </div>
          <p className="text-green-400 text-sm">Revenue generated</p>
        </div>
      </div>

      {/* Free Tier Warning */}
      {userProfile?.tier === 'free' && freeDownloadsRemaining <= 1 && (
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="text-orange-400 font-bold text-lg">Download Limit Almost Reached</h3>
              <p className="text-white/70">You have {freeDownloadsRemaining} free download{freeDownloadsRemaining !== 1 ? 's' : ''} remaining.</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade for Unlimited Downloads
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            const canDownload = task.status === 'completed' && task.result?.downloadUrl;
            
            return (
              <div
                key={task.id}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{task.title}</h3>
                        <p className="text-white/60 text-sm">Assigned to {task.agentName}</p>
                      </div>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                        {task.deliverableFormat.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="flex lg:flex-col gap-6 lg:gap-3">
                    {task.result && (
                      <>
                        <div className="text-center">
                          <p className="text-white text-lg font-bold">{task.result.tokensUsed.toLocaleString()}</p>
                          <p className="text-white/60 text-xs">Tokens Used</p>
                        </div>
                        <div className="text-center">
                          <p className="text-green-400 text-lg font-bold">${task.result.cost.toFixed(2)}</p>
                          <p className="text-white/60 text-xs">Cost</p>
                        </div>
                      </>
                    )}
                    <div className="text-center">
                      <p className="text-white/60 text-xs">Created</p>
                      <p className="text-white text-sm">{new Date(task.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {canDownload ? (
                      <button
                        onClick={() => handleDownload(task.id)}
                        disabled={downloading === task.id}
                        className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                      >
                        {downloading === task.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download
                      </button>
                    ) : task.status === 'failed' ? (
                      <button
                        onClick={() => {
                          // Retry task
                          taskService.processTask(task.id);
                          addNotification({
                            type: 'info',
                            title: 'Task Retrying',
                            message: `${task.title} is being retried.`
                          });
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Retry
                      </button>
                    ) : (
                      <div className="bg-white/10 text-white/60 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
          <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Tasks Yet</h3>
          <p className="text-white/60 mb-6">
            Assign your first task to an AI agent and start generating professional deliverables.
          </p>
          <PaygateWrapper action="task_assignment">
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Assign First Task
            </button>
          </PaygateWrapper>
        </div>
      )}

      {/* Modals */}
      <TaskAssignmentModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />

      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="You have reached your free download limit. Upgrade to Pro for unlimited downloads and advanced features."
      />
    </div>
  );
}