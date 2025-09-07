import { createTimeSeriesStore } from '../core/timeSeriesStore';
import evolutionManager from '../core/applicationEvolutionManager';
import stateAnalysisEngine from '../core/stateAnalysisEngine';
import { withAdaptiveEvolution } from '../core/adaptiveUI';
import { hasFeatureAccess } from './rbacSystem';

/**
 * Knowledge document with versioning and metadata
 */
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'markdown' | 'html' | 'pdf' | 'image';
  tags: string[];
  embedding?: number[];  // Vector embedding for semantic search
  metadata: {
    author: string;
    createdAt: number;
    updatedAt: number;
    size: number;  // in bytes
    summary?: string;
    confidence: number;  // AI-generated confidence score
    verified?: boolean;  // Blockchain verification status
    verifiedAt?: number; // When the verification occurred
  };
  versions: Array<{
    id: string;
    timestamp: number;
    author: string;
    size: number;
    summary?: string;
    changes?: string;
  }>;
}

/**
 * Knowledge base collection with document references
 */
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: string[];  // Document IDs
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;  // Total size in bytes
  owner: string;
  collaborators: string[];
  isPublic: boolean;
  embedding?: number[]; // Base-level embedding for the entire knowledge base
}

/**
 * Knowledge state with temporal tracking
 */
export interface KnowledgeState {
  bases: Record<string, KnowledgeBase>;
  documents: Record<string, KnowledgeDocument>;
  totalSize: number;
  stats: {
    totalBases: number;
    totalDocuments: number;
    totalImages: number;
    lastUpdated: number;
  };
  pendingUploads: Array<{
    id: string;
    fileName: string;
    progress: number;
    started: number;
  }>;
  processingHistory: Array<{
    timestamp: number;
    action: 'upload' | 'process' | 'embed' | 'analyze' | 'delete' | 'verify';
    resourceId: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    error?: string;
  }>;
  searchResults: {
    query: string;
    timestamp: number;
    results: string[]; // Document IDs
  }[];
}

// Initial state based on the Knowledge Stack screenshot
const initialKnowledgeState: KnowledgeState = {
  bases: {},
  documents: {},
  totalSize: 0,
  stats: {
    totalBases: 0,
    totalDocuments: 0,
    totalImages: 0,
    lastUpdated: Date.now()
  },
  pendingUploads: [],
  processingHistory: [],
  searchResults: []
};

// Create time-series store for Knowledge Stack
export const knowledgeStore = createTimeSeriesStore(initialKnowledgeState, {
  maxHistory: 100,
  autoSnapshot: true
});

// Register with evolution manager
evolutionManager.registerStateEvolution('knowledgeStack', initialKnowledgeState);

/**
 * Create a new knowledge base using recursive initialization
 * @param name Base name
 * @param description Base description
 * @param tags Optional tags
 * @param owner Owner ID
 * @returns Knowledge base ID
 */
