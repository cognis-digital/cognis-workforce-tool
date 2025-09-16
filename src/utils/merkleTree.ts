import CryptoJS from 'crypto-js';

/**
 * Implementation of a Merkle tree for model state verification
 */

export interface MerkleNode {
  hash: string;
  parent?: MerkleNode;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: Uint8Array;
  index?: number;
}

/**
 * Hash a buffer of data using SHA-256
 */
export function hashData(data: Uint8Array | string): string {
  if (typeof data === 'string') {
    return CryptoJS.SHA256(data).toString();
  }
  
  const wordArray = CryptoJS.lib.WordArray.create(data);
  return CryptoJS.SHA256(wordArray).toString();
}

/**
 * Split a buffer into chunks
 */
export function chunkBuffer(buffer: ArrayBuffer, chunkSize: number = 4 * 1024 * 1024): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const view = new Uint8Array(buffer);
  
  for (let i = 0; i < view.length; i += chunkSize) {
    const chunk = view.slice(i, Math.min(i + chunkSize, view.length));
    chunks.push(chunk);
  }
  
  return chunks;
}

/**
 * Build a Merkle tree from a list of data chunks
 */
export function buildMerkleTree(chunks: Uint8Array[]): { root: MerkleNode; nodes: MerkleNode[] } {
  if (chunks.length === 0) {
    const emptyNode: MerkleNode = { hash: hashData('') };
    return { root: emptyNode, nodes: [emptyNode] };
  }
  
  // Hash and create leaf nodes
  const leafNodes: MerkleNode[] = chunks.map((chunk, index) => ({
    hash: hashData(chunk),
    data: chunk,
    index
  }));
  
  // All nodes in the tree
  const allNodes: MerkleNode[] = [...leafNodes];
  
  // Build the tree from the bottom up
  let currentLevel = leafNodes;
  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      // If we have an odd number of nodes, duplicate the last one
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      
      const parentHash = hashData(left.hash + right.hash);
      const parent: MerkleNode = {
        hash: parentHash,
        left,
        right,
      };
      
      // Update parent references
      left.parent = parent;
      right.parent = parent;
      
      nextLevel.push(parent);
      allNodes.push(parent);
    }
    
    currentLevel = nextLevel;
  }
  
  return {
    root: currentLevel[0],
    nodes: allNodes
  };
}

/**
 * Generate a Merkle proof for a specific chunk
 */
export function generateProof(tree: MerkleNode[], chunkIndex: number): string[] {
  // Find the leaf node for the chunk
  const leafNode = tree.find(node => node.index === chunkIndex);
  if (!leafNode || !leafNode.parent) {
    return [];
  }
  
  const proof: string[] = [];
  let currentNode = leafNode;
  
  while (currentNode.parent) {
    const parent = currentNode.parent;
    const isLeft = parent.left === currentNode;
    
    // Add the sibling hash to the proof
    if (isLeft && parent.right) {
      proof.push(parent.right.hash);
    } else if (!isLeft && parent.left) {
      proof.push(parent.left.hash);
    }
    
    currentNode = parent;
  }
  
  return proof;
}

/**
 * Verify a chunk using a Merkle proof
 */
export function verifyProof(
  chunkHash: string,
  proof: string[],
  root: string,
  index: number
): boolean {
  let currentHash = chunkHash;
  
  for (let i = 0; i < proof.length; i++) {
    const isLeft = index % 2 === 0;
    const siblingHash = proof[i];
    
    // Combine the hashes in the correct order
    currentHash = isLeft
      ? hashData(currentHash + siblingHash)
      : hashData(siblingHash + currentHash);
    
    // Move up one level in the tree
    index = Math.floor(index / 2);
  }
  
  return currentHash === root;
}

/**
 * Calculate the differences between two Merkle trees
 */
