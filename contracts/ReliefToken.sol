// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReliefToken
 * @dev Stablecoin contract for disaster relief distribution
 * This contract manages beneficiary whitelisting and category-based spending limits
 */
contract ReliefToken is ERC20, Ownable {
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
    
    address[] public beneficiaryList;
    string[] public allowedCategories;

    // Events for transparency
    event BeneficiaryWhitelisted(address indexed beneficiary, string[] categories, uint256[] limits);
    event BeneficiaryRemoved(address indexed beneficiary);
    event ReliefDistributed(address indexed to, uint256 amount, string category);
    event CategorySpent(address indexed beneficiary, string category, uint256 amount);
    event TransactionRecorded(uint256 indexed txId, address from, address to, uint256 amount, string category);

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
    }

    /**
     * @dev Whitelist a beneficiary with category-based spending limits
     */
    function whitelistBeneficiary(
        address beneficiary,
        string[] memory categories,
        uint256[] memory limits
    ) public onlyOwner {
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
    function removeBeneficiary(address beneficiary) public onlyOwner {
        require(beneficiaries[beneficiary].isWhitelisted, "Not a beneficiary");
        beneficiaries[beneficiary].isWhitelisted = false;
        emit BeneficiaryRemoved(beneficiary);
    }

    /**
     * @dev Distribute relief funds to a beneficiary
     */
    function distributeRelief(
        address to,
        uint256 amount,
        string memory category
    ) public onlyOwner {
        require(beneficiaries[to].isWhitelisted, "Beneficiary not whitelisted");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        beneficiaries[to].totalReceived += amount;
        
        _recordTransaction(msg.sender, to, amount, category, "Relief distribution");
        emit ReliefDistributed(to, amount, category);
    }

    /**
     * @dev Transfer with category-based spending control
     */
    function transferWithCategory(
        address to,
        uint256 amount,
        string memory category
    ) public returns (bool) {
        require(beneficiaries[msg.sender].isWhitelisted, "Not a beneficiary");
        require(
            beneficiaries[msg.sender].categorySpent[category] + amount <= 
            beneficiaries[msg.sender].categoryLimits[category],
            "Category limit exceeded"
        );

        beneficiaries[msg.sender].categorySpent[category] += amount;
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
