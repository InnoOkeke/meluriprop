// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PropertiesRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    enum Category { Residential, Commercial, Shortlet }

    struct Property {
        string name;
        string location;
        string documentIPFS; // Link to whitepaper/legal docs
        uint256 valuation;   // In cents/wei
        uint256 targetRaise;
        uint256 totalTokens;
        Category category;
        bool isActive;
    }

    // Token ID => Property Metadata
    mapping(uint256 => Property) public properties;
    uint256 public nextTokenId;

    event PropertyRegistered(uint256 indexed tokenId, string name, uint256 targetRaise, Category category);
    event PropertyUpdated(uint256 indexed tokenId, uint256 valuation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ASSET_MANAGER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
        
        nextTokenId = 1;
    }

    function registerProperty(
        string memory _name,
        string memory _location,
        string memory _documentIPFS,
        uint256 _valuation,
        uint256 _targetRaise,
        uint256 _totalTokens,
        Category _category
    ) external onlyRole(ASSET_MANAGER_ROLE) returns (uint256) {
        uint256 tokenId = nextTokenId++;
        
        properties[tokenId] = Property({
            name: _name,
            location: _location,
            documentIPFS: _documentIPFS,
            valuation: _valuation,
            targetRaise: _targetRaise,
            totalTokens: _totalTokens,
            category: _category,
            isActive: true
        });

        emit PropertyRegistered(tokenId, _name, _targetRaise, _category);
        return tokenId;
    }

    function updateValuation(uint256 _tokenId, uint256 _newValuation) external onlyRole(ASSET_MANAGER_ROLE) {
        properties[_tokenId].valuation = _newValuation;
        emit PropertyUpdated(_tokenId, _newValuation);
    }

    function getProperty(uint256 _tokenId) external view returns (Property memory) {
        return properties[_tokenId];
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
