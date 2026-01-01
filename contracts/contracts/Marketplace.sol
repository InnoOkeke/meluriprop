// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RealEstateToken.sol";

contract Marketplace is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    RealEstateToken public realEstateToken;
    IERC20 public usdc;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerShare; // In USDC units
        bool isActive;
    }

    // Listing ID => Listing
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin, address _realEstateToken, address _usdc) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);

        realEstateToken = RealEstateToken(_realEstateToken);
        usdc = IERC20(_usdc);
        nextListingId = 1;
    }

    function createListing(uint256 tokenId, uint256 amount, uint256 pricePerShare) external {
        require(realEstateToken.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(realEstateToken.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        listings[nextListingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerShare: pricePerShare,
            isActive: true
        });

        emit ListingCreated(nextListingId, msg.sender, tokenId, amount, pricePerShare);
        nextListingId++;
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.isActive, "Not active");

        listing.isActive = false;
        emit ListingCancelled(listingId);
    }

    function buyListing(uint256 listingId, uint256 amount) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Not active");
        require(listing.amount >= amount, "Not enough quantity");

        uint256 totalPrice = amount * listing.pricePerShare;

        // Note: We transfer the property token FIRST. 
        // If this fails (e.g. buyer is not KYC verified), the transaction reverts,
        // and no USDC is transferred.
        
        // 1. Transfer Token from Seller to Buyer
        // Seller must have approved Marketplace via setApprovalForAll
        realEstateToken.safeTransferFrom(listing.seller, msg.sender, listing.tokenId, amount, "");

        // 2. Transfer USDC from Buyer to Seller
        // Buyer must have approved Marketplace to spend USDC
        require(usdc.transferFrom(msg.sender, listing.seller, totalPrice), "Payment failed");

        // 3. Update Listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }

        emit ListingSold(listingId, msg.sender, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
