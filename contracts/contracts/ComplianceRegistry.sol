// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ComplianceRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");

    // Mapping from user address to KYC status status (true = verified)
    mapping(address => bool) public isVerified;
    
    // Mapping from address to Country Code (ISO 3166-1 alpha-2, e.g., "US", "NG")
    mapping(address => string) public investorCountry;

    event IdentityVerified(address indexed account, string country);
    event IdentityRevoked(address indexed account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(COMPLIANCE_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    function updateIdentity(address _investor, bool _status, string memory _country) public onlyRole(COMPLIANCE_ADMIN_ROLE) {
        isVerified[_investor] = _status;
        if (_status) {
            investorCountry[_investor] = _country;
            emit IdentityVerified(_investor, _country);
        } else {
            delete investorCountry[_investor];
            emit IdentityRevoked(_investor);
        }
    }

    function batchUpdateIdentity(address[] calldata _investors, bool[] calldata _statuses, string[] calldata _countries) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(_investors.length == _statuses.length && _statuses.length == _countries.length, "Length mismatch");
        for (uint256 i = 0; i < _investors.length; i++) {
            updateIdentity(_investors[i], _statuses[i], _countries[i]);
        }
    }

    function checkCompliance(address _investor) external view returns (bool) {
        return isVerified[_investor];
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override {}
}
