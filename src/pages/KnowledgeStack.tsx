import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  FolderPlus, 
  Image, 
  Search, 
  Filter, 
  Eye, 
  Download,
  FileText,
  Folder,
  MoreHorizontal,
  Edit,
  Trash2,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Plus
} from 'lucide-react';
import { useKnowledgeBases, useDataActions, useNotificationActions } from '../store/appStore';
import { useUser, useUserProfile } from '../store/authStore';
import KnowledgeBaseModal from '../components/modals/KnowledgeBaseModal';
import PaygateWrapper from '../components/PaygateWrapper';
import { openaiService } from '../services/openai';
import { usageService } from '../services/usageService';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'image';
  size?: number;
  content?: string;
  imageUrl?: string;
  summary?: string;
  keywords?: string[];
  createdAt: string;
  parentId?: string;
}

export default function KnowledgeStack() {
  const user = useUser();
  const userProfile = useUserProfile();
  const knowledgeBases = useKnowledgeBases();
  const { addKnowledgeBase, updateKnowledgeBase, addNotification } = useDataActions();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKb, setEditingKb] = useState(null);
  const [selectedKb, setSelectedKb] = useState(knowledgeBases[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  
  // File management state
  const [files, setFiles] = useState<FileItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats
  const totalFiles = files.filter(f => f.type !== 'folder').length;
  const totalFolders = files.filter(f => f.type === 'folder').length;
  const totalImages = files.filter(f => f.type === 'image').length;
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400 bg-green-500/20';
      case 'indexing': return 'text-blue-400 bg-blue-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const filteredFiles = files.filter(file => {
    const inCurrentFolder = currentFolder ? file.parentId === currentFolder : !file.parentId;
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return inCurrentFolder && matchesSearch;
  });

  // Upload Files Handler
  const handleUploadFiles = async () => {
    if (!fileInputRef.current) return;
    
    // Check usage limit
    if (!await usageService.trackUsage('knowledge_upload')) {
      addNotification({
        type: 'warning',
        title: 'Usage Limit Reached',
        message: 'Upgrade to Pro to continue uploading files.'
      });
      return;
    }

    fileInputRef.current.click();
  };

  const processUploadedFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProcessing(true);

    try {
      addNotification({
        type: 'info',
        title: 'Processing Files',
        message: `Analyzing ${selectedFiles.length} files with Cognis AI...`
      });

      for (const file of selectedFiles) {
        const fileContent = await readFileContent(file);
        
        // Process with AI
        const summary = await openaiService.generateKnowledgeSummary(fileContent);
        const keywords = await openaiService.extractKeywords(fileContent);
        const quality = await openaiService.analyzeContentQuality(fileContent);

        const newFile: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: 'file',
          size: file.size,
          content: fileContent,
          summary,
          keywords,
          createdAt: new Date().toISOString(),
          parentId: currentFolder
        };

        setFiles(prev => [...prev, newFile]);

        addNotification({
          type: 'success',
          title: 'File Processed',
          message: `${file.name} analyzed with ${quality.score}% quality score`
        });
      }

      // Update knowledge base if selected
      if (selectedKb) {
        updateKnowledgeBase(selectedKb.id, {
          size_bytes: selectedKb.size_bytes + selectedFiles.reduce((sum, f) => sum + f.size, 0),
          usage_count: selectedKb.usage_count + 1,
          updated_at: new Date().toISOString()
        });
      }

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to process files'
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Images Handler
  const handleAddImages = async () => {
    if (!imageInputRef.current) return;
    
    // Check usage limit
    if (!await usageService.trackUsage('knowledge_upload')) {
      addNotification({
        type: 'warning',
        title: 'Usage Limit Reached',
        message: 'Upgrade to Pro to continue adding images.'
      });
      return;
    }

    imageInputRef.current.click();
  };

  const processUploadedImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImages = Array.from(event.target.files || []);
    if (selectedImages.length === 0) return;

    setUploading(true);
    setProcessing(true);

    try {
      addNotification({
        type: 'info',
        title: 'Processing Images',
        message: `Analyzing ${selectedImages.length} images with Cognis Vision AI...`
      });

      for (const image of selectedImages) {
        const imageUrl = URL.createObjectURL(image);
        
        // Simulate AI vision analysis
        const visionAnalysis = await simulateVisionAnalysis(image.name);

        const newImage: FileItem = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: image.name,
          type: 'image',
          size: image.size,
          imageUrl,
          summary: visionAnalysis.description,
          keywords: visionAnalysis.tags,
          createdAt: new Date().toISOString(),
          parentId: currentFolder
        };

        setFiles(prev => [...prev, newImage]);

        addNotification({
          type: 'success',
          title: 'Image Analyzed',
          message: `${image.name} processed with AI vision analysis`
        });
      }

      // Update knowledge base if selected
      if (selectedKb) {
        updateKnowledgeBase(selectedKb.id, {
          size_bytes: selectedKb.size_bytes + selectedImages.reduce((sum, f) => sum + f.size, 0),
          usage_count: selectedKb.usage_count + 1,
          updated_at: new Date().toISOString()
        });
      }

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Image Processing Failed',
        message: error.message || 'Failed to process images'
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // New Folder Handler
  const handleNewFolder = async () => {
    // Check usage limit
    if (!await usageService.trackUsage('knowledge_upload', 0.5)) {
      addNotification({
        type: 'warning',
        title: 'Usage Limit Reached',
        message: 'Upgrade to Pro to continue organizing content.'
      });
      return;
    }

    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const newFolder: FileItem = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: folderName.trim(),
      type: 'folder',
      createdAt: new Date().toISOString(),
      parentId: currentFolder
    };

    setFiles(prev => [...prev, newFolder]);
    
    addNotification({
      type: 'success',
      title: 'Folder Created',
      message: `Folder "${folderName}" created successfully`
    });
  };

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        // For binary files, convert to base64 or just use filename as content
        resolve(`Binary file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      }
    });
  };

  // Simulate AI vision analysis for images
  const simulateVisionAnalysis = async (fileName: string) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const descriptions = [
      'Professional business diagram showing workflow processes',
      'Chart displaying quarterly performance metrics',
      'Technical architecture diagram with system components',
      'Marketing infographic with key statistics',
      'Product screenshot highlighting main features'
    ];
    
    const tagSets = [
      ['business', 'workflow', 'process'],
      ['chart', 'metrics', 'performance'],
      ['technical', 'architecture', 'system'],
      ['marketing', 'infographic', 'statistics'],
      ['product', 'features', 'ui']
    ];
    
    const randomIndex = Math.floor(Math.random() * descriptions.length);
    
    return {
      description: descriptions[randomIndex],
      tags: tagSets[randomIndex],
      confidence: Math.floor(Math.random() * 20) + 80 // 80-100%
    };
  };

  const handleFileAction = (action: string, file: FileItem) => {
    switch (action) {
      case 'view':
        addNotification({
          type: 'info',
          title: 'File Viewer',
          message: `Opening ${file.name} in viewer...`
        });
        break;
      case 'download':
        if (file.content) {
          const blob = new Blob([file.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        break;
      case 'delete':
        setFiles(prev => prev.filter(f => f.id !== file.id));
        addNotification({
          type: 'success',
          title: 'File Deleted',
          message: `${file.name} has been removed`
        });
        break;
      case 'enter':
        if (file.type === 'folder') {
          setCurrentFolder(file.id);
        }
        break;
    }
  };

  const getCurrentPath = (): string => {
    if (!currentFolder) return '/';
    const folder = files.find(f => f.id === currentFolder);
    return `/${folder?.name || 'Unknown'}/`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8" />
            Knowledge Stack
          </h1>
          <p className="text-white/60">
            Manage your organization's knowledge base with AI-powered indexing and search capabilities.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white/10 text-white px-4 py-3 rounded-2xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Knowledge Base
          </button>
        </div>
      </div>

      {/* Usage Warning for Free Users */}
      {userProfile?.tier === 'free' && (
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h3 className="text-orange-400 font-medium">Free Plan Usage</h3>
          </div>
          <p className="text-white/70 text-sm">
            {user ? `${usageService.getRemainingUsage(user.id)} of 8 free actions remaining. ` : ''}
            Upgrade to Pro for unlimited knowledge base operations.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{knowledgeBases.length}</p>
              <p className="text-white/60 text-sm">Knowledge Bases</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-400 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalFiles}</p>
              <p className="text-white/60 text-sm">Documents</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalImages}</p>
              <p className="text-white/60 text-sm">Images</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-400 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(totalSize / (1024 * 1024)).toFixed(1)}MB</p>
              <p className="text-white/60 text-sm">Total Size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Bases List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Knowledge Bases</h2>

        {knowledgeBases.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setSelectedKb(kb)}
                className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer ${
                  selectedKb?.id === kb.id ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(kb.status)}`}>
                      {kb.status === 'ready' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {kb.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingKb(kb);
                        setShowCreateModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>

                <h3 className="text-white font-bold text-lg mb-1">{kb.name}</h3>
                <p className="text-white/60 text-sm mb-4">{kb.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-xs">Size</p>
                    <p className="text-white font-medium">{(kb.size_bytes / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Accuracy</p>
                    <p className="text-green-400 font-medium">{kb.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Usage</p>
                    <p className="text-white font-medium">{kb.usage_count} queries</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Agents</p>
                    <p className="text-white font-medium">{kb.agents_connected} connected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center mb-8">
            <Database className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Knowledge Bases</h3>
            <p className="text-white/60 mb-6">
              Create your first knowledge base to start organizing and indexing your content.
            </p>
            <PaygateWrapper action="knowledge_upload">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create First Knowledge Base
              </button>
            </PaygateWrapper>
          </div>
        )}
      </div>

      {/* File Browser */}
      {selectedKb && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {selectedKb.name} Content
              </h2>
              <span className="text-white/60 text-sm">
                {getCurrentPath()}
              </span>
              {currentFolder && (
                <button
                  onClick={() => setCurrentFolder(null)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  ← Back to root
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
              />
            </div>
          </div>

          {/* Processing Status */}
          {(uploading || processing) && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <h4 className="text-blue-400 font-medium">
                  {processing ? 'Processing Content with Cognis AI...' : 'Uploading Files...'}
                </h4>
              </div>
              <p className="text-white/70 text-sm">
                {processing ? 'AI is analyzing content for optimal search and retrieval.' : 'Files are being uploaded to your knowledge base.'}
              </p>
            </div>
          )}

          {/* File Grid */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      file.type === 'folder' 
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-400'
                        : file.type === 'image'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-400'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                    }`}>
                      {file.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-white" />
                      ) : file.type === 'image' ? (
                        <Image className="w-5 h-5 text-white" />
                      ) : (
                        <FileText className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleFileAction('view', file)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  <h4 
                    className="text-white font-medium text-sm mb-2 cursor-pointer hover:text-blue-400 transition-colors truncate"
                    onClick={() => handleFileAction(file.type === 'folder' ? 'enter' : 'view', file)}
                  >
                    {file.name}
                  </h4>
                  
                  {file.summary && (
                    <p className="text-white/60 text-xs mb-2 line-clamp-2">{file.summary}</p>
                  )}
                  
                  {file.keywords && file.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {file.keywords.slice(0, 2).map((keyword, idx) => (
                        <span key={idx} className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                      {file.keywords.length > 2 && (
                        <span className="text-white/40 text-xs">+{file.keywords.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : file.type}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.type !== 'folder' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileAction('download', file);
                        }}
                        className="flex-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction('delete', file);
                      }}
                      className="flex-1 bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
              <p className="text-white/60 mb-6">
                Upload files, add images, or create folders to organize your knowledge base.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Bar - Fixed Implementation */}
      {selectedKb && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/20 p-4 z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4">
              <PaygateWrapper action="knowledge_upload">
                <button
                  onClick={handleUploadFiles}
                  disabled={uploading || processing}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Files
                </button>
              </PaygateWrapper>

              <PaygateWrapper action="knowledge_upload">
                <button
                  onClick={handleAddImages}
                  disabled={uploading || processing}
                  className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  Add Images
                </button>
              </PaygateWrapper>

              <PaygateWrapper action="knowledge_upload">
                <button
                  onClick={handleNewFolder}
                  disabled={uploading || processing}
                  className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
              </PaygateWrapper>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.js,.ts,.py,.java,.cpp,.html,.css"
        onChange={processUploadedFiles}
        className="hidden"
      />
      
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={processUploadedImages}
        className="hidden"
      />

      {/* Modals */}
      <KnowledgeBaseModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingKb(null);
        }}
        editingKb={editingKb}
      />
    </div>
  );
}