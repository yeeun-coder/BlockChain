// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Counter {

    uint256 public count;

    event Increment(uint256 newValue);

    function increment() public {
        count++;
        emit Increment(count);
    }
    
    function add(uint256 value) public {
        count += value;
        emit Increment(count);
    }

    function subtract(uint256 value) public {
        count -= value;
    }
}
