import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Users, 
  CheckCircle, 
  FileText, 
  Edit,
  Eye,
  Trash2,
  Crown,
  DollarSign,
  Clock,
  MapPin,
  Building
} from 'lucide-react';
import { useNotificationActions } from '../store/appStore';

interface JobRole {
  id: string;
  title: string;
  department: string;
  experienceRequired: string;
  salaryRange: string;
  status: 'active' | 'draft' | 'paused';
  keyResponsibilities: string[];
  requiredSkills: string[];
  agentsAssigned: number;
  description: string;
  location: string;
  employmentType: string;
  createdAt: string;
}

export default function JobRoles() {
  const { addNotification } = useNotificationActions();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Demo job roles data
  const jobRoles: JobRole[] = [
    {
      id: 'role-1',
      title: 'Senior Financial Analyst',
      department: 'Finance',
      experienceRequired: '5+ years',
      salaryRange: '$80,000 - $120,000',
      status: 'active',
      keyResponsibilities: [
        'Analyze financial data and market trends',
        'Create detailed financial reports',
        'Support strategic decision making',
        'Monitor budget performance'
      ],
      requiredSkills: ['Financial Modeling', 'Data Analysis', 'Excel', 'Python'],
      agentsAssigned: 3,
      description: 'Lead financial analysis and reporting for strategic initiatives',
      location: 'Remote',
      employmentType: 'Full-time',
      createdAt: '2025-01-15'
    },
    {
      id: 'role-2',
      title: 'Content Marketing Manager',
      department: 'Marketing',
      experienceRequired: '3+ years',
      salaryRange: '$65,000 - $85,000',
      status: 'active',
      keyResponsibilities: [
        'Develop content marketing strategies',
        'Create engaging content across platforms',
        'Manage content calendar and campaigns',
        'Analyze content performance metrics'
      ],
      requiredSkills: ['Content Strategy', 'SEO', 'Social Media', 'Analytics'],
      agentsAssigned: 2,
      description: 'Drive content strategy and execution across all marketing channels',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      createdAt: '2025-01-12'
    },
    {
      id: 'role-3',
      title: 'Data Science Specialist',
      department: 'Technology',
      experienceRequired: '4+ years',
      salaryRange: '$90,000 - $130,000',
      status: 'draft',
      keyResponsibilities: [
        'Build predictive models and algorithms',
        'Analyze large datasets for insights',
        'Collaborate with product teams',
        'Present findings to stakeholders'
      ],
      requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
      agentsAssigned: 0,
      description: 'Lead data science initiatives and machine learning projects',
      location: 'New York, NY',
      employmentType: 'Full-time',
      createdAt: '2025-01-10'
    }
  ];

  const totalRoles = jobRoles.length;
  const activeRoles = jobRoles.filter(role => role.status === 'active').length;
  const agentsDeployed = jobRoles.reduce((total, role) => total + role.agentsAssigned, 0);
  const draftRoles = jobRoles.filter(role => role.status === 'draft').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'draft': return 'text-orange-400 bg-orange-500/20';
      case 'paused': return 'text-red-400 bg-red-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'draft': return FileText;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Job Role Manager
          </h1>
          <p className="text-white/60">
            Define and manage job roles for AI agent assignment and workforce automation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-2xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Role
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalRoles}</p>
              <p className="text-white/60 text-sm">Total Roles</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeRoles}</p>
              <p className="text-white/60 text-sm">Active Roles</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{agentsDeployed}</p>
              <p className="text-white/60 text-sm">Agents Deployed</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-400 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{draftRoles}</p>
              <p className="text-white/60 text-sm">Draft Roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Job Roles */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Current Job Roles</h2>

        <div className="space-y-6">
          {jobRoles.map((role) => {
            const StatusIcon = getStatusIcon(role.status);
            
            return (
              <div
                key={role.id}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Role Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-white font-bold text-xl">{role.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(role.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {role.status}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-white/60 text-sm">Department</p>
                        <p className="text-white font-medium">{role.department}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Experience Required</p>
                        <p className="text-white font-medium">{role.experienceRequired}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Salary Range</p>
                        <p className="text-white font-medium">{role.salaryRange}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-white/60 text-sm mb-2">Key Responsibilities</p>
                      <ul className="list-disc list-inside space-y-1">
                        {role.keyResponsibilities.slice(0, 2).map((responsibility, index) => (
                          <li key={index} className="text-white/70 text-sm">{responsibility}</li>
                        ))}
                      </ul>
                      {role.keyResponsibilities.length > 2 && (
                        <p className="text-blue-400 text-sm mt-1">+{role.keyResponsibilities.length - 2} more responsibilities</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-white/60 text-sm mb-2">Required Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {role.requiredSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {role.requiredSkills.length > 4 && (
                          <span className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs">
                            +{Math.max(0, role.requiredSkills.length - 4)} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{role.agentsAssigned} AI agents assigned</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <button className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}