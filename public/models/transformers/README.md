# Transformer Models Directory

This directory contains client-side transformer models in ONNX format that can be loaded directly in the browser using ONNX Runtime Web.

## Directory Structure

```
models/transformers/
├── cognis-tiny-transformer/
│   ├── model.onnx           # Main model file
│   ├── tokenizer.json       # Tokenizer configuration
│   └── config.json          # Model configuration
├── cognis-small-transformer/
│   ├── model.onnx
│   ├── tokenizer.json
│   └── config.json
└── cognis-research-assistant/
    ├── model.onnx
    ├── tokenizer.json
    └── config.json
```

## Model Formats

- **ONNX**: Open Neural Network Exchange format, compatible with ONNX Runtime Web
- **Tokenizer**: JSON configuration for tokenizing input text
- **Config**: Model configuration parameters

## Adding New Models

To add a new model:

1. Create a directory with the model ID
2. Export your PyTorch/TensorFlow model to ONNX format
3. Add the model, tokenizer, and config files
4. Update the model registry in `src/config/transformerModels.ts`

## Converting Models to ONNX

Example script using PyTorch:

```python
import torch
from transformers import AutoTokenizer, AutoModel

model_id = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModel.from_pretrained(model_id)

# Export to ONNX
dummy_input = tokenizer("Hello, world!", return_tensors="pt")["input_ids"]
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=12,
    input_names=["input_ids"],
    output_names=["logits"],
    dynamic_axes={
        "input_ids": {0: "batch_size", 1: "sequence_length"}
    }
)
```

## Merkle Tree Verification

All models include Merkle root hashes for integrity verification. The client will verify chunks against these roots during loading.
