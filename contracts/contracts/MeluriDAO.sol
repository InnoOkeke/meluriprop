// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IComplianceRegistry {
    function isVerified(address _addr) external view returns (bool);
}

interface IRealEstateToken {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function totalUserBalance(address account) external view returns (uint256);
}

contract MeluriDAO is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IComplianceRegistry public complianceRegistry;
    IRealEstateToken public realEstateToken;

    enum PermissionType {
        Global,          // 0: All Verified Users
        AnyInvestor,     // 1: Holds ANY RealEstateToken
        SpecificHolders  // 2: Holds SPECIFIC Token ID
    }

    struct Proposal {
        uint256 id;
        string description;
        PermissionType permissionType; 
        uint256 targetTokenId; // Used only if permissionType == SpecificHolders
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool active;
        mapping(address => bool) hasVoted;
    }

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed id, string description, PermissionType permissionType, uint256 targetTokenId, uint256 endTime);
    event VoteCast(uint256 indexed id, address indexed voter, bool support);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin, 
        address _complianceRegistry, 
        address _realEstateToken
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        complianceRegistry = IComplianceRegistry(_complianceRegistry);
        realEstateToken = IRealEstateToken(_realEstateToken);
        nextProposalId = 1;
    }

    function createProposal(
        string calldata _description, 
        PermissionType _permissionType,
        uint256 _targetTokenId, 
        uint256 _durationSeconds
    ) external onlyRole(ADMIN_ROLE) {
        require(_durationSeconds > 0, "Duration must be positive");

        uint256 proposalId = nextProposalId++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.description = _description;
        p.permissionType = _permissionType;
        p.targetTokenId = _targetTokenId;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + _durationSeconds;
        p.active = true;

        emit ProposalCreated(proposalId, _description, _permissionType, _targetTokenId, p.endTime);
    }

    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage p = proposals[_proposalId];
        require(p.active, "Proposal not active");
        require(block.timestamp <= p.endTime, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        // 1. Base Compliance Check (Everyone must be KYCed)
        require(complianceRegistry.isVerified(msg.sender), "Caller not KYC verified");

        // 2. Calculate Weighted Voting Power
        uint256 weight = 0;
        if (p.permissionType == PermissionType.AnyInvestor) {
            weight = realEstateToken.totalUserBalance(msg.sender);
            require(weight > 0, "Must hold tokens to vote");
        } else if (p.permissionType == PermissionType.SpecificHolders) {
            weight = realEstateToken.balanceOf(msg.sender, p.targetTokenId);
            require(weight > 0, "Must hold specific token to vote");
        } else {
            // Global: All verified users can vote. Weight is either their total balance or 1.
            // In RWA, usually voting power is tied to economic stake regardless of type.
            weight = realEstateToken.totalUserBalance(msg.sender);
            if (weight == 0) weight = 1; // Allow non-holders to vote in Global if they are verified? 
            // Better: Global usually means "Any Verified User", but weight is still stake.
        }

        p.hasVoted[msg.sender] = true;

        if (_support) {
            p.yesVotes += weight;
        } else {
            p.noVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support);
    }

    function closeProposal(uint256 _proposalId) external onlyRole(ADMIN_ROLE) {
        proposals[_proposalId].active = false;
    }

    function getProposal(uint256 _proposalId) external view returns (
        string memory description,
        PermissionType permissionType,
        uint256 targetTokenId,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 endTime,
        bool active
    ) {
        Proposal storage p = proposals[_proposalId];
        return (
            p.description,
            p.permissionType,
            p.targetTokenId,
            p.yesVotes,
            p.noVotes,
            p.endTime,
            p.active
        );
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
