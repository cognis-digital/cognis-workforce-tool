import React, { useState } from 'react';
import { Database, Upload, FileText, Image, Link, Brain, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { useDataActions, useNotificationActions } from '../../store/appStore';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingKb?: any;
}

export default function KnowledgeBaseModal({ isOpen, onClose, editingKb }: KnowledgeBaseModalProps) {
  const [step, setStep] = useState<'basic' | 'content' | 'processing'>('basic');
  const [knowledgeBase, setKnowledgeBase] = useState({
    name: editingKb?.name || '',
    description: editingKb?.description || '',
    category: editingKb?.category || '',
    isPublic: editingKb?.isPublic || false,
    autoIndex: true,
    embeddingModel: 'text-embedding-ada-002',
    chunkSize: 1000,
    chunkOverlap: 200
  });
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { addKnowledgeBase, updateKnowledgeBase } = useDataActions();
  const { addNotification } = useNotificationActions();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addUrl = (url: string) => {
    if (url.trim() && !urls.includes(url.trim())) {
      setUrls(prev => [...prev, url.trim()]);
    }
  };

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateKnowledgeBase = async () => {
    setLoading(true);
    
    try {
      // Simulate knowledge base creation and processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newKb = {
        id: editingKb?.id || `kb-${Date.now()}`,
        ...knowledgeBase,
        size_bytes: files.reduce((total, file) => total + file.size, 0),
        status: 'ready',
        accuracy: Math.floor(Math.random() * 10) + 90, // 90-99%
        usage_count: 0,
        agents_connected: 0,
        created_at: editingKb?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingKb) {
        updateKnowledgeBase(editingKb.id, newKb);
        addNotification({
          type: 'success',
          title: 'Knowledge Base Updated',
          message: `${knowledgeBase.name} has been successfully updated.`
        });
      } else {
        addKnowledgeBase(newKb);
        addNotification({
          type: 'success',
          title: 'Knowledge Base Created',
          message: `${knowledgeBase.name} has been successfully created and indexed.`
        });
      }

      onClose();
      resetForm();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: 'Failed to process knowledge base. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('basic');
    setKnowledgeBase({
      name: '',
      description: '',
      category: '',
      isPublic: false,
      autoIndex: true,
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 1000,
      chunkOverlap: 200
    });
    setFiles([]);
    setUrls([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingKb ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
      size="lg"
      closeOnOverlayClick={!loading}
    >
      <div className="p-6">
        {step === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Name *</label>
                <input
                  type="text"
                  value={knowledgeBase.name}
                  onChange={(e) => setKnowledgeBase(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter knowledge base name..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-sm mb-2">Category</label>
                <select
                  value={knowledgeBase.category}
                  onChange={(e) => setKnowledgeBase(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select category...</option>
                  <option value="documentation">Documentation</option>
                  <option value="training">Training Materials</option>
                  <option value="research">Research Data</option>
                  <option value="policies">Policies & Procedures</option>
                  <option value="marketing">Marketing Content</option>
                  <option value="technical">Technical Resources</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Description</label>
              <textarea
                value={knowledgeBase.description}
                onChange={(e) => setKnowledgeBase(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Describe the purpose and content of this knowledge base..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={knowledgeBase.isPublic}
                    onChange={(e) => setKnowledgeBase(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <span className="text-white text-sm">Make this knowledge base public</span>
                </label>
                <p className="text-white/60 text-xs mt-1">Other team members can access and use this knowledge base</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('content')}
                disabled={!knowledgeBase.name.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next: Add Content
              </button>
            </div>
          </div>
        )}

        {step === 'content' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Add Content Sources</h3>
              
              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Upload Files</label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/30 transition-colors">
                    <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 mb-2">Drag and drop files here, or click to browse</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors inline-block"
                    >
                      Choose Files
                    </label>
                    <p className="text-white/40 text-xs mt-2">
                      Supported: PDF, DOC, TXT, MD, CSV, JSON (Max 10MB each)
                    </p>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-sm">{file.name}</span>
                            <span className="text-white/60 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Add URLs</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/documentation"
                      className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addUrl((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        addUrl(input.value);
                        input.value = '';
                      }}
                      className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                  
                  {urls.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {urls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4 text-green-400" />
                            <span className="text-white text-sm truncate">{url}</span>
                          </div>
                          <button
                            onClick={() => removeUrl(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('basic')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('processing')}
                  className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Processing Settings
                </button>
                <button
                  onClick={handleCreateKnowledgeBase}
                  disabled={!knowledgeBase.name.trim() || (files.length === 0 && urls.length === 0) || loading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      {editingKb ? 'Update' : 'Create'} Knowledge Base
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">AI Processing Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Embedding Model</label>
                  <select
                    value={knowledgeBase.embeddingModel}
                    onChange={(e) => setKnowledgeBase(prev => ({ ...prev, embeddingModel: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="text-embedding-ada-002">Ada-002 (Recommended)</option>
                    <option value="text-embedding-3-small">Embedding-3-Small</option>
                    <option value="text-embedding-3-large">Embedding-3-Large</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/60 text-sm mb-2">Chunk Size</label>
                  <input
                    type="number"
                    min="500"
                    max="2000"
                    value={knowledgeBase.chunkSize}
                    onChange={(e) => setKnowledgeBase(prev => ({ ...prev, chunkSize: parseInt(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <p className="text-white/60 text-xs mt-1">Optimal range: 800-1200 tokens</p>
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Chunk Overlap</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={knowledgeBase.chunkOverlap}
                  onChange={(e) => setKnowledgeBase(prev => ({ ...prev, chunkOverlap: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>No Overlap</span>
                  <span>{knowledgeBase.chunkOverlap} tokens</span>
                  <span>Max Overlap</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={knowledgeBase.autoIndex}
                      onChange={(e) => setKnowledgeBase(prev => ({ ...prev, autoIndex: e.target.checked }))}
                      className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-white text-sm">Auto-index new content</span>
                  </label>
                  <p className="text-white/60 text-xs mt-1">Automatically process and index new files added to this knowledge base</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <h4 className="text-blue-400 font-medium">AI Processing Preview</h4>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <p>• {files.length + urls.length} content sources will be processed</p>
                <p>• Estimated {Math.ceil((files.reduce((total, file) => total + file.size, 0) / 1024 / 1024) / 2)} minutes processing time</p>
                <p>• Content will be chunked into ~{Math.ceil(1000 / knowledgeBase.chunkSize * 100)} segments</p>
                <p>• Vector embeddings will be generated using {knowledgeBase.embeddingModel}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('content')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateKnowledgeBase}
                disabled={!knowledgeBase.name.trim() || loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {editingKb ? 'Update' : 'Create'} & Process
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}