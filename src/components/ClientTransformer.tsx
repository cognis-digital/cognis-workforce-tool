import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Stack,
  Heading,
  Text,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Card,
  CardBody,
  Divider,
  Progress,
  useToast,
  IconButton,
  Tooltip,
  ButtonGroup,
} from '@chakra-ui/react';
import { TransformerModel } from '../utils/onnxModel';
import { ResearchAIConnector, ResearchQueryResult } from '../utils/researchAIConnector';
import { availableModels, getModelById } from '../config/transformerModels';
import { SearchIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';

interface ModelInfo {
  id: string;
  name: string;
  merkleRoot: string;
  description: string;
  config: {
    vocabSize: number;
    dModel: number;
    nLayers: number;
    nHeads: number;
    maxLen: number;
  };
}

const ClientTransformer: React.FC = () => {
  const [modelList, setModelList] = useState<ModelInfo[]>([]);
  const [researchConnector, setResearchConnector] = useState<ResearchAIConnector | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingMode, setTrainingMode] = useState<boolean>(false);
  const [trainingTarget, setTrainingTarget] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingLoss, setTrainingLoss] = useState<number | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<{
    canTrain: boolean;
    cpuCores: number;
    gpuAvailable: boolean;
    memoryGB?: number;
  }>({
    canTrain: false,
    cpuCores: 1,
    gpuAvailable: false
  });
  
  const modelRef = useRef<TransformerModel | null>(null);
  const toast = useToast();

  // Fetch available models on component mount
  useEffect(() => {
    fetchAvailableModels();
    checkDeviceCapabilities();
  }, []);

  // Check device capabilities for model training/inference
  const checkDeviceCapabilities = () => {
    const capabilities = {
      canTrain: false,
      cpuCores: navigator.hardwareConcurrency || 1,
      gpuAvailable: false,
      memoryGB: undefined
    };
    
    // Check for GPU support
    if ('gpu' in navigator) {
      capabilities.gpuAvailable = true;
    }
    
    // Check device memory (if supported)
    // @ts-ignore - navigator.deviceMemory is not in standard TS types
    if (navigator.deviceMemory) {
      // @ts-ignore
      capabilities.memoryGB = navigator.deviceMemory;
      capabilities.canTrain = (capabilities.memoryGB || 0) >= 4; // Require at least 4GB for training
    }
    
    setDeviceCapabilities(capabilities);
  };

  // Fetch available models
  const fetchAvailableModels = async () => {
    try {
      // Convert the models from config to UI models
      const configModels = availableModels.map(model => ({
        id: model.id,
        name: model.name,
        merkleRoot: model.merkleRoot,
        description: model.description,
        config: model.config
      }));
      
      setModelList(configModels);
      
      // Select the first model by default
      if (configModels.length > 0 && !selectedModelId) {
        setSelectedModelId(configModels[0].id);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch available models');
    }
  };

  // Handle model selection
  const handleModelSelect = async (modelId: string) => {
    if (modelId === selectedModelId && modelLoaded) {
      return;
    }
    
    setSelectedModelId(modelId);
    setModelLoaded(false);
    setOutputText('');
    setError(null);
    
    // Reset training state
    setTrainingMode(false);
    setTrainingTarget('');
    setTrainingProgress(0);
    setTrainingLoss(null);
    
    // Find the selected model
    const selectedModel = modelList.find(model => model.id === modelId);
    if (!selectedModel) {
      setError(`Model ${modelId} not found`);
      return;
    }
    
    try {
      setModelLoading(true);
      
      // Create a new model instance
      const model = new TransformerModel(selectedModel.id, selectedModel.merkleRoot);
      modelRef.current = model;
      
      // Load the model
      const success = await model.loadModel();
      if (!success) {
        throw new Error('Failed to load model');
      }
      
      // Create a research connector with this model
      const connector = new ResearchAIConnector();
      await connector.connectModel(model);
      setResearchConnector(connector);
      
      setModelLoaded(true);
      toast({
        title: 'Model loaded',
        description: `Successfully loaded ${selectedModel.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error loading model:', err);
      setError(`Failed to load model: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setModelLoading(false);
    }
  };

  // Handle input text change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // Handle sending query to Cognis Research AI
  const handleShareWithResearchAI = async () => {
    if (!researchConnector || !modelLoaded) {
      setError('Cannot connect to Research AI: Model not loaded');
      return;
    }
    
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Check if local model can handle it
      const canHandle = await researchConnector.canHandleResearchQuery(inputText);
      
      let result: ResearchQueryResult;
      if (canHandle) {
        // Process with local model first
        result = await researchConnector.processResearchQuery(inputText, {
          depth: 'comprehensive'
        });
        
        // Then enhance with server-side Research AI
        result = await researchConnector.enhanceWithResearchAI(result, 'expand');
      } else {
        // Request is too complex for local model, send directly to server
        const response = await fetch('/api/v1/research/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: inputText,
            depth: 'comprehensive'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Research API error: ${response.statusText}`);
        }
        
        result = await response.json();
      }
      
      setOutputText(result.generatedResponse);
      
      toast({
        title: 'Research analysis complete',
        description: `Processed in ${result.processingTime}ms`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (err) {
      console.error('Error with Research AI:', err);
      setError(`Research AI error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle inference request
  const handleRunInference = async () => {
    if (!modelRef.current || !modelLoaded) {
      setError('No model loaded');
      return;
    }
    
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Run inference
      const result = await modelRef.current.runInference(inputText);
      
      setOutputText(result);
    } catch (err) {
      console.error('Error during inference:', err);
      setError(`Inference error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle training step
  const handleTrainingStep = async () => {
    if (!modelRef.current || !modelLoaded) {
      setError('No model loaded');
      return;
    }
    
    if (!inputText.trim() || !trainingTarget.trim()) {
      setError('Please enter both input and target text');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // Run training step
      setTrainingProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      // Actual training call
      const loss = await modelRef.current.trainStep(inputText, trainingTarget);
      
      clearInterval(progressInterval);
      setTrainingProgress(100);
      setTrainingLoss(loss);
      
      toast({
        title: 'Training step completed',
        description: `Loss: ${loss.toFixed(4)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error during training:', err);
      setError(`Training error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Toggle between inference and training mode
  const toggleMode = () => {
    setTrainingMode(!trainingMode);
    setOutputText('');
    setTrainingLoss(null);
    setTrainingProgress(0);
  };

  return (
    <Card variant="outline" width="100%" boxShadow="md" borderRadius="lg" bg="#0f1425" color="white">
      <CardBody>
        <Stack spacing={4}>
          <Heading size="lg">Client-Side Transformer</Heading>
          <Text color="gray.300">
            Run transformer models directly in your browser using ONNX Runtime Web
          </Text>
          
          {/* Device capabilities */}
          <Box bg="#1a2036" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700">
            <Heading size="xs" mb={2}>Device Capabilities</Heading>
            <Flex wrap="wrap" gap={2}>
              <Badge colorScheme="blue">CPU: {deviceCapabilities.cpuCores} cores</Badge>
              <Badge colorScheme={deviceCapabilities.gpuAvailable ? 'green' : 'gray'}>
                GPU: {deviceCapabilities.gpuAvailable ? 'Available' : 'Not available'}
              </Badge>
              {deviceCapabilities.memoryGB !== undefined && (
                <Badge colorScheme="purple">Memory: {deviceCapabilities.memoryGB} GB</Badge>
              )}
              <Badge colorScheme={deviceCapabilities.canTrain ? 'green' : 'red'}>
                Training: {deviceCapabilities.canTrain ? 'Supported' : 'Not supported'}
              </Badge>
            </Flex>
          </Box>
          
          {/* Model selection */}
          <FormControl>
            <FormLabel>Select Model</FormLabel>
            <Select
              value={selectedModelId}
              onChange={(e) => handleModelSelect(e.target.value)}
              isDisabled={modelLoading || processing}
            >
              {modelList.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
          </FormControl>
          
          {/* Selected model info */}
          {selectedModelId && (
            <Box bg="#1a2036" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700">
              {modelLoading ? (
                <Flex justify="center" align="center" py={4}>
                  <Spinner mr={3} />
                  <Text>Loading model...</Text>
                </Flex>
              ) : (
                <>
                  <Heading size="xs" mb={2}>Model Information</Heading>
                  {modelList.filter(model => model.id === selectedModelId).map((model) => (
                    <Stack key={model.id} spacing={1}>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="bold">ID:</Text> {model.id}
                      </Text>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="bold">Description:</Text> {model.description}
                      </Text>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="bold">Architecture:</Text> {model.config.nLayers} layers, 
                        {model.config.dModel}d, {model.config.nHeads} heads
                      </Text>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="bold">Merkle Root:</Text> {model.merkleRoot.substring(0, 10)}...
                      </Text>
                      <Text fontSize="sm" color={modelLoaded ? 'green.400' : 'orange.400'} fontWeight="bold">
                        Status: {modelLoaded ? 'Loaded' : 'Not Loaded'}
                      </Text>
                    </Stack>
                  ))}
                </>
              )}
            </Box>
          )}
          
          {/* Mode toggle */}
          <Flex justify="center" mt={2}>
            <Button
              size="sm"
              colorScheme={trainingMode ? 'purple' : 'blue'}
              onClick={toggleMode}
              isDisabled={!modelLoaded || processing}
            >
              {trainingMode ? 'Switch to Inference Mode' : 'Switch to Training Mode'}
            </Button>
          </Flex>
          
          <Divider />
          
          {/* Input form */}
          <FormControl>
            <FormLabel>{trainingMode ? 'Training Input' : 'Input Text'}</FormLabel>
            <Textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder={trainingMode ? 'Enter training input text...' : 'Enter text for the model to process...'}
              height="100px"
              isDisabled={!modelLoaded || processing}
            />
          </FormControl>
          
          {/* Training target (only shown in training mode) */}
          {trainingMode && (
            <FormControl>
              <FormLabel>Target Output</FormLabel>
              <Textarea
                value={trainingTarget}
                onChange={(e) => setTrainingTarget(e.target.value)}
                placeholder="Enter expected output text..."
                height="100px"
                isDisabled={!modelLoaded || processing}
              />
            </FormControl>
          )}
          
          {/* Process buttons */}
          <ButtonGroup spacing={3} width="100%">
            <Button
              colorScheme={trainingMode ? 'purple' : 'blue'}
              onClick={trainingMode ? handleTrainingStep : handleRunInference}
              isLoading={processing}
              isDisabled={!modelLoaded || processing}
              loadingText={trainingMode ? 'Training' : 'Processing'}
              flex={1}
            >
              {trainingMode ? 'Run Training Step' : 'Run Inference'}
            </Button>
            
            <Tooltip label="Analyze with Cognis Research AI">
              <IconButton
                aria-label="Analyze with Research AI"
                icon={<SearchIcon />}
                colorScheme="teal"
                onClick={handleShareWithResearchAI}
                isDisabled={!modelLoaded || processing}
                isLoading={processing}
              />
            </Tooltip>
          </ButtonGroup>
          
          {/* Training progress */}
          {trainingMode && processing && (
            <Box>
              <Text mb={1}>Training progress:</Text>
              <Progress value={trainingProgress} size="sm" colorScheme="purple" />
            </Box>
          )}
          
          {/* Error display */}
          {error && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Output section */}
          {outputText && !trainingMode && (
            <Box>
              <FormLabel>Output</FormLabel>
              <Box
                p={3}
                borderWidth={1}
                borderRadius="md"
                borderColor="blue.500"
                bg="#1a2036"
              >
                <Text whiteSpace="pre-wrap">{outputText}</Text>
              </Box>
            </Box>
          )}
          
          {/* Training results */}
          {trainingMode && trainingLoss !== null && (
            <Box>
              <FormLabel>Training Results</FormLabel>
              <Box
                p={3}
                borderWidth={1}
                borderRadius="md"
                borderColor="purple.500"
                bg="#1a2036"
              >
                <Text><strong>Loss:</strong> {trainingLoss.toFixed(6)}</Text>
                <Text fontSize="sm" mt={2} color="gray.600">
                  Note: The model is trained locally in your browser. For better results, use server-side training.
                </Text>
              </Box>
            </Box>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ClientTransformer;
