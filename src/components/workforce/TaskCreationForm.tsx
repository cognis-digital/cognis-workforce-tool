/**
 * TaskCreationForm Component
 * Form for creating new tasks in the Cognis Workforce system
 */
import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, Alert, Typography } from 'antd';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface TaskCreationFormProps {
  onTaskCreated: () => void;
  onCancel: () => void;
}

const TaskCreationForm: React.FC<TaskCreationFormProps> = ({ onTaskCreated, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare the instruction and metadata
      const instruction = values.objective;
      const meta = {
        role: values.role || 'CEO',
        deliverables: values.specifyDeliverables ? values.deliverables?.split(',').map((d: string) => d.trim()) : undefined,
        repo_target: values.repository || 'cognis-digital/cognis-workforce-tool',
        repo_path: values.path || undefined,
        priority: values.priority || 'medium',
        constraints: []
      };

      // Add constraints based on checkboxes
      if (values.auditReady) meta.constraints.push('audit-ready');
      if (values.selfCorrecting) meta.constraints.push('self-correcting');
      if (values.complianceCheck) meta.constraints.push('compliance-check');

      // Call the API
      const response = await fetch('/api/workforce/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction, meta }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Success
      const data = await response.json();
      form.resetFields();
      onTaskCreated();
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          role: 'CEO',
          priority: 'medium',
          repository: 'cognis-digital/cognis-workforce-tool',
          path: 'docs/deliverables',
          auditReady: false,
          selfCorrecting: true,
          complianceCheck: false,
          specifyDeliverables: false,
        }}
      >
        <Form.Item
          name="objective"
          label="Task Objective"
          rules={[{ required: true, message: 'Please enter the task objective' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Create a Statement of Work for Project X, make it audit-ready..."
            className="text-base"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="role" label="Role">
            <Select>
              <Option value="CEO">CEO</Option>
              <Option value="CTO">CTO</Option>
              <Option value="PM">Project Manager</Option>
              <Option value="Dev">Developer</Option>
            </Select>
          </Form.Item>

          <Form.Item name="priority" label="Priority">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="repository" label="Target Repository">
          <Input placeholder="organization/repo-name" />
        </Form.Item>

        <Form.Item name="path" label="Repository Path">
          <Input placeholder="docs/deliverables" />
        </Form.Item>

        <Form.Item name="specifyDeliverables" valuePropName="checked">
          <Checkbox>Specify deliverable files manually</Checkbox>
        </Form.Item>

        <Form.Item 
          name="deliverables" 
          label="Deliverables"
          rules={[{ 
            required: form.getFieldValue('specifyDeliverables'), 
            message: 'Please specify deliverables' 
          }]}
          className={form.getFieldValue('specifyDeliverables') ? '' : 'hidden'}
        >
          <Input placeholder="SOW.md, presentation.pptx, report.pdf" />
        </Form.Item>

        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <Title level={5}>Constraints</Title>
          <Text type="secondary" className="block mb-2">Select constraints for task generation:</Text>
          
          <Form.Item name="auditReady" valuePropName="checked">
            <Checkbox>Audit-Ready (include audit trail information)</Checkbox>
          </Form.Item>

          <Form.Item name="selfCorrecting" valuePropName="checked">
            <Checkbox>Self-Correcting (automatically fix validation issues)</Checkbox>
          </Form.Item>

          <Form.Item name="complianceCheck" valuePropName="checked">
            <Checkbox>Compliance Check (ensure content meets compliance standards)</Checkbox>
          </Form.Item>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Task
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TaskCreationForm;
