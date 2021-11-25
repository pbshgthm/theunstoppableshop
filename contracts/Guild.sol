// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Shop.sol";

contract Guild {
    address[] public shopAddressList;

    mapping(address => address[]) public ownerToShopList;
    mapping(string => address) public shopNameToAddress;
    mapping(address => bool) public isBlocked;

    modifier onlyShopOwner(string memory _shopName) {
        require(msg.sender == Shop(shopNameToAddress[_shopName]).shopOwner());
        _;
    }

    modifier onlyManager(string memory _shopName) {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        require(
            msg.sender == shop.shopOwner() || msg.sender == shop.houseKeeper()
        );
        _;
    }

    modifier onlyBuyer(string memory _shopName, uint256 _saleId) {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        uint256 saleIndex = shop.saleIdToIndex(_saleId);
        (, address buyer, , , , , , , , , ) = shop.sales(saleIndex);
        require(msg.sender == buyer, "Not buyer");
        _;
    }

    function getShop(string memory _shopName) internal view {
        // function to get the shop
    }

    //function to check if shopName is available
    function isShopNameAvailable(string memory _shopName)
        external
        view
        returns (bool)
    {
        return shopNameToAddress[_shopName] == address(0);
    }

    // function to add a new shop to the guild
    function createShop(
        address _housekeeper,
        address _resolver,
        string memory _shopName
    ) external {
        require(
            shopNameToAddress[_shopName] == address(0),
            "Shop already exists"
        );
        Shop shop = new Shop(_housekeeper, _resolver, msg.sender, _shopName); // add shop name here
        shopAddressList.push(address(shop));
        shopNameToAddress[_shopName] = address(shop);
        ownerToShopList[msg.sender].push(address(shop));
    }

    function addProduct(
        string memory _shopName,
        // string memory _productName, // required? or not?
        string memory _contentAddress,
        string memory _descAddress,
        string memory _licenseHash,
        uint256 _price
    ) external onlyShopOwner(_shopName) {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.addProduct(_contentAddress, _descAddress, _licenseHash, _price);
    }

    function requestSale(
        string memory _shopName,
        uint256 _productId,
        string memory _pubKey
    ) public payable {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        require(msg.sender != shop.shopOwner(), "Owner can't request sale!");
        // add condition to check if the buyer already purchased this?
        shop.requestSale{value: msg.value}(_productId, _pubKey, msg.sender);
    }

    function respondToSale(
        string memory _shopName,
        uint256 _saleId,
        string memory _encryptedLiscense
    ) public onlyManager(_shopName) {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.respondToSale(_saleId, _encryptedLiscense, msg.sender);
    }

    function confirmSale(string memory _shopName, uint256 _saleId)
        public
        onlyBuyer(_shopName, _saleId)
    {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.confirmSale(_saleId);
    }

    function claimDispute(
        string memory _shopName,
        uint256 _saleId,
        string memory _decryptedLiscense
    ) public onlyBuyer(_shopName, _saleId) {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.claimDispute(_saleId, _decryptedLiscense);
    }

    function settleDispute(uint256 _saleId, bool _isValidClaim) public {}

    function noResponseRefund(string memory _shopName, uint256 _saleId)
        public
        payable
    {
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.noResponseRefund(_saleId);
    }

    function autoConfirmation(string memory _shopName, uint256 _saleId) public {
        // removed payable
        Shop shop = Shop(shopNameToAddress[_shopName]);
        shop.autoConfirmation(_saleId);
    }
}
