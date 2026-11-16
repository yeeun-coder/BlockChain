// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EtherVault
 * @dev A smart contract for tipping and creator support with security and transparency.
 */
contract EtherVault is Ownable, ReentrancyGuard {
    struct Tip {
        address sender;
        uint256 amount;
        string message;
        string name;
        uint256 timestamp;
    }

    // List of all tips received
    Tip[] private tips;
    
    // Cumulative total ETH deposited into the vault
    uint256 public totalDeposited;

    // Events
    event NewTip(
        address indexed sender,
        uint256 amount,
        string name,
        string message,
        uint256 timestamp
    );
    event VaultWithdrawn(address indexed owner, uint256 amount);

    /**
     * @dev Constructor sets the contract owner to the deployer.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Allows users to send tips along with their name and custom support message.
     * @param _name Display name of the supporter (max 50 characters).
     * @param _message Custom message from the supporter (max 280 characters).
     */
    function tip(string calldata _name, string calldata _message) external payable {
        require(msg.value > 0, "Tip amount must be greater than zero");
        require(bytes(_name).length <= 50, "Name exceeds 50 characters");
        require(bytes(_message).length <= 280, "Message exceeds 280 characters");

        // Use "Anonymous" if no name is provided
        string memory displayName = bytes(_name).length == 0 ? "Anonymous" : _name;

        Tip memory newTip = Tip({
            sender: msg.sender,
            amount: msg.value,
            message: _message,
            name: displayName,
            timestamp: block.timestamp
        });

        tips.push(newTip);
        totalDeposited += msg.value;

        emit NewTip(msg.sender, msg.value, displayName, _message, block.timestamp);
    }

    /**
     * @dev Allows the owner to withdraw the full contract balance.
     * Protected against reentrancy.
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        address ownerAddr = owner();
        
        // Use transfer call (recommended over transfer or send)
        (bool success, ) = payable(ownerAddr).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit VaultWithdrawn(ownerAddr, balance);
    }

    /**
     * @dev Get total count of tips received.
     */
    function getTipCount() external view returns (uint256) {
        return tips.length;
    }

    /**
     * @dev Get all tips received since inception.
     */
    function getTotalTips() external view returns (Tip[] memory) {
        return tips;
    }

    /**
     * @dev Get the latest `count` tips (most recent first).
     * @param count Number of recent tips to retrieve.
     */
    function getLatestTips(uint256 count) external view returns (Tip[] memory) {
        uint256 tipsLength = tips.length;
        if (tipsLength == 0) {
            return new Tip[](0);
        }

        uint256 resultSize = count > tipsLength ? tipsLength : count;
        Tip[] memory latestTips = new Tip[](resultSize);

        for (uint256 i = 0; i < resultSize; i++) {
            latestTips[i] = tips[tipsLength - 1 - i];
        }

        return latestTips;
    }
}
