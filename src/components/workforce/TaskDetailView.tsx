/**
 * TaskDetailView Component
 * Detailed view of a task in the Cognis Workforce system
 */
import React, { useState, useEffect } from 'react';
import { Tabs, Typography, Descriptions, Tag, Button, Timeline, Spin, Card, Collapse, Alert, Table } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  GithubOutlined,
  AuditOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface TaskDetailViewProps {
  taskId: string;
  onTaskUpdated: () => void;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'blue',
  queued: 'cyan',
  in_progress: 'orange',
  blocked: 'red',
  review: 'purple',
  done: 'green',
  failed: 'volcano',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <SyncOutlined spin />,
  queued: <SyncOutlined spin />,
  in_progress: <SyncOutlined spin />,
  blocked: <CloseCircleOutlined />,
  review: <AuditOutlined />,
  done: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
};

interface TaskData {
  task: {
    task_id: string;
    objective: string;
    role: string;
    deliverables: string[];
    constraints: string[];
    repo_target: string;
    repo_path: string;
    deadline: string | null;
    priority: string;
    status: string;
    subtasks: Array<{
      id: string;
      description: string;
      type: string;
      status: string;
      result_uri: string | null;
    }>;
    audit_log: Array<{
      timestamp: string;
      actor: string;
      action: string;
      details: Record<string, any>;
    }>;
    attempts: number;
    created_at: string;
    updated_at: string;
  };
  artifacts: Array<{
    artifact_id: string;
    file_path: string;
    content: string;
    format: string;
    version: number;
    created_at: string;
  }>;
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ taskId, onTaskUpdated, onClose }) => {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchTaskData();
  }, [taskId]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workforce/tasks/${taskId}/export`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch task data');
      }

      const data = await response.json();
      setTaskData(data);
      
      // Set the first artifact as active if available
      if (data.artifacts && data.artifacts.length > 0) {
        setActiveArtifactId(data.artifacts[0].artifact_id);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching task data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTask = async (action: string) => {
    try {
      setReviewLoading(true);
      
      const response = await fetch(`/api/workforce/tasks/${taskId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerId: 'user',
          action,
          comments: `Task ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs changes'} by user.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      // Refresh task data and notify parent
      await fetchTaskData();
      onTaskUpdated();
      setReviewAction(action);
    } catch (error: any) {
      setError(error.message || 'An error occurred during review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert message="Error" description={error} type="error" showIcon />
    );
  }

  if (!taskData) {
    return (
      <Alert message="No data" description="No task data available" type="warning" showIcon />
    );
  }

  const { task, artifacts } = taskData;

  // Get active artifact content
  const activeArtifact = artifacts.find(a => a.artifact_id === activeArtifactId);

  // Format artifact content based on its type
  const renderArtifactContent = (artifact: typeof activeArtifact) => {
    if (!artifact) return null;

    if (artifact.format === 'md') {
      // For Markdown, display in a preformatted block
      return (
        <div className="bg-gray-50 p-4 rounded-md">
          <pre className="whitespace-pre-wrap">{artifact.content}</pre>
        </div>
      );
    }

    // Default rendering for other formats
    return (
      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md overflow-auto">
        {artifact.content}
      </pre>
    );
  };

  return (
    <div className="task-detail-container">
      {reviewAction && (
        <Alert
          message={`Task ${reviewAction === 'approve' ? 'Approved' : reviewAction === 'reject' ? 'Rejected' : 'Changes Requested'}`}
          description={`You have successfully ${reviewAction}d this task.`}
          type={reviewAction === 'approve' ? 'success' : reviewAction === 'reject' ? 'error' : 'warning'}
          showIcon
          className="mb-4"
          closable
          onClose={() => setReviewAction(null)}
        />
      )}

      <div className="mb-4">
        <Title level={4}>{task.objective}</Title>
        <div className="flex items-center gap-2">
          <Tag color={statusColors[task.status] || 'default'} icon={statusIcons[task.status]}>
            {task.status.toUpperCase()}
          </Tag>
          <Text type="secondary">Created {new Date(task.created_at).toLocaleString()}</Text>
        </div>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Card className="mb-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Task ID">{task.task_id}</Descriptions.Item>
              <Descriptions.Item label="Role">{task.role}</Descriptions.Item>
              <Descriptions.Item label="Repository">{task.repo_target}</Descriptions.Item>
              <Descriptions.Item label="Path">{task.repo_path}</Descriptions.Item>
              <Descriptions.Item label="Priority">{task.priority}</Descriptions.Item>
              <Descriptions.Item label="Attempts">{task.attempts}</Descriptions.Item>
              <Descriptions.Item label="Created">{new Date(task.created_at).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Updated">{new Date(task.updated_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Deliverables" className="mb-4">
            <div className="flex flex-wrap gap-2">
              {task.deliverables.map((deliverable, index) => (
                <Tag key={index} icon={<FileTextOutlined />} color="blue">
                  {deliverable}
                </Tag>
              ))}
            </div>
          </Card>

          <Card title="Constraints" className="mb-4">
            <div className="flex flex-wrap gap-2">
              {task.constraints.map((constraint, index) => (
                <Tag key={index} color="purple">
                  {constraint}
                </Tag>
              ))}
            </div>
          </Card>

          {task.status === 'review' && (
            <Card title="Review Actions" className="mb-4 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReviewTask('approve')}
                  loading={reviewLoading}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReviewTask('reject')}
                  loading={reviewLoading}
                >
                  Reject
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => handleReviewTask('request_changes')}
                  loading={reviewLoading}
                >
                  Request Changes
                </Button>
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Progress" key="progress">
          <Card title="Subtasks" className="mb-4">
            <Table
              dataSource={task.subtasks}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => <Tag>{type}</Tag>,
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Tag color={statusColors[status] || 'default'}>
                      {status.toUpperCase()}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </TabPane>

        <TabPane tab="Artifacts" key="artifacts">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <Card title="Files">
                {artifacts.length === 0 ? (
                  <Text type="secondary">No artifacts generated yet</Text>
                ) : (
                  <div className="flex flex-col gap-2">
                    {artifacts.map((artifact) => (
                      <Button
                        key={artifact.artifact_id}
                        type={artifact.artifact_id === activeArtifactId ? 'primary' : 'default'}
                        icon={<FileTextOutlined />}
                        onClick={() => setActiveArtifactId(artifact.artifact_id)}
                        className="text-left"
                      >
                        {artifact.file_path} (v{artifact.version})
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card 
                title={activeArtifact ? `${activeArtifact.file_path} (v${activeArtifact.version})` : 'Content'}
                className="h-full"
              >
                {activeArtifact ? (
                  renderArtifactContent(activeArtifact)
                ) : (
                  <Text type="secondary">Select a file to view its content</Text>
                )}
              </Card>
            </div>
          </div>
        </TabPane>

        <TabPane tab="Audit Log" key="audit">
          <Card>
            <Timeline>
              {task.audit_log.map((entry, index) => (
                <Timeline.Item key={index}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Text strong>{entry.action}</Text>
                      <Text type="secondary" className="text-xs">
                        by {entry.actor}
                      </Text>
                    </div>
                    <Text type="secondary" className="text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Text>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <Collapse ghost className="mt-2">
                        <Panel header="Details" key="1">
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </Panel>
                      </Collapse>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TaskDetailView;