export function calculateDiff(localTree: MerkleNode[], remoteTree: MerkleNode[]): number[] {
  const localLeaves = localTree.filter(node => node.data !== undefined);
  const remoteLeaves = remoteTree.filter(node => node.data !== undefined);
  
  const missingIndices: number[] = [];
  
  // Find chunks that are missing or have different hashes
  for (let i = 0; i < remoteLeaves.length; i++) {
    const remoteLeaf = remoteLeaves[i];
    const localLeaf = localLeaves.find(leaf => leaf.index === remoteLeaf.index);
    
    if (!localLeaf || localLeaf.hash !== remoteLeaf.hash) {
      missingIndices.push(remoteLeaf.index!);
    }
  }
  
  return missingIndices;
}

/**
 * Recreate a file from chunks using IndexedDB
 */
export async function storeModelChunks(
  modelId: string,
  chunks: Uint8Array[],
  merkleRoot: string
): Promise<void> {
  // Open or create IndexedDB database
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransformerModels', 1);
    
    request.onerror = (event) => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('modelChunks')) {
        db.createObjectStore('modelChunks', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('modelMetadata')) {
        db.createObjectStore('modelMetadata', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['modelChunks', 'modelMetadata'], 'readwrite');
      
      // Store each chunk in IndexedDB
      const chunkStore = transaction.objectStore('modelChunks');
      for (let i = 0; i < chunks.length; i++) {
        chunkStore.put({
          id: `${modelId}_chunk_${i}`,
          data: chunks[i],
          index: i
        });
      }
      
      // Store model metadata
      const metadataStore = transaction.objectStore('modelMetadata');
      metadataStore.put({
        id: modelId,
        merkleRoot,
        chunkCount: chunks.length,
        timestamp: Date.now()
      });
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error('Failed to store model chunks'));
      };
    };
  });
}

/**
 * Load a model from IndexedDB and verify integrity using Merkle root
 */
export async function loadModelChunks(modelId: string, merkleRoot: string): Promise<ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TransformerModels', 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // First, verify the model metadata
      try {
        const metadataTransaction = db.transaction(['modelMetadata'], 'readonly');
        const metadataStore = metadataTransaction.objectStore('modelMetadata');
        const metadataRequest = metadataStore.get(modelId);
        
        await new Promise<void>((resolveMetadata, rejectMetadata) => {
          metadataRequest.onsuccess = () => {
            if (!metadataRequest.result || metadataRequest.result.merkleRoot !== merkleRoot) {
              rejectMetadata(new Error('Model metadata not found or merkle root mismatch'));
            } else {
              resolveMetadata();
            }
          };
          
          metadataRequest.onerror = () => {
            rejectMetadata(new Error('Failed to fetch model metadata'));
          };
        });
        
        // Load all chunks
        const chunksTransaction = db.transaction(['modelChunks'], 'readonly');
        const chunkStore = chunksTransaction.objectStore('modelChunks');
        const chunks: Uint8Array[] = [];
        
        // Use a cursor to iterate through all chunks for this model
        const cursorRequest = chunkStore.openCursor();
        
        await new Promise<void>((resolveChunks, rejectChunks) => {
          cursorRequest.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
              const key = cursor.key as string;
              if (key.startsWith(`${modelId}_chunk_`)) {
                chunks.push(cursor.value.data);
              }
              cursor.continue();
            } else {
              // Sort chunks by index
              chunks.sort((a, b) => {
                const indexA = parseInt(a.toString().split('_')[2]);
                const indexB = parseInt(b.toString().split('_')[2]);
                return indexA - indexB;
              });
              
              // Concatenate chunks into a single ArrayBuffer
              const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const result = new Uint8Array(totalLength);
              
              let offset = 0;
              for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
              }
              
              // Verify the Merkle root
              const { root } = buildMerkleTree(chunks);
              if (root.hash !== merkleRoot) {
                rejectChunks(new Error('Merkle root verification failed'));
              } else {
                resolveChunks();
              }
              
              resolve(result.buffer);
            }
          };
          
          cursorRequest.onerror = () => {
            rejectChunks(new Error('Failed to load model chunks'));
          };
        });
      } catch (error) {
        reject(error);
      }
    };
  });
}
