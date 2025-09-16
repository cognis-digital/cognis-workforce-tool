/**
 * SystemHealthPanel Component
 * Displays health metrics and statistics for the Cognis Workforce system
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
const Card = ({ children, className = '', loading = false, title = null }) => (
  <div className={`p-4 border rounded-lg bg-white shadow-sm ${className} ${loading ? 'opacity-60' : ''}`}>
    {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
    {children}
  </div>
);

const Button = ({ children, onClick, icon = null, loading = false, size = 'medium', type = 'default' }) => (
  <button 
    onClick={onClick} 
    disabled={loading}
    className={`flex items-center gap-1 px-3 py-1 rounded ${type === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} ${loading ? 'opacity-60' : ''}`}
  >
    {icon} {children} {loading && '...'}
  </button>
);

const Alert = ({ message, description, type, showIcon, action }) => (
  <div className={`p-3 rounded border ${type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : type === 'warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
    <div className="font-semibold">{message}</div>
    <div className="text-sm">{description}</div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

const Statistic = ({ title, value, prefix = null, valueStyle = {} }) => (
  <div className="flex flex-col items-center">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="flex items-center gap-1" style={valueStyle}>
      {prefix && <span>{prefix}</span>}
      <span className="text-2xl font-bold">{value}</span>
    </div>
  </div>
);

const Progress = ({ type, percent, format, status }) => {
  let color = 'bg-blue-600';
  if (status === 'success') color = 'bg-green-600';
  else if (status === 'exception') color = 'bg-red-600';
  
  if (type === 'circle') {
    return (
      <div className="relative w-20 h-20 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color.replace('bg-', 'text-')} strokeWidth="10" 
            strokeDasharray={`${percent * 2.83}, 283`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">{format(percent)}</div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
    </div>
  );
};

// Icons
const CheckCircleOutlined = () => <span className="text-green-600">✓</span>;
const WarningOutlined = () => <span className="text-yellow-600">⚠️</span>;
const CloseCircleOutlined = () => <span className="text-red-600">✗</span>;
const ReloadOutlined = () => <span>🔄</span>;
const RocketOutlined = () => <span>🚀</span>;
const FileTextOutlined = () => <span>📄</span>;

const { Title, Text } = Typography;

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    task_created: number;
    task_completed: number;
    task_failed: number;
    subtask_completed: number;
    content_generated: number;
    content_validated: number;
    content_fixed: number;
    validation_passed: number;
    validation_failed: number;
    pr_created: number;
    pr_merged: number;
    [key: string]: number;
  };
  lastError?: string;
}

const SystemHealthPanel: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workforce/health');
      
      if (!response.ok) {
        throw new Error('Failed to fetch system health data');
      }

      const data = await response.json();
      setHealthData(data);
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Set up polling for health data every 30 seconds
    const intervalId = setInterval(fetchHealthData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading && !healthData) {
    return (
      <Card loading={true} className="h-64" />
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchHealthData} icon={<ReloadOutlined />}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!healthData) {
    return (
      <Alert
        message="No Data"
        description="No system health data available"
        type="warning"
        showIcon
      />
    );
  }

  // Calculate performance metrics
  const calculateSuccessRate = (success: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  };

  const taskSuccessRate = calculateSuccessRate(
    healthData.metrics.task_completed,
    healthData.metrics.task_completed + healthData.metrics.task_failed
  );

  const validationSuccessRate = calculateSuccessRate(
    healthData.metrics.validation_passed,
    healthData.metrics.validation_passed + healthData.metrics.validation_failed
  );

  const fixSuccessRate = calculateSuccessRate(
    healthData.metrics.content_fixed,
    healthData.metrics.validation_failed
  );

  const renderStatusIcon = () => {
    switch (healthData.status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'degraded':
        return <WarningOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
      case 'unhealthy':
        return <CloseCircleOutlined style={{ fontSize: '24px', color: '#f5222d' }} />;
      default:
        return null;
    }
  };

  const renderStatusColor = () => {
    switch (healthData.status) {
      case 'healthy':
        return '#52c41a';
      case 'degraded':
        return '#faad14';
      case 'unhealthy':
        return '#f5222d';
      default:
        return '#1890ff';
    }
  };

  return (
    <div className="system-health-container">
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {renderStatusIcon()}
            <Title level={4} className="mb-0 ml-2">
              System Status: {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
            </Title>
          </div>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchHealthData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {healthData.lastError && (
          <Alert 
            message="Last Error" 
            description={healthData.lastError} 
            type="error" 
            showIcon 
            className="mb-4" 
          />
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
<div>
            <Card>
              <Statistic 
                title="Tasks Created" 
                value={healthData.metrics.task_created} 
                prefix={<RocketOutlined />} 
              />
            </Card>
</div>
<div>
            <Card>
              <Statistic 
                title="Tasks Completed" 
                value={healthData.metrics.task_completed} 
                prefix={<CheckCircleOutlined />} 
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
</div>
<div>
            <Card>
              <Statistic 
                title="Content Generated" 
                value={healthData.metrics.content_generated || 0} 
                prefix={<FileTextOutlined />} 
              />
            </Card>
          </div>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <div className="px-4 text-lg font-medium">Success Rates</div>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>
        
<Row gutter={16}>
          <Col span={8} className="text-center">
            <Text strong>Task Completion</Text>
            <Progress 
              type="circle" 
              percent={taskSuccessRate} 
              format={percent => `${percent}%`}
              status={taskSuccessRate > 80 ? 'success' : taskSuccessRate > 50 ? 'normal' : 'exception'}
            />
          </Col>
          <Col span={8} className="text-center">
            <Text strong>Validation Success</Text>
            <Progress 
              type="circle" 
              percent={validationSuccessRate} 
              format={percent => `${percent}%`}
              status={validationSuccessRate > 80 ? 'success' : validationSuccessRate > 50 ? 'normal' : 'exception'}
            />
          </Col>
          <Col span={8} className="text-center">
            <Text strong>Fix Success</Text>
            <Progress 
              type="circle" 
              percent={fixSuccessRate} 
              format={percent => `${percent}%`}
              status={fixSuccessRate > 80 ? 'success' : fixSuccessRate > 50 ? 'normal' : 'exception'}
            />
          </Col>
        </Row>
<Col span={8} className="text-center">
              <Text strong>Task Completion</Text>
              <Progress 
                type="circle" 
                percent={taskSuccessRate} 
                format={percent => `${percent}%`}
                status={taskSuccessRate > 80 ? 'success' : taskSuccessRate > 50 ? 'normal' : 'exception'}
              />
</Col>
<Col span={8} className="text-center">
              <Text strong>Validation Success</Text>
              <Progress 
                type="circle" 
                percent={validationSuccessRate} 
                format={percent => `${percent}%`}
                status={validationSuccessRate > 80 ? 'success' : validationSuccessRate > 50 ? 'normal' : 'exception'}
              />
</Col>
          </div>
<Col span={8} className="text-center">
              <Text strong>Fix Success</Text>
              <Progress 
                type="circle" 
                percent={fixSuccessRate} 
                format={percent => `${percent}%`}
                status={fixSuccessRate > 80 ? 'success' : fixSuccessRate > 50 ? 'normal' : 'exception'}
              />
</Col>

        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200"></div>
          <div className="px-4 text-lg font-medium">Detailed Metrics</div>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Col span={6}>
            <Statistic title="Subtasks Completed" value={healthData.metrics.subtask_completed || 0} />
</Col>
          <Col span={6}>
            <Statistic title="Content Validated" value={healthData.metrics.content_validated || 0} />
</Col>
          <Col span={6}>
            <Statistic title="PRs Created" value={healthData.metrics.pr_created || 0} />
</Col>
          <Col span={6}>
            <Statistic title="PRs Merged" value={healthData.metrics.pr_merged || 0} />
</Col>
          <Col span={6}>
            <Statistic 
              title="Validation Passed" 
              value={healthData.metrics.validation_passed || 0}
              valueStyle={{ color: '#3f8600' }}
            />
</Col>
          <Col span={6}>
            <Statistic 
              title="Validation Failed" 
              value={healthData.metrics.validation_failed || 0} 
              valueStyle={{ color: '#cf1322' }}
            />
</Col>
          <Col span={6}>
            <Statistic 
              title="Content Fixed" 
              value={healthData.metrics.content_fixed || 0}
            />
</Col>
          <Col span={6}>
            <Statistic 
              title="Tasks Failed" 
              value={healthData.metrics.task_failed || 0}
              valueStyle={{ color: '#cf1322' }}
            />
</Col>
        </div>
      </Card>

      {healthData.metrics.avg_completion_time_ms && (
        <Card title="Performance Metrics">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="Avg Completion Time" 
                value={(healthData.metrics.avg_completion_time_ms / 1000).toFixed(2)} 
                suffix="sec" 
              />
</Col>
            <Col span={8}>
              <Statistic 
                title="Avg Validation Time" 
                value={(healthData.metrics.avg_validation_time_ms / 1000).toFixed(2)} 
                suffix="sec" 
              />
</Col>
            <Col span={8}>
              <Statistic 
                title="Avg Fix Time" 
                value={(healthData.metrics.avg_fix_time_ms / 1000).toFixed(2)} 
                suffix="sec" 
              />
</Col>
</Row>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthPanel;
