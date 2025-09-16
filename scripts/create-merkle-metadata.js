#!/usr/bin/env node

/**
 * Merkle Metadata Generator for Client-Side Transformer Models
 * 
 * This script takes a model file (ONNX) and generates Merkle metadata
 * for verifying model integrity during client-side loading.
 * 
 * Usage:
 *   node create-merkle-metadata.js <input-model-file> <output-metadata-file>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default chunk size: 4MB
const CHUNK_SIZE = 4 * 1024 * 1024;

// Parse command line arguments
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node create-merkle-metadata.js <input-model-file> <output-metadata-file>');
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Hash a buffer using SHA-256
function hashData(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Split a buffer into chunks
function chunkBuffer(buffer, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let position = 0;
  
  while (position < buffer.length) {
    const chunkEnd = Math.min(position + chunkSize, buffer.length);
    const chunk = buffer.slice(position, chunkEnd);
    chunks.push(chunk);
    position = chunkEnd;
  }
  
  return chunks;
}

// Build a Merkle tree from chunks
function buildMerkleTree(chunks) {
  // Hash and create leaf nodes
  const leafNodes = chunks.map((chunk, index) => ({
    hash: hashData(chunk),
    index
  }));
  
  // All nodes in the tree
  const allNodes = [...leafNodes];
  
  // Build the tree from the bottom up
  let currentLevel = leafNodes;
  while (currentLevel.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      // If we have an odd number of nodes, duplicate the last one
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      
      const parentHash = hashData(left.hash + right.hash);
      const parent = {
        hash: parentHash,
      };
      
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

// Generate proof for a chunk
function generateProof(tree, chunkIndex) {
  // Find the leaf node
  const leafNode = tree.nodes.find(node => node.index === chunkIndex);
  if (!leafNode) return [];
  
  // Get siblings up the tree
  const proof = [];
  let currentIndex = chunkIndex;
  let level = 0;
  let levelSize = tree.leaves.length;
  
  while (levelSize > 1) {
    const isLeft = currentIndex % 2 === 0;
    const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
    
    // If we're at the edge of the level and there's an odd number of nodes
    if (isLeft && siblingIndex >= levelSize) {
      // No sibling, use self
      proof.push(tree.nodes[currentIndex + level * levelSize].hash);
    } else {
      proof.push(tree.nodes[siblingIndex + level * levelSize].hash);
    }
    
    // Move up the tree
    currentIndex = Math.floor(currentIndex / 2);
    level++;
    levelSize = Math.ceil(levelSize / 2);
  }
  
  return proof;
}

// Read the model file
console.log(`Reading model file: ${inputFile}`);
const modelBuffer = fs.readFileSync(inputFile);
const modelSize = modelBuffer.length;
console.log(`Model size: ${(modelSize / (1024 * 1024)).toFixed(2)} MB`);

// Split the model into chunks
console.log(`Splitting model into chunks (${CHUNK_SIZE / (1024 * 1024)} MB each)...`);
const chunks = chunkBuffer(modelBuffer);
console.log(`Created ${chunks.length} chunks`);

// Build the Merkle tree
console.log('Building Merkle tree...');
const { root, nodes } = buildMerkleTree(chunks);
const merkleRoot = root.hash;

// Create metadata
const metadata = {
  originalFile: path.basename(inputFile),
  originalSize: modelSize,
  merkleRoot,
  chunkSize: CHUNK_SIZE,
  chunksCount: chunks.length,
  hashes: chunks.map(chunk => hashData(chunk)),
  createdAt: new Date().toISOString()
};

// Write metadata to file
fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));

console.log(`Successfully created Merkle metadata for model`);
console.log(`Merkle root: ${merkleRoot}`);
console.log(`Metadata saved to: ${outputFile}`);
