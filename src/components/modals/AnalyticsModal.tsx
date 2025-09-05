import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, Download, Calendar, Filter, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { useTasks, useTokenUsage, useUserDownloads, useAgents } from '../../store/appStore';
import { useUser } from '../../store/authStore';
import { taskService } from '../../services/taskService';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const user = useUser();
  const tasks = useTasks();
  const tokenUsage = useTokenUsage();
  const userDownloads = useUserDownloads();
  const agents = useAgents();
  
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Calculate analytics data
  const userTasks = tasks.filter(t => t.userId === user?.id);
  const completedTasks = userTasks.filter(t => t.status === 'completed');
  const totalTokens = tokenUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
  const totalCost = userDownloads.reduce((sum, download) => sum + download.cost, 0);
  const avgCompletionTime = completedTasks.length > 0 ? 
    completedTasks.reduce((sum, task) => {
      if (task.result?.completedAt) {
        const start = new Date(task.createdAt).getTime();
        const end = new Date(task.result.completedAt).getTime();
        return sum + (end - start);
      }
      return sum;
    }, 0) / completedTasks.length / 1000 / 60 : 0; // Convert to minutes

  const agentStats = agents.map(agent => {
    const stats = taskService.getAgentPerformanceStats(agent.id);
    return {
      ...agent,
      ...stats
    };
  });

  const exportData = () => {
    const data = {
      summary: {
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        totalTokens,
        totalCost,
        avgCompletionTime: Math.round(avgCompletionTime)
      },
      tasks: userTasks,
      tokenUsage,
      downloads: userDownloads.filter(d => d.userId === user?.id),
      agentPerformance: agentStats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cognis-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Analytics Dashboard"
      size="full"
    >
      <div className="p-6">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={exportData}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userTasks.length}</p>
                <p className="text-white/60 text-sm">Total Tasks</p>
              </div>
            </div>
            <p className="text-green-400 text-sm">
              {completedTasks.length} completed ({userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0}%)
            </p>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p>
                <p className="text-white/60 text-sm">Tokens Used</p>
              </div>
            </div>
            <p className="text-blue-400 text-sm">
              Across {completedTasks.length} completed tasks
            </p>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
                <p className="text-white/60 text-sm">Total Revenue</p>
              </div>
            </div>
            <p className="text-green-400 text-sm">
              {userDownloads.filter(d => d.userId === user?.id).length} downloads
            </p>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-400 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(avgCompletionTime)}m</p>
                <p className="text-white/60 text-sm">Avg Completion</p>
              </div>
            </div>
            <p className="text-blue-400 text-sm">
              Average task completion time
            </p>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Agent Performance</h3>
            
            <div className="space-y-4">
              {agentStats.map((agent) => (
                <div key={agent.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{agent.name}</h4>
                    <span className="text-green-400 text-sm">{agent.successRate.toFixed(1)}% success</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Tasks</p>
                      <p className="text-white font-medium">{agent.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Tokens</p>
                      <p className="text-white font-medium">{agent.totalTokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Revenue</p>
                      <p className="text-white font-medium">${agent.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                        style={{ width: `${agent.successRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            
            <div className="space-y-3">
              {userTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <p className="text-white font-medium text-sm">{task.title}</p>
                    <p className="text-white/60 text-xs">{task.agentName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {task.status}
                    </span>
                    {task.result && (
                      <p className="text-white/60 text-xs mt-1">${task.result.cost.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}