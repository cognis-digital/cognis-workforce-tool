import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { database } from '../../services/database';
import { scheduledJobService, ScheduledJobType } from '../../services/scheduledJobService';
import { useNotificationActions } from '../../store/appStore';

interface ScheduledJobRun {
  id: string;
  job_type: ScheduledJobType;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  parameters: Record<string, any>;
  result: {
    success: boolean;
    message: string;
    processedItems?: number;
    error?: string;
    metadata?: Record<string, any>;
  } | null;
}

interface ScheduledJobsPanelProps {
  onTriggerJob: (jobType: ScheduledJobType) => Promise<void>;
}

export default function ScheduledJobsPanel({ onTriggerJob }: ScheduledJobsPanelProps) {
  const { addNotification } = useNotificationActions();
  const [loading, setLoading] = useState(true);
  const [jobRuns, setJobRuns] = useState<ScheduledJobRun[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  
  useEffect(() => {
    fetchJobRuns();
  }, []);
  
  const fetchJobRuns = async () => {
    setLoading(true);
    try {
      const { data, error } = await scheduledJobService.getRecentJobRuns(20);
      
      if (error) throw error;
      
      setJobRuns(data);
    } catch (error) {
      console.error('Error fetching job runs:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load scheduled jobs'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTriggerJob = async (jobType: ScheduledJobType) => {
    setRunningJob(jobType);
    
    try {
      await onTriggerJob(jobType);
      await fetchJobRuns(); // Refresh the list
    } catch (error) {
      console.error(`Error triggering job ${jobType}:`, error);
    } finally {
      setRunningJob(null);
    }
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getTimeDifference = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'In progress';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffMs = end - start;
    
    // If less than a minute
    if (diffMs < 60000) {
      return `${Math.round(diffMs / 1000)}s`;
    }
    
    // If less than an hour
    if (diffMs < 3600000) {
      return `${Math.floor(diffMs / 60000)}m ${Math.round((diffMs % 60000) / 1000)}s`;
    }
    
    // If more than an hour
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };
  
  const getJobTypeDetails = (jobType: ScheduledJobType): { name: string; description: string; schedule: string; icon: React.ReactNode } => {
    switch (jobType) {
      case 'check_subscription_expiration':
        return {
          name: 'Check Subscriptions',
          description: 'Check for expiring subscriptions and send notifications',
          schedule: 'Daily at midnight',
          icon: <Calendar className="w-5 h-5" />
        };
      case 'check_usage_limits':
        return {
          name: 'Check Usage Limits',
          description: 'Monitor user usage and notify when approaching limits',
          schedule: 'Every 6 hours',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'process_renewals':
        return {
          name: 'Process Renewals',
          description: 'Process subscription auto-renewals',
          schedule: 'Every 12 hours',
          icon: <RefreshCw className="w-5 h-5" />
        };
      case 'reset_usage_metrics':
        return {
          name: 'Reset Usage Metrics',
          description: 'Reset usage counters at the beginning of billing cycles',
          schedule: 'Daily at 1 AM',
          icon: <Clock className="w-5 h-5" />
        };
      case 'send_scheduled_reports':
        return {
          name: 'Send Reports',
          description: 'Generate and send scheduled reports',
          schedule: 'Weekly on Monday',
          icon: <Info className="w-5 h-5" />
        };
      case 'data_backup':
        return {
          name: 'Data Backup',
          description: 'Create backups of important data',
          schedule: 'Daily at 3 AM',
          icon: <Info className="w-5 h-5" />
        };
      default:
        return {
          name: jobType,
          description: 'Custom job',
          schedule: 'Manual only',
          icon: <Info className="w-5 h-5" />
        };
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'running':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-white/20 text-white/60';
    }
  };
  
  // Jobs to show in quick actions
  const quickActionJobs: ScheduledJobType[] = [
    'check_subscription_expiration',
    'check_usage_limits',
    'process_renewals',
    'reset_usage_metrics'
  ];
  
  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h3 className="text-white font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActionJobs.map((jobType) => {
            const jobDetails = getJobTypeDetails(jobType);
            return (
              <div
                key={jobType}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    {jobDetails.icon}
                  </div>
                  <button
                    onClick={() => handleTriggerJob(jobType)}
                    disabled={runningJob === jobType}
                    className="bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 p-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {runningJob === jobType ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <h4 className="text-white font-medium">{jobDetails.name}</h4>
                <p className="text-white/60 text-sm mt-1">{jobDetails.description}</p>
                <div className="flex items-center gap-1 mt-2 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />
                  {jobDetails.schedule}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Recent job runs */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">Recent Job Runs</h3>
          <button
            onClick={fetchJobRuns}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg flex items-center gap-1 text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-2 text-white/60 font-medium">Job Type</th>
                <th className="pb-2 text-white/60 font-medium">Status</th>
                <th className="pb-2 text-white/60 font-medium">Started</th>
                <th className="pb-2 text-white/60 font-medium">Duration</th>
                <th className="pb-2 text-white/60 font-medium">Items Processed</th>
                <th className="pb-2 text-white/60 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex justify-center">
                      <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : jobRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/60">
                    No job runs found
                  </td>
                </tr>
              ) : (
                jobRuns.map((job) => {
                  const jobDetails = getJobTypeDetails(job.job_type);
                  return (
                    <tr key={job.id} className="border-b border-white/5">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            {jobDetails.icon}
                          </div>
                          <div>
                            <p className="text-white font-medium">{jobDetails.name}</p>
                            <p className="text-white/60 text-xs">{job.job_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg w-fit ${getStatusClass(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span className="capitalize">{job.status}</span>
                        </div>
                      </td>
                      <td className="py-4 text-white/80">
                        {formatDateTime(job.started_at)}
                      </td>
                      <td className="py-4 text-white/80">
                        {job.completed_at 
                          ? getTimeDifference(job.started_at, job.completed_at)
                          : 'In progress'}
                      </td>
                      <td className="py-4 text-white/80">
                        {job.result?.processedItems ?? '-'}
                      </td>
                      <td className="py-4 text-white/80 max-w-[200px] truncate">
                        {job.result?.message ?? '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
