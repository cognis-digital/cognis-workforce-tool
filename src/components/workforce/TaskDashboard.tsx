/**
 * TaskDashboard Component
 * Main interface for managing the Cognis Workforce Tool tasks
 */
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Tag, Spin, Modal, Tabs, Typography } from 'antd';
import { PlusOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import TaskCreationForm from './TaskCreationForm';
import TaskDetailView from './TaskDetailView';
import SystemHealthPanel from './SystemHealthPanel';

const { TabPane } = Tabs;
const { Search } = Input;
const { Title } = Typography;

interface Task {
  id: string;
  objective: string;
  status: string;
  deliverables: string[];
  created_at: string;
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

const TaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workforce/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setIsCreateModalVisible(false);
    fetchTasks();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.objective.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter ? task.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="text-xs font-mono">{id.substring(0, 8)}...</span>,
    },
    {
      title: 'Objective',
      dataIndex: 'objective',
      key: 'objective',
      render: (objective: string) => (
        <div className="truncate max-w-md">{objective}</div>
      ),
    },
    {
      title: 'Deliverables',
      dataIndex: 'deliverables',
      key: 'deliverables',
      render: (deliverables: string[]) => (
        <div className="flex flex-wrap gap-1">
          {deliverables.map((item, index) => (
            <Tag key={index} icon={<FileTextOutlined />}>
              {item}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} className="uppercase">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Task) => (
        <div className="flex gap-2">
          <Button type="primary" size="small" onClick={() => setSelectedTaskId(record.id)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <Title level={3}>Cognis Workforce Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
        >
          Create Task
        </Button>
      </div>

      <Tabs defaultActiveKey="tasks">
        <TabPane tab="Tasks" key="tasks">
          <Card className="mb-4">
            <div className="flex gap-4 mb-4">
              <Search
                placeholder="Search tasks"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                placeholder="Filter by Status"
                style={{ width: 200 }}
                allowClear
                onChange={handleStatusFilterChange}
              >
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="queued">Queued</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="review">Review</Select.Option>
                <Select.Option value="blocked">Blocked</Select.Option>
                <Select.Option value="done">Done</Select.Option>
                <Select.Option value="failed">Failed</Select.Option>
              </Select>
              <Button onClick={fetchTasks}>Refresh</Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={filteredTasks}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>
        </TabPane>
        <TabPane tab="System Health" key="health">
          <SystemHealthPanel />
        </TabPane>
      </Tabs>

      {/* Task Creation Modal */}
      <Modal
        title="Create New Task"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <TaskCreationForm onTaskCreated={handleTaskCreated} onCancel={() => setIsCreateModalVisible(false)} />
      </Modal>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <Modal
          title="Task Details"
          open={!!selectedTaskId}
          onCancel={() => setSelectedTaskId(null)}
          footer={null}
          width={1000}
        >
          <TaskDetailView
            taskId={selectedTaskId}
            onTaskUpdated={fetchTasks}
            onClose={() => setSelectedTaskId(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default TaskDashboard;
