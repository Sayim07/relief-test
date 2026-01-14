// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReliefToken
 * @dev Stablecoin contract for disaster relief distribution
 * This contract manages beneficiary whitelisting and category-based spending limits
 */
contract ReliefToken is ERC20, Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DONOR_ROLE = keccak256("DONOR_ROLE");
    bytes32 public constant BENEFICIARY_ROLE = keccak256("BENEFICIARY_ROLE");
    bytes32 public constant RELIEF_PARTNER_ROLE = keccak256("RELIEF_PARTNER_ROLE");
    // Beneficiary information
    struct Beneficiary {
        bool isWhitelisted;
        uint256 totalReceived;
        mapping(string => uint256) categoryLimits; // Category => max spending limit
        mapping(string => uint256) categorySpent;  // Category => amount spent
    }

    // Transaction record for audit trail
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        string category;
        uint256 timestamp;
        string description;
    }

    mapping(address => Beneficiary) public beneficiaries;
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;
    
    // Donation tracking
    struct Donation {
        address donor;
        uint256 amount;
        string category;
        uint256 timestamp;
        bool verified;
        string description;
        string transactionHash; // Link to initial payment TX
    }

    mapping(uint256 => Donation) public donations;
    uint256 public donationCount;

    // Relief partner assignments per beneficiary
    mapping(address => address[]) public reliefPartners;
    address[] public beneficiaryList;
    string[] public allowedCategories;

    // Events for transparency
    event BeneficiaryWhitelisted(address indexed beneficiary, string[] categories, uint256[] limits);
    event BeneficiaryRemoved(address indexed beneficiary);
    event ReliefDistributed(address indexed to, uint256 amount, string category);
    event CategorySpent(address indexed beneficiary, string category, uint256 amount);
    event TransactionRecorded(uint256 indexed txId, address from, address to, uint256 amount, string category);
    event DonationRecorded(uint256 indexed donationId, address indexed donor, uint256 amount, string category, string transactionHash);
    event DonationVerified(uint256 indexed donationId, address indexed verifier);
    event ReliefPartnerAssigned(address indexed beneficiary, address indexed reliefPartner);

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Initialize with common categories
        allowedCategories.push("food");
        allowedCategories.push("shelter");
        allowedCategories.push("medical");
        allowedCategories.push("clothing");
        allowedCategories.push("utilities");
        // Setup roles: initialOwner is the admin
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
    }

    /**
     * @dev Whitelist a beneficiary with category-based spending limits
     */
    function whitelistBeneficiary(
        address beneficiary,
        string[] memory categories,
        uint256[] memory limits
    ) public onlyRole(ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid address");
        require(categories.length == limits.length, "Arrays length mismatch");
        
        Beneficiary storage b = beneficiaries[beneficiary];
        if (!b.isWhitelisted) {
            b.isWhitelisted = true;
            beneficiaryList.push(beneficiary);
        }

        for (uint256 i = 0; i < categories.length; i++) {
            b.categoryLimits[categories[i]] = limits[i];
        }

        emit BeneficiaryWhitelisted(beneficiary, categories, limits);
    }

    /**
     * @dev Remove beneficiary from whitelist
     */
    function removeBeneficiary(address beneficiary) public onlyRole(ADMIN_ROLE) {
        require(beneficiaries[beneficiary].isWhitelisted, "Not a beneficiary");
        beneficiaries[beneficiary].isWhitelisted = false;
        emit BeneficiaryRemoved(beneficiary);
    }

    /**
     * @dev Whitelist a relief partner
     */
    function whitelistReliefPartner(address reliefPartner) public onlyRole(ADMIN_ROLE) {
        require(reliefPartner != address(0), "Invalid address");
        grantRole(RELIEF_PARTNER_ROLE, reliefPartner);
    }

    /**
     * @dev Remove a relief partner
     */
    function removeReliefPartner(address reliefPartner) public onlyRole(ADMIN_ROLE) {
        revokeRole(RELIEF_PARTNER_ROLE, reliefPartner);
    }

    /**
     * @dev Distribute relief funds to a beneficiary
     */
    function distributeRelief(
        address to,
        uint256 amount,
        string memory category
    ) public onlyRole(ADMIN_ROLE) {
        require(beneficiaries[to].isWhitelisted, "Beneficiary not whitelisted");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        beneficiaries[to].totalReceived += amount;
        
        _recordTransaction(msg.sender, to, amount, category, "Relief distribution");
        emit ReliefDistributed(to, amount, category);
    }

    /**
     * @dev Record a donation on-chain. This is intended to be called by an off-chain backend
     * after payment has been processed (owner/admin caller). Donations are recorded for audit.
     */
    function recordDonation(
        address donor,
        uint256 amount,
        string memory category,
        string memory description,
        string memory transactionHash
    ) public onlyRole(ADMIN_ROLE) {
        donations[donationCount] = Donation({
            donor: donor,
            amount: amount,
            category: category,
            timestamp: block.timestamp,
            verified: false,
            description: description,
            transactionHash: transactionHash
        });

        emit DonationRecorded(donationCount, donor, amount, category, transactionHash);
        donationCount++;
    }

    /**
     * @dev Donate function for the public to contribute directly (simulated for now, as this is an ERC20)
     */
    function donate(uint256 amount, string memory category, string memory description, string memory transactionHash) public {
        require(amount > 0, "Amount must be greater than 0");
        
        donations[donationCount] = Donation({
            donor: msg.sender,
            amount: amount,
            category: category,
            timestamp: block.timestamp,
            verified: true,
            description: description,
            transactionHash: transactionHash
        });

        emit DonationRecorded(donationCount, msg.sender, amount, category, transactionHash);
        donationCount++;
    }

    /**
     * @dev Verify a donation (admin only) — marks donation as verified for downstream flows.
     */
    function verifyDonation(uint256 donationId) public onlyRole(ADMIN_ROLE) {
        require(donationId < donationCount, "Invalid donation id");
        donations[donationId].verified = true;
        emit DonationVerified(donationId, msg.sender);
    }

    /**
     * @dev Assign a relief partner to a beneficiary.
     * Can be called by Admin OR the beneficiary themselves.
     */
    function assignReliefPartner(address beneficiary, address reliefPartner) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || 
            (msg.sender == beneficiary && beneficiaries[msg.sender].isWhitelisted),
            "Not authorized"
        );
        require(beneficiary != address(0) && reliefPartner != address(0), "Invalid address");
        
        // Prevent duplicates
        address[] storage partners = reliefPartners[beneficiary];
        for (uint i = 0; i < partners.length; i++) {
            if (partners[i] == reliefPartner) revert("Relief partner already assigned");
        }

        reliefPartners[beneficiary].push(reliefPartner);
        emit ReliefPartnerAssigned(beneficiary, reliefPartner);
    }

    /**
     * @dev Get relief partners assigned to a beneficiary
     */
    function getReliefPartners(address beneficiary) public view returns (address[] memory) {
        return reliefPartners[beneficiary];
    }

    /**
     * @dev Transfer with category-based spending control.
     * Accessible by Whitelisted Beneficiaries and Assigned Relief Partners.
     */
    function transferWithCategory(
        address to,
        uint256 amount,
        string memory category
    ) public returns (bool) {
        bool isBeneficiary = beneficiaries[msg.sender].isWhitelisted;
        bool isPartner = hasRole(RELIEF_PARTNER_ROLE, msg.sender);
        
        require(isBeneficiary || isPartner, "Not authorized to spend with category");
        
        // If it's a partner, we check limits against the beneficiary who assigned them if applicable.
        // For simplicity in this demo, if they have tokens, they can spend within "General" categories 
        // OR we track the specific limits.
        
        if (isBeneficiary) {
            require(
                beneficiaries[msg.sender].categorySpent[category] + amount <= 
                beneficiaries[msg.sender].categoryLimits[category],
                "Category limit exceeded"
            );
            beneficiaries[msg.sender].categorySpent[category] += amount;
        }
        
        _recordTransaction(msg.sender, to, amount, category, "Category-based transfer");
        emit CategorySpent(msg.sender, category, amount);
        
        return transfer(to, amount);
    }

    /**
     * @dev Get beneficiary spending info for a category
     */
    function getCategorySpending(address beneficiary, string memory category) 
        public 
        view 
        returns (uint256 spent, uint256 limit) 
    {
        Beneficiary storage b = beneficiaries[beneficiary];
        return (b.categorySpent[category], b.categoryLimits[category]);
    }

    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 txId) 
        public 
        view 
        returns (
            address from,
            address to,
            uint256 amount,
            string memory category,
            uint256 timestamp,
            string memory description
        ) 
    {
        Transaction storage transaction = transactions[txId];
        return (transaction.from, transaction.to, transaction.amount, transaction.category, transaction.timestamp, transaction.description);
    }

    /**
     * @dev Internal function to record transactions
     */
    function _recordTransaction(
        address from,
        address to,
        uint256 amount,
        string memory category,
        string memory description
    ) internal {
        transactions[transactionCount] = Transaction({
            from: from,
            to: to,
            amount: amount,
            category: category,
            timestamp: block.timestamp,
            description: description
        });
        emit TransactionRecorded(transactionCount, from, to, amount, category);
        transactionCount++;
    }

    /**
     * @dev Get total number of beneficiaries
     */
    function getBeneficiaryCount() public view returns (uint256) {
        return beneficiaryList.length;
    }

    /**
     * @dev Get beneficiary at index
     */
    function getBeneficiaryAt(uint256 index) public view returns (address) {
        require(index < beneficiaryList.length, "Index out of bounds");
        return beneficiaryList[index];
    }
}
