/**
 * SimpleSystemHealthPanel Component
 * A simplified version of the system health metrics panel
 */
import React, { useState, useEffect } from 'react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, number>;
  lastError?: string;
}

const SimpleSystemHealthPanel: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
    // Set up polling for health data every 30 seconds
    const intervalId = setInterval(fetchHealthData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workforce/health');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system health data');
      }

      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !healthData) {
    return <div className="p-4 text-center">Loading system health data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-semibold">Error</h3>
        <p>{error}</p>
        <button 
          onClick={fetchHealthData}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) {
    return <div className="p-4 text-center">No system health data available</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const calculateSuccessRate = (success: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  };

  const taskSuccessRate = calculateSuccessRate(
    healthData.metrics.task_completed || 0,
    (healthData.metrics.task_completed || 0) + (healthData.metrics.task_failed || 0)
  );

  const validationSuccessRate = calculateSuccessRate(
    healthData.metrics.validation_passed || 0,
    (healthData.metrics.validation_passed || 0) + (healthData.metrics.validation_failed || 0)
  );

  return (
    <div className="system-health-container">
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className={`text-2xl ${getStatusColor(healthData.status)}`}>
              {healthData.status === 'healthy' ? '✓' : 
               healthData.status === 'degraded' ? '⚠️' : '✗'}
            </span>
            <h2 className="text-xl font-semibold ml-2">
              System Status: {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
            </h2>
          </div>
          <button 
            className="px-3 py-1 bg-blue-600 text-white rounded-md flex items-center gap-1"
            onClick={fetchHealthData}
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {healthData.lastError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
            <h3 className="font-semibold">Last Error</h3>
            <p>{healthData.lastError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded-md p-3 text-center">
            <div className="text-sm text-gray-500">Tasks Created</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <span>🚀</span>
              {healthData.metrics.task_created || 0}
            </div>
          </div>
          
          <div className="border rounded-md p-3 text-center">
            <div className="text-sm text-gray-500">Tasks Completed</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1 text-green-600">
              <span>✓</span>
              {healthData.metrics.task_completed || 0}
            </div>
          </div>
          
          <div className="border rounded-md p-3 text-center">
            <div className="text-sm text-gray-500">Content Generated</div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <span>📄</span>
              {healthData.metrics.content_generated || 0}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">Success Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-semibold">Task Completion</p>
              <div className="w-20 h-20 mx-auto relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={taskSuccessRate > 80 ? '#16a34a' : taskSuccessRate > 50 ? '#2563eb' : '#dc2626'} 
                    strokeWidth="10"
                    strokeDasharray={`${taskSuccessRate * 2.83}, 283`} 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-semibold">
                  {taskSuccessRate}%
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="font-semibold">Validation Success</p>
              <div className="w-20 h-20 mx-auto relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={validationSuccessRate > 80 ? '#16a34a' : validationSuccessRate > 50 ? '#2563eb' : '#dc2626'} 
                    strokeWidth="10"
                    strokeDasharray={`${validationSuccessRate * 2.83}, 283`} 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-semibold">
                  {validationSuccessRate}%
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="font-semibold">Content Stats</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Generated</div>
                  <div className="font-bold text-blue-600">{healthData.metrics.content_generated || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Fixed</div>
                  <div className="font-bold text-green-600">{healthData.metrics.content_fixed || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Detailed Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center border rounded-md p-2">
              <div className="text-xs text-gray-500">Subtasks Completed</div>
              <div className="font-bold">{healthData.metrics.subtask_completed || 0}</div>
            </div>
            <div className="text-center border rounded-md p-2">
              <div className="text-xs text-gray-500">Content Validated</div>
              <div className="font-bold">{healthData.metrics.content_validated || 0}</div>
            </div>
            <div className="text-center border rounded-md p-2">
              <div className="text-xs text-gray-500">PRs Created</div>
              <div className="font-bold">{healthData.metrics.pr_created || 0}</div>
            </div>
            <div className="text-center border rounded-md p-2">
              <div className="text-xs text-gray-500">PRs Merged</div>
              <div className="font-bold">{healthData.metrics.pr_merged || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {healthData.metrics.avg_completion_time_ms && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-2">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Avg Completion Time</div>
              <div className="text-xl font-bold">
                {(healthData.metrics.avg_completion_time_ms / 1000).toFixed(2)} sec
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Avg Validation Time</div>
              <div className="text-xl font-bold">
                {(healthData.metrics.avg_validation_time_ms / 1000).toFixed(2)} sec
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Avg Fix Time</div>
              <div className="text-xl font-bold">
                {(healthData.metrics.avg_fix_time_ms / 1000).toFixed(2)} sec
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSystemHealthPanel;
