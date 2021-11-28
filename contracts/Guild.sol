// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "./Shop.sol";

interface IUnlockOracleClient {
    function addRequest(string memory _lockedLicense, string memory _publicKey)
        external;

    function requestsCount() external view returns (uint256);
}

contract Guild {
    struct UnlockRequest {
        uint256 requestId;
        uint256 shopId;
        uint256 saleId;
    }

    address owner;
    address oracleClient;
    address[] public shops;
    uint256 ratingReward = 10;
    uint256 serviceTax = 50;
    uint256 constant MAX_UINT = 2**256 - 1;

    mapping(uint256 => UnlockRequest) unlockRequests;
    uint256[] pendingRequests;
    mapping(uint256 => uint256) public requestIdToRequestIndex;

    // get shopId before making any function calls
    mapping(string => uint256) public shopNameToShopId;
    mapping(string => bool) public isShopNameTaken;

    mapping(address => uint256) buyerCredits;
    // list of buyers with credits..
    // ..close credits periodically

    // Events
    event ShopCreated(string indexed _shopName, string _detailsCId);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyShopOwner(uint256 _shopId) {
        require(msg.sender == Shop(shops[_shopId]).owner());
        _;
    }

    modifier onlyBuyer(uint256 _shopId, uint256 _saleId) {
        (, address buyer, , , , , , ) = Shop(shops[_shopId]).sales(_saleId);
        require(msg.sender == buyer);
        _;
    }

    modifier onlyOracleClient() {
        require(msg.sender == oracleClient);
        _;
    }

    constructor(address _oracleClient) {
        owner = msg.sender;
        oracleClient = _oracleClient;
    }

    function changeOracle(address _oracle) external onlyOwner {
        oracleClient = _oracle;
    }

    function createShop(string memory _shopName, string memory _detailsCId)
        external
    {
        require(!isShopNameTaken[_shopName], "Shop name already taken");
        Shop shop = new Shop(msg.sender, _shopName, _detailsCId);
        shops.push(address(shop));
        shopNameToShopId[_shopName] = shops.length - 1;
        emit ShopCreated(_shopName, _detailsCId);
    }

    function addProduct(
        uint256 _shopId,
        string memory _contentCId,
        string memory _detailsCId,
        string memory _licenseHash,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) external onlyShopOwner(_shopId) {
        Shop(shops[_shopId]).addProduct(
            _contentCId,
            _detailsCId,
            _licenseHash,
            _lockedLicense,
            _price,
            _stock == 0 ? MAX_UINT : _stock // if stock is given, use it else use max uint.
        );
    }

    function requestSale(
        uint256 _shopId,
        uint256 _productId,
        string memory _publicKey,
        uint256 _redeemCredits
    ) external payable {
        require(msg.sender != Shop(shops[_shopId]).owner());

        require(buyerCredits[msg.sender] >= _redeemCredits);
        buyerCredits[msg.sender] -= _redeemCredits;

        Shop(shops[_shopId]).requestSale{
            value: msg.value + _redeemCredits - ratingReward - serviceTax
        }(msg.sender, _productId, _publicKey);

        (uint256 saleId, , , , , , , ) = Shop(shops[_shopId]).sales(
            Shop(shops[_shopId]).salesCount() - 1
        );

        (, , , , string memory lockedLicense, , , , ) = Shop(shops[_shopId])
            .products(_productId);

        IUnlockOracleClient(oracleClient).addRequest(lockedLicense, _publicKey);

        uint256 unlockRequestId = IUnlockOracleClient(oracleClient)
            .requestsCount() - 1;

        unlockRequests[unlockRequestId] = UnlockRequest({
            requestId: unlockRequestId,
            shopId: _shopId,
            saleId: saleId
        });

        pendingRequests.push(unlockRequestId);
        requestIdToRequestIndex[unlockRequestId] = pendingRequests.length - 1;
    }

    function getRefund(uint256 _shopId, uint256 _saleId)
        external
        payable
        onlyBuyer(_shopId, _saleId)
    {
        Shop(shops[_shopId]).getRefund(_saleId);
        (bool sent, ) = msg.sender.call{value: ratingReward}("");
        require(sent, "Failed to refund rating reward"); // refund with a multiplier?
    }

    function addRating(
        uint256 _shopId,
        uint256 _saleId,
        uint256 _rating
    ) public onlyBuyer(_shopId, _saleId) {
        Shop(shops[_shopId]).addRating(_saleId, _rating);
        buyerCredits[msg.sender] += ratingReward;
    }

    function shelfProduct(uint256 _shopId, uint256 _productId)
        public
        onlyShopOwner(_shopId)
    {
        Shop(shops[_shopId]).shelfProduct(_productId);
    }

    function changePrice(
        uint256 _shopId,
        uint256 _productId,
        uint256 _price
    ) public onlyShopOwner(_shopId) {
        Shop(shops[_shopId]).changePrice(_productId, _price);
    }

    function changeStock(
        uint256 _shopId,
        uint256 _productId,
        uint256 _stock
    ) public onlyShopOwner(_shopId) {
        Shop(shops[_shopId]).changeStock(_productId, _stock);
    }

    function withdrawFromShop(uint256 _shopId, uint256 _amount)
        public
        payable
        onlyShopOwner(_shopId)
    {
        Shop(shops[_shopId]).withdraw(_amount);
    }

    function completeUnlock(
        uint256 _requestId,
        bytes32[2] memory _unlockedLicense
    ) external onlyOracleClient {
        Shop(shops[unlockRequests[_requestId].shopId]).closeSale(
            unlockRequests[_requestId].saleId,
            _unlockedLicense
        );

        pendingRequests[requestIdToRequestIndex[_requestId]] = pendingRequests[
            pendingRequests.length - 1
        ];
        requestIdToRequestIndex[
            pendingRequests[pendingRequests.length - 1]
        ] = requestIdToRequestIndex[_requestId];

        pendingRequests.pop();
        delete requestIdToRequestIndex[_requestId];
        delete unlockRequests[_requestId];
    }
}
