// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Storage {
    struct Product {
        uint256 productId;
        string contentAddress;
        string descAddress;
        string liscenseHash;
        uint256 price;
        uint256 saleCount;
        bool isAvailable;
    }

    struct Sale {
        uint256 saleId;
        address buyerAddress;
        string pubKey;
        uint256 productId;
        uint256 amount;
        uint256 responseDeadline; // can be merged (I guess) into nextDeadline ..
        uint256 confirmationDeadline; // .. differentiated by saleState
        string encryptedLiscense;
        bool isKeeperResponse;
        string disputeDcryptLiscense;
        SaleState saleState;
    }

    string public shopName;
    address public shopOwner;
    address public guildAddress;
    address public houseKeeper;
    address public resolver; // address of the dispute resolver contract (factory contract)
    uint256 public keeperFeePercent = 1; //could be part of constructor
    uint256 public ownerBalance = 0;
    uint256 public keeperBalance = 0;
    uint256 public productCount = 0;
    uint256 public saleCount = 0;
    uint256 public successSale = 0;
    uint256 public responseDeadlineTime = 86400 * 10; // 10 days //could be part of constructor
    uint256 public confirmationDeadlineTime = 86400 * 10; //could be part of constructor

    enum SaleFilterType {
        productId,
        buyerId
    }
    enum SaleState {
        Requested,
        Responded,
        Disputed,
        Genesis
    }

    Product[] public products;

    Sale[] public sales;

    mapping(uint256 => uint256) public productIdToIndex;
    mapping(uint256 => uint256) public saleIdToIndex;
}
