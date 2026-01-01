// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RealEstateToken.sol";

contract Distribution is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE"); // Asset Manager

    RealEstateToken public realEstateToken;
    IERC20 public usdc;

    // TokenID => Total Rent Distributed (in USDC units)
    mapping(uint256 => uint256) public totalRentDistributed;
    
    // TokenID => User => Amount withdrawn
    mapping(uint256 => mapping(address => uint256)) public rentWithdrawn;

    event RentDeposited(uint256 indexed tokenId, uint256 amount);
    event RentClaimed(address indexed user, uint256 indexed tokenId, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin, address _realEstateToken, address _usdc) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(DISTRIBUTOR_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);

        realEstateToken = RealEstateToken(_realEstateToken);
        usdc = IERC20(_usdc);
    }

    // Admin deposits rent for a specific property (Token ID) used for that period
    // In a real scenario, we might use snapshots (ERC1155Snapshot) or dividend-paying token standards for precision.
    // Simplifying here: Rent is deposited, and users claim based on current holdings.
    // NOTE: This simplified model assumes holdings don't change frequently during claim period or accepts that current holder gets it.
    // For production, use "Scaled Dividend Balance" pattern.
    // Here we will use a "Snapshot-like" push approach or simplified claim for the MVP:
    // Better MVP approach: Record `cumulativeRentPerToken`.
    
    // Improved Logic:
    // totalRentPerToken[tokenId] += deposit / totalSupply
    // userClaimable = (totalRentPerToken[tokenId] - userLastClaimedRentPerToken[tokenId][user]) * balance
    // This requires tracking balance changes which is complex in vanilla ERC1155 without hooking every transfer in Distribution contract.
    
    // For this MVP, we will stick to a simpler model:
    // Admin deposits rent. It's allocated to current holders off-chain or via a snapshot.
    // Let's implement the 'Deposit' function, and rely on the off-chain engine to calculate shares and call 'distribute' or 'allowClaim'.
    
    // Hybrid Approach: 
    // 1. Admin deposits USDC to this contract.
    // 2. Admin (Backend) calculates amounts per user off-chain (gas efficient).
    // 3. Admin calls batchTransfer or sets a Merkle Root for users to claim.
    
    // Let's go with Merkle Drop style for gas effiency? Or simple Admin Payout?
    // User asked for "User claims Rent".
    // Let's go with: Admin sets claimable amount for user.
    
    mapping(address => mapping(uint256 => uint256)) public claimableBalance; // User => TokenID => Amount claimable

    function depositRent(uint256 tokenId, uint256 amount) external onlyRole(DISTRIBUTOR_ROLE) {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        totalRentDistributed[tokenId] += amount;
        emit RentDeposited(tokenId, amount);
    }

    // Asset Manager calculates and allocates rent to users for a specific property
    function allocateRent(uint256 tokenId, address[] calldata recipients, uint256[] calldata amounts) external onlyRole(DISTRIBUTOR_ROLE) {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            claimableBalance[recipients[i]][tokenId] += amounts[i];
        }
    }

    function claimRent(uint256 tokenId) external {
        uint256 amount = claimableBalance[msg.sender][tokenId];
        require(amount > 0, "No rent to claim for this property");
        
        claimableBalance[msg.sender][tokenId] = 0;
        rentWithdrawn[tokenId][msg.sender] += amount;
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit RentClaimed(msg.sender, tokenId, amount);
    }

    function claimAllRent(uint256[] calldata tokenIds) external {
        uint256 totalToClaim = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 amount = claimableBalance[msg.sender][tokenIds[i]];
            if (amount > 0) {
                claimableBalance[msg.sender][tokenIds[i]] = 0;
                rentWithdrawn[tokenIds[i]][msg.sender] += amount;
                totalToClaim += amount;
                emit RentClaimed(msg.sender, tokenIds[i], amount);
            }
        }
        require(totalToClaim > 0, "No rent to claim");
        require(usdc.transfer(msg.sender, totalToClaim), "Transfer failed");
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