export const createKnowledgeBase = (
  name: string, 
  description: string, 
  tags: string[] = [],
  owner: string = 'current-user'
): string => {
  const { current } = knowledgeStore.getState();
  
  const id = `kb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  
  const newBase: KnowledgeBase = {
    id,
    name,
    description,
    documents: [],
    tags,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 1,
    size: 0,
    owner,
    collaborators: [],
    isPublic: false
  };
  
  knowledgeStore.getState().update({
    bases: { ...current.bases, [id]: newBase },
    stats: {
      ...current.stats,
      totalBases: current.stats.totalBases + 1,
      lastUpdated: now
    }
  });
  
  // Create snapshot after knowledge base creation
  knowledgeStore.getState().createSnapshot(`kb-created-${id}`);
  
  // Record state transition for analysis
  stateAnalysisEngine.recordTransition(
    { bases: current.bases },
    { bases: { ...current.bases, [id]: newBase } },
    'create_knowledge_base'
  );
  
  return id;
};

/**
 * Add document to knowledge base using recursive processing
 * @param baseId Base identifier
 * @param document Document to add
 * @param authorId Author identifier
 * @returns Promise with document ID
 */
export const addDocument = async (
  baseId: string, 
  document: {
    title: string;
    content: string;
    contentType: KnowledgeDocument['contentType'];
    tags: string[];
  },
  authorId: string = 'current-user'
): Promise<string> => {
  const { current } = knowledgeStore.getState();
  
  // Validate knowledge base exists
  if (!current.bases[baseId]) {
    throw new Error(`Knowledge base ${baseId} not found`);
  }
  
  // Generate document ID and metadata
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  const size = calculateDocumentSize(document);
  
  // Create new document
  const newDoc: KnowledgeDocument = {
    ...document,
    id: docId,
    metadata: {
      author: authorId,
      createdAt: now,
      updatedAt: now,
      size,
      confidence: 0.95
    },
    versions: [{
      id: `v-${now}`,
      timestamp: now,
      author: authorId,
      size,
      summary: 'Initial version'
    }]
  };
  
  // Start processing indicator
  knowledgeStore.getState().update({
    processingHistory: [
      ...current.processingHistory,
      {
        timestamp: now,
        action: 'upload',
        resourceId: docId,
        status: 'started'
      }
    ]
  });
  
  try {
    // Process document with recursive depth handling
    const processedDoc = await processDocumentRecursively(newDoc);
    
    // Update state with new document
    knowledgeStore.getState().update({
      documents: { 
        ...knowledgeStore.getState().current.documents, 
        [docId]: processedDoc 
      },
      bases: {
        ...knowledgeStore.getState().current.bases,
        [baseId]: {
          ...knowledgeStore.getState().current.bases[baseId],
          documents: [...knowledgeStore.getState().current.bases[baseId].documents, docId],
          updatedAt: now,
          size: knowledgeStore.getState().current.bases[baseId].size + size
        }
      },
      totalSize: knowledgeStore.getState().current.totalSize + size,
      stats: {
        ...knowledgeStore.getState().current.stats,
        totalDocuments: knowledgeStore.getState().current.stats.totalDocuments + 1,
        totalImages: document.contentType === 'image' 
          ? knowledgeStore.getState().current.stats.totalImages + 1 
          : knowledgeStore.getState().current.stats.totalImages,
        lastUpdated: now
      },
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'upload',
          resourceId: docId,
          status: 'completed',
          duration: Date.now() - now
        }
      ]
    });
    
    // Create snapshot after document addition
    knowledgeStore.getState().createSnapshot(`doc-added-${docId}`);
    
    return docId;
  } catch (error) {
    // Handle processing error
    knowledgeStore.getState().update({
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'upload',
          resourceId: docId,
          status: 'failed',
          duration: Date.now() - now,
          error: error.message
        }
      ]
    });
    
    throw error;
  }
};

/**
 * Process document recursively with AI analysis
 * @param document Document to process
 * @param depth Current processing depth
 * @returns Processed document
 */
async function processDocumentRecursively(
  document: KnowledgeDocument, 
  depth: number = 0
): Promise<KnowledgeDocument> {
  // Base case - maximum processing depth reached
  if (depth > 3) return document;
  
  // Start with basic processing
  let processedDoc = { ...document };
  
  try {
    // Record processing start
    const startTime = Date.now();
    knowledgeStore.getState().update({
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: startTime,
          action: 'process',
          resourceId: document.id,
          status: 'started'
        }
      ]
    });
    
    // Step 1: Content analysis (extract entities, key concepts)
    if (depth >= 0) {
      await simulateProcessingDelay(500);
      
      // In a real implementation, this would call an AI service
      // For now, we'll simulate with basic metadata
      processedDoc.metadata.summary = `AI-generated summary of ${document.title}`;
    }
    
    // Step 2: Generate embeddings for semantic search
    if (depth >= 1) {
      await simulateProcessingDelay(700);
      
      // Simulate vector embedding generation
      processedDoc.embedding = Array(384).fill(0).map(() => Math.random() - 0.5);
      
      // Record embedding generation
      knowledgeStore.getState().update({
        processingHistory: [
          ...knowledgeStore.getState().current.processingHistory,
          {
            timestamp: Date.now(),
            action: 'embed',
            resourceId: document.id,
            status: 'completed',
            duration: 700
          }
        ]
      });
    }
    
    // Step 3: Advanced analysis for deeper insights
    if (depth >= 2) {
      await simulateProcessingDelay(1000);
      
      // In a real implementation, this would perform more advanced analysis
      processedDoc.metadata.confidence = 0.98;
    }
    
    // Record successful processing
    knowledgeStore.getState().update({
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'process',
          resourceId: document.id,
          status: 'completed',
          duration: Date.now() - startTime
        }
      ]
    });
    
    return processedDoc;
  } catch (error) {
    // Record processing failure
    knowledgeStore.getState().update({
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'process',
          resourceId: document.id,
          status: 'failed',
          error: error.message
        }
      ]
    });
    
    throw error;
  }
}

/**
 * Update existing document with version tracking
 * @param docId Document identifier
 * @param updates Document updates
 * @param authorId Author identifier
 * @returns Updated document
 */
export const updateDocument = async (
  docId: string,
  updates: Partial<Pick<KnowledgeDocument, 'title' | 'content' | 'tags'>>,
  authorId: string = 'current-user'
): Promise<KnowledgeDocument> => {
  const { current } = knowledgeStore.getState();
  
  // Validate document exists
  if (!current.documents[docId]) {
    throw new Error(`Document ${docId} not found`);
  }
  
  const doc = current.documents[docId];
  const now = Date.now();
  
  // Calculate size of updated document
  const updatedDoc = { ...doc, ...updates };
  const newSize = calculateDocumentSize(updatedDoc);
  const sizeDiff = newSize - doc.metadata.size;
  
  // Create new version entry
  const versionId = `v-${now}`;
  const newVersion = {
    id: versionId,
    timestamp: now,
    author: authorId,
    size: newSize,
    summary: `Updated ${Object.keys(updates).join(', ')}`,
    changes: generateChangeSummary(doc, updates)
  };
  
  // Add version and update metadata
  const finalDoc: KnowledgeDocument = {
    ...updatedDoc,
    metadata: {
      ...doc.metadata,
      updatedAt: now,
      size: newSize
    },
    versions: [newVersion, ...doc.versions]
  };
  
  // Find base containing this document
  const baseId = findBaseContainingDocument(docId);
  
  if (baseId) {
    // Update document and knowledge base
    knowledgeStore.getState().update({
      documents: {
        ...current.documents,
        [docId]: finalDoc
      },
      totalSize: current.totalSize + sizeDiff,
      bases: baseId ? {
        ...current.bases,
        [baseId]: {
          ...current.bases[baseId],
          size: current.bases[baseId].size + sizeDiff,
          updatedAt: now
        }
      } : current.bases
    });
    
    // Create snapshot for document update
    knowledgeStore.getState().createSnapshot(`doc-updated-${docId}-${versionId}`);
  } else {
    // Just update the document if not attached to a base
    knowledgeStore.getState().update({
      documents: {
        ...current.documents,
        [docId]: finalDoc
      },
      totalSize: current.totalSize + sizeDiff
    });
  }
  
  // Process updated document with AI
  return processDocumentRecursively(finalDoc);
};

/**
 * Verify document authenticity on blockchain
 * @param docId Document identifier
 * @param userId User requesting verification
 * @returns Promise resolving when verification completes
 */
export const verifyDocument = async (
  docId: string,
  userId: string
): Promise<void> => {
  const { current } = knowledgeStore.getState();
  
  // Check if user has access to blockchain verification feature
  if (!hasFeatureAccess(userId, 'knowledge_verification', 'pro')) {
    throw new Error('Blockchain verification requires Pro subscription');
  }
  
  // Validate document exists
  if (!current.documents[docId]) {
    throw new Error(`Document ${docId} not found`);
  }
  
  const doc = current.documents[docId];
  const now = Date.now();
  
  try {
    // Record verification start
    knowledgeStore.getState().update({
      processingHistory: [
        ...current.processingHistory,
        {
          timestamp: now,
          action: 'verify',
          resourceId: docId,
          status: 'started'
        }
      ]
    });
    
    // Simulate blockchain verification
    await simulateProcessingDelay(2000);
    
    // Update document with verification status
    knowledgeStore.getState().update({
      documents: {
        ...current.documents,
        [docId]: {
          ...doc,
          metadata: {
            ...doc.metadata,
            verified: true,
            verifiedAt: now
          }
        }
      },
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'verify',
          resourceId: docId,
          status: 'completed',
          duration: Date.now() - now
        }
      ]
    });
  } catch (error) {
    // Record verification failure
    knowledgeStore.getState().update({
      processingHistory: [
        ...knowledgeStore.getState().current.processingHistory,
        {
          timestamp: Date.now(),
          action: 'verify',
          resourceId: docId,
          status: 'failed',
          error: error.message,
          duration: Date.now() - now
        }
      ]
    });
    
    throw error;
  }
};

/**
 * Search across knowledge bases using semantic search
 * @param query Search query
 * @param baseIds Optional base IDs to search within
 * @param limit Maximum results to return
 * @returns Promise with matching document IDs
 */
export const searchKnowledge = async (
  query: string,
  baseIds?: string[],
  limit: number = 10
): Promise<string[]> => {
  const { current } = knowledgeStore.getState();
  
  // Record search start
  const searchStartTime = Date.now();
  
  try {
    // In a real implementation, this would generate embeddings for the query
    // and perform cosine similarity search against document embeddings
    
    // For this example, we'll do a simple text-based search
    await simulateProcessingDelay(800);
    
    // Search logic - filter to specified bases if provided
    let searchSpace = Object.values(current.documents);
    if (baseIds && baseIds.length > 0) {
      const allowedDocIds = new Set<string>();
      baseIds.forEach(baseId => {
        const base = current.bases[baseId];
        if (base) {
          base.documents.forEach(docId => allowedDocIds.add(docId));
        }
      });
      searchSpace = searchSpace.filter(doc => allowedDocIds.has(doc.id));
    }
    
    // Simple search implementation
    const lowerQuery = query.toLowerCase();
    const results = searchSpace
      .filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) || 
        doc.content.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => 
        // Sort by relevance (number of query occurrences)
        countOccurrences(b.content.toLowerCase(), lowerQuery) -
        countOccurrences(a.content.toLowerCase(), lowerQuery)
      )
      .slice(0, limit)
      .map(doc => doc.id);
    
    // Record search results
    knowledgeStore.getState().update({
      searchResults: [
        {
          query,
          timestamp: searchStartTime,
          results
        },
        ...current.searchResults.slice(0, 19) // Keep last 20 searches
      ]
    });
    
    return results;
  } catch (error) {
    console.error('Knowledge search failed:', error);
    return [];
  }
};

/**
 * Revert document to a previous version
 * @param docId Document identifier
 * @param versionId Version to revert to
 * @param userId User performing reversion
 */
export const revertDocumentToVersion = async (
  docId: string,
  versionId: string,
  userId: string = 'current-user'
): Promise<void> => {
  const { current } = knowledgeStore.getState();
  
  // Validate document exists
  if (!current.documents[docId]) {
    throw new Error(`Document ${docId} not found`);
  }
  
  const doc = current.documents[docId];
  
  // Find specified version
  const version = doc.versions.find(v => v.id === versionId);
  if (!version) {
    throw new Error(`Version ${versionId} not found for document ${docId}`);
  }
  
  // Get the snapshot corresponding to this version
  const snapshotName = `doc-updated-${docId}-${versionId}`;
  
  try {
    // Try to load document from snapshot
    knowledgeStore.getState().loadSnapshot(snapshotName);
    
    // Add new version entry documenting the reversion
    const now = Date.now();
    const updatedDoc = current.documents[docId];
    
    if (updatedDoc) {
      knowledgeStore.getState().update({
        documents: {
          ...current.documents,
          [docId]: {
            ...updatedDoc,
            metadata: {
              ...updatedDoc.metadata,
              updatedAt: now
            },
            versions: [
              {
                id: `v-${now}`,
                timestamp: now,
                author: userId,
                size: updatedDoc.metadata.size,
                summary: `Reverted to version ${versionId}`,
                changes: `Document reverted to version from ${new Date(version.timestamp).toLocaleString()}`
              },
              ...updatedDoc.versions
            ]
          }
        }
      });
    }
  } catch (error) {
    console.error(`Failed to revert document ${docId} to version ${versionId}:`, error);
    throw new Error('Failed to revert document. Snapshot may not exist.');
  }
};

/**
 * Helper functions
 */

// Calculate document size in bytes
function calculateDocumentSize(document: Partial<KnowledgeDocument>): number {
  // For text content, use character length as approximate byte size
  const contentSize = document.content ? Buffer.from(document.content).length : 0;
  const titleSize = document.title ? Buffer.from(document.title).length : 0;
  const tagsSize = document.tags ? JSON.stringify(document.tags).length : 0;
  
  return contentSize + titleSize + tagsSize;
}

// Simulate processing delay
function simulateProcessingDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate summary of changes between versions
function generateChangeSummary(
  original: KnowledgeDocument, 
  updates: Partial<Pick<KnowledgeDocument, 'title' | 'content' | 'tags'>>
): string {
  const changes: string[] = [];
  
  if (updates.title && updates.title !== original.title) {
    changes.push(`Title changed from "${original.title}" to "${updates.title}"`);
  }
  
  if (updates.content && updates.content !== original.content) {
    const originalLength = original.content.length;
    const newLength = updates.content.length;
    const diffPercent = Math.abs(100 * (newLength - originalLength) / originalLength);
    
    if (diffPercent < 5) {
      changes.push('Minor content edits');
    } else if (diffPercent < 20) {
      changes.push(`Content modified (${diffPercent.toFixed(0)}% change)`);
    } else {
      changes.push(`Major content revision (${diffPercent.toFixed(0)}% change)`);
    }
  }
  
  if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(original.tags)) {
    const added = updates.tags.filter(tag => !original.tags.includes(tag));
    const removed = original.tags.filter(tag => !updates.tags.includes(tag));
    
    if (added.length) {
      changes.push(`Added tags: ${added.join(', ')}`);
    }
    
    if (removed.length) {
      changes.push(`Removed tags: ${removed.join(', ')}`);
    }
  }
  
  return changes.length ? changes.join('; ') : 'No significant changes';
}

// Find knowledge base containing a document
function findBaseContainingDocument(docId: string): string | null {
  const { bases } = knowledgeStore.getState().current;
  
  for (const [baseId, base] of Object.entries(bases)) {
    if (base.documents.includes(docId)) {
      return baseId;
    }
  }
  
  return null;
}

// Count occurrences of a substring in text
function countOccurrences(text: string, subtext: string): number {
  if (!subtext) return 0;
  
  let count = 0;
  let position = text.indexOf(subtext);
  
  while (position !== -1) {
    count++;
    position = text.indexOf(subtext, position + 1);
  }
  
  return count;
}

/**
 * Create adaptive knowledge stack component
 * @param KnowledgeStackComponent Component to enhance
 * @returns Enhanced component with evolution capabilities
 */
export const createAdaptiveKnowledgeStack = (KnowledgeStackComponent: React.ComponentType<any>) => {
  return withAdaptiveEvolution(
    KnowledgeStackComponent,
    'knowledgeStack',
    evolutionManager,
    true
  );
};
