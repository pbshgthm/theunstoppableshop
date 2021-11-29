// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "./Shop.sol";

contract ShopFactory {
    address latestShopAddress;

    function createShop(
        address owner,
        string memory _shopName,
        string memory _detailsCId
    ) external {
        latestShopAddress = address(new Shop(owner, _shopName, _detailsCId));
    }

    function getLatestShopAddress() external view returns (address) {
        return latestShopAddress;
    }
}
