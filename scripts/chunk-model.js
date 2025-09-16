#!/usr/bin/env node

/**
 * Model Chunking Script for Client-Side Transformer Models
 * 
 * This script takes a model file (ONNX) and splits it into smaller chunks
 * for efficient loading in the browser.
 * 
 * Usage:
 *   node chunk-model.js <input-model-file> <output-chunk-dir>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default chunk size: 4MB
const CHUNK_SIZE = 4 * 1024 * 1024;

// Parse command line arguments
const inputFile = process.argv[2];
const outputDir = process.argv[3];

if (!inputFile || !outputDir) {
  console.error('Usage: node chunk-model.js <input-model-file> <output-chunk-dir>');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the model file
console.log(`Reading model file: ${inputFile}`);
const modelBuffer = fs.readFileSync(inputFile);
const modelSize = modelBuffer.length;
console.log(`Model size: ${(modelSize / (1024 * 1024)).toFixed(2)} MB`);

// Split the model into chunks
console.log(`Splitting model into chunks (${CHUNK_SIZE / (1024 * 1024)} MB each)...`);
const chunks = [];
let position = 0;

while (position < modelSize) {
  const chunkEnd = Math.min(position + CHUNK_SIZE, modelSize);
  const chunk = modelBuffer.slice(position, chunkEnd);
  chunks.push(chunk);
  position = chunkEnd;
}

console.log(`Created ${chunks.length} chunks`);

// Write chunks to files
chunks.forEach((chunk, index) => {
  const chunkFilename = path.join(outputDir, `chunk_${String(index).padStart(5, '0')}.bin`);
  fs.writeFileSync(chunkFilename, chunk);
});

// Create a manifest file with chunk information
const manifest = {
  originalFile: path.basename(inputFile),
  originalSize: modelSize,
  chunkSize: CHUNK_SIZE,
  chunks: chunks.map((chunk, index) => ({
    filename: `chunk_${String(index).padStart(5, '0')}.bin`,
    size: chunk.length,
    hash: crypto.createHash('sha256').update(chunk).digest('hex')
  })),
  totalChunks: chunks.length,
  createdAt: new Date().toISOString()
};

const manifestPath = path.join(outputDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Successfully chunked model into ${chunks.length} pieces`);
console.log(`Manifest created at: ${manifestPath}`);
