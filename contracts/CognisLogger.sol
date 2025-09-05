// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CognisLogger
 * @dev Smart contract for logging Cognis Digital AI agent interactions and events
 */
contract CognisLogger is Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event AgentInteraction(
        address indexed user,
        uint256 indexed agentId,
        string action,
        string metadata,
        uint256 timestamp
    );
    
    event KnowledgeBaseUpdate(
        address indexed user,
        uint256 indexed kbId,
        string action,
        string metadata,
        uint256 timestamp
    );
    
    event LeadGeneration(
        address indexed user,
        uint256 indexed leadId,
        string company,
        uint256 score,
        uint256 timestamp
    );
    
    event SubscriptionUpdate(
        address indexed user,
        string tier,
        uint256 timestamp
    );

    // Structs
    struct InteractionLog {
        address user;
        uint256 agentId;
        string action;
        string metadata;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    struct KnowledgeLog {
        address user;
        uint256 kbId;
        string action;
        string metadata;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // State variables
    mapping(uint256 => InteractionLog) public interactions;
    mapping(uint256 => KnowledgeLog) public knowledgeUpdates;
    mapping(address => uint256) public userInteractionCount;
    mapping(address => uint256) public userKnowledgeCount;
    
    uint256 public totalInteractions;
    uint256 public totalKnowledgeUpdates;
    uint256 public logFee = 0.001 ether; // Small fee to prevent spam
    
    // Modifiers
    modifier validUser() {
        require(msg.sender != address(0), "Invalid user address");
        _;
    }
    
    modifier paidFee() {
        require(msg.value >= logFee, "Insufficient fee");
        _;
    }

    constructor() {
        // Contract is deployed and ready
    }

    /**
     * @dev Log an AI agent interaction
     * @param agentId The ID of the AI agent
     * @param action The action performed
     * @param metadata Additional metadata about the interaction
     */
    function logAgentInteraction(
        uint256 agentId,
        string calldata action,
        string calldata metadata
    ) external payable validUser paidFee whenNotPaused nonReentrant {
        uint256 interactionId = totalInteractions++;
        
        interactions[interactionId] = InteractionLog({
            user: msg.sender,
            agentId: agentId,
            action: action,
            metadata: metadata,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        userInteractionCount[msg.sender]++;
        
        emit AgentInteraction(
            msg.sender,
            agentId,
            action,
            metadata,
            block.timestamp
        );
    }

    /**
     * @dev Log a knowledge base update
     * @param kbId The ID of the knowledge base
     * @param action The action performed
     * @param metadata Additional metadata about the update
     */
    function logKnowledgeUpdate(
        uint256 kbId,
        string calldata action,
        string calldata metadata
    ) external payable validUser paidFee whenNotPaused nonReentrant {
        uint256 updateId = totalKnowledgeUpdates++;
        
        knowledgeUpdates[updateId] = KnowledgeLog({
            user: msg.sender,
            kbId: kbId,
            action: action,
            metadata: metadata,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        userKnowledgeCount[msg.sender]++;
        
        emit KnowledgeBaseUpdate(
            msg.sender,
            kbId,
            action,
            metadata,
            block.timestamp
        );
    }

    /**
     * @dev Log lead generation event
     * @param leadId The ID of the generated lead
     * @param company The company name
     * @param score The lead score
     */
    function logLeadGeneration(
        uint256 leadId,
        string calldata company,
        uint256 score
    ) external payable validUser paidFee whenNotPaused nonReentrant {
        emit LeadGeneration(
            msg.sender,
            leadId,
            company,
            score,
            block.timestamp
        );
    }

    /**
     * @dev Log subscription tier update
     * @param tier The new subscription tier
     */
    function logSubscriptionUpdate(
        string calldata tier
    ) external payable validUser paidFee whenNotPaused nonReentrant {
        emit SubscriptionUpdate(
            msg.sender,
            tier,
            block.timestamp
        );
    }

    /**
     * @dev Batch log multiple interactions (gas efficient)
     * @param agentIds Array of agent IDs
     * @param actions Array of actions
     * @param metadataArray Array of metadata strings
     */
    function batchLogInteractions(
        uint256[] calldata agentIds,
        string[] calldata actions,
        string[] calldata metadataArray
    ) external payable validUser whenNotPaused nonReentrant {
        require(
            agentIds.length == actions.length && 
            actions.length == metadataArray.length,
            "Array lengths must match"
        );
        require(msg.value >= logFee * agentIds.length, "Insufficient fee for batch");
        
        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 interactionId = totalInteractions++;
            
            interactions[interactionId] = InteractionLog({
                user: msg.sender,
                agentId: agentIds[i],
                action: actions[i],
                metadata: metadataArray[i],
                timestamp: block.timestamp,
                blockNumber: block.number
            });
            
            emit AgentInteraction(
                msg.sender,
                agentIds[i],
                actions[i],
                metadataArray[i],
                block.timestamp
            );
        }
        
        userInteractionCount[msg.sender] += agentIds.length;
    }

    /**
     * @dev Get interaction details by ID
     * @param interactionId The interaction ID
     */
    function getInteraction(uint256 interactionId) 
        external 
        view 
        returns (InteractionLog memory) 
    {
        require(interactionId < totalInteractions, "Interaction does not exist");
        return interactions[interactionId];
    }

    /**
     * @dev Get knowledge update details by ID
     * @param updateId The update ID
     */
    function getKnowledgeUpdate(uint256 updateId) 
        external 
        view 
        returns (KnowledgeLog memory) 
    {
        require(updateId < totalKnowledgeUpdates, "Update does not exist");
        return knowledgeUpdates[updateId];
    }

    /**
     * @dev Get user statistics
     * @param user The user address
     */
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 interactions, uint256 knowledgeUpdates) 
    {
        return (userInteractionCount[user], userKnowledgeCount[user]);
    }

    // Admin functions
    function setLogFee(uint256 _newFee) external onlyOwner {
        logFee = _newFee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Emergency function to update contract if needed
    function emergencyWithdraw() external onlyOwner {
        selfdestruct(payable(owner()));
    }
}