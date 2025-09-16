/**
 * WASM Testing Utilities
 * Helps verify WASM functionality in the browser environment
 */

/**
 * Tests if WebAssembly is supported in the current environment
 */
export function testWasmSupport(): {
  supported: boolean;
  features: Record<string, boolean>;
  message: string;
} {
  // Initial result
  const result = {
    supported: false,
    features: {
      wasm: false,
      wasmStreaming: false,
      sharedArrayBuffer: false,
      threads: false,
      simd: false,
      bigInt: false
    },
    message: ''
  };

  try {
    // Check basic WebAssembly support
    result.features.wasm = typeof WebAssembly === 'object';
    
    // Check for streaming compilation support
    result.features.wasmStreaming = typeof WebAssembly.instantiateStreaming === 'function';
    
    // Check for SharedArrayBuffer support (needed for threading)
    result.features.sharedArrayBuffer = typeof SharedArrayBuffer === 'function';
    
    // Check for BigInt support (needed for some operations)
    result.features.bigInt = typeof BigInt === 'function';
    
    // Check for threads support
    if (result.features.sharedArrayBuffer) {
      const test = new SharedArrayBuffer(1);
      result.features.threads = test.byteLength === 1;
    }
    
    // Determine overall support
    const requiredFeatures = ['wasm', 'bigInt']; // Minimum required features
    const hasRequiredFeatures = requiredFeatures.every(feature => result.features[feature]);
    
    result.supported = hasRequiredFeatures;
    
    // Generate message
    if (result.supported) {
      result.message = 'WebAssembly is supported in this environment';
      if (result.features.threads) {
        result.message += ' with threading support';
      } else {
        result.message += ' but without threading support (performance may be limited)';
      }
    } else {
      const missing = requiredFeatures.filter(feature => !result.features[feature]);
      result.message = `WebAssembly support incomplete. Missing: ${missing.join(', ')}`;
    }
    
    return result;
  } catch (err) {
    return {
      supported: false,
      features: result.features,
      message: `Error testing WASM support: ${err.message}`
    };
  }
}

/**
 * Tests WebAssembly memory access
 */
export async function testWasmMemory(): Promise<{success: boolean; message: string}> {
  try {
    if (typeof WebAssembly !== 'object') {
      return {
        success: false,
        message: 'WebAssembly not available in this environment'
      };
    }
    
    // Simple WASM module that exports a memory and a function to write to it
    const wasmCode = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM header
      0x01, 0x07, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f, // Type section: (i32) -> i32
      0x03, 0x02, 0x01, 0x00,                         // Function section
      0x05, 0x03, 0x01, 0x00, 0x01,                   // Memory section: 1 page
      0x07, 0x0a, 0x01, 0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, 0x02, 0x00, // Export section: "memory"
      0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x41, 0x2a, 0x36, 0x02, 0x0b  // Code section: store 42 at address in param
    ]);
    
    // Instantiate the WASM module
    const module = await WebAssembly.instantiate(wasmCode);
    const memory = module.instance.exports.memory as WebAssembly.Memory;
    
    // Check if we can access the memory
    const view = new Uint32Array(memory.buffer);
    view[0] = 42;
    
    return {
      success: true,
      message: 'WebAssembly memory access successful'
    };
  } catch (err) {
    return {
      success: false,
      message: `WebAssembly memory test failed: ${err.message}`
    };
  }
}

/**
 * Test ONNX runtime initialization
 * This requires the onnxruntime-web package to be installed
 */
export async function testOnnxRuntime(): Promise<{success: boolean; message: string}> {
  try {
    // Dynamic import to avoid issues if the package is not available
    const ort = await import('onnxruntime-web');
    
    // Try initializing a session with a tiny model
    const tensor = new ort.Tensor('float32', new Float32Array([1, 2, 3, 4]), [2, 2]);
    
    return {
      success: true,
      message: `ONNX Runtime initialized successfully (version ${ort.env?.version || 'unknown'})`
    };
  } catch (err) {
    return {
      success: false,
      message: `ONNX Runtime initialization failed: ${err.message}`
    };
  }
}
