// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "./shop.sol";
import "./unlockOracleClient.sol";

//import "@chainlink/contracts/src/v0.7/KeeperCompatible.sol";
// is working ever without this import??

contract Guild {
    struct UnlockRequest {
        uint256 requestId;
        uint256 shopId;
        uint256 saleId;
    }

    address creator;
    address oracleClient;
    address[] public shops;
    uint256 ratingReward = 10;
    uint256 serviceTax = 50;
    uint256 MAX_SHOPS = 32;

    mapping(uint256 => UnlockRequest) unlockRequests;
    uint256[] pendingRequests;
    mapping(uint256 => uint256) public requestIdToRequestIndex;

    mapping(address => uint256) buyerCredits;

    modifier onlyCreator() {
        require(msg.sender == creator);
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

    constructor(address _oracleClient) {
        creator = msg.sender;
        oracleClient = _oracleClient;
    }

    function createShop(string memory _detailsCId) public {
        require(shops.length < MAX_SHOPS);
        Shop shop = new Shop(msg.sender, _detailsCId);
        shops.push(address(shop));
    }

    function addProduct(
        uint256 _shopId,
        string memory _contentCId,
        string memory _detailsCId,
        string memory _licenseHash,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) public onlyShopOwner(_shopId) {
        Shop(shops[_shopId]).addProduct(
            _contentCId,
            _detailsCId,
            _licenseHash,
            _lockedLicense,
            _price,
            _stock
        );
    }

    function requestSale(
        uint256 _shopId,
        uint256 _productId,
        string memory _publicKey,
        uint256 _redeemCredits
    ) public payable {
        require(msg.sender != Shop(shops[_shopId]).owner());
        // add condition to check if the buyer already purchased this product
        require(buyerCredits[msg.sender] >= _redeemCredits);
        buyerCredits[msg.sender] -= _redeemCredits;

        (uint256 saleId, string memory lockedLicense) = Shop(shops[_shopId])
            .requestSale{
            value: msg.value + _redeemCredits - ratingReward - serviceTax
        }(msg.sender, _productId, _publicKey);

        uint256 unlockRequestId = UnlockOracleClient(oracleClient).addRequest(
            lockedLicense,
            _publicKey
        );
        unlockRequests[unlockRequestId] = UnlockRequest({
            requestId: unlockRequestId,
            shopId: _shopId,
            saleId: saleId
        });

        pendingRequests.push(unlockRequestId);
        requestIdToRequestIndex[unlockRequestId] = pendingRequests.length - 1;
    }

    function getRefund(uint256 _shopId, uint256 _saleId)
        public
        payable
        onlyBuyer(_shopId, _saleId)
    {
        Shop(shops[_shopId]).getRefund(_saleId);
        msg.sender.call{value: ratingReward}(""); // refund with a multiplier?
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

    function withdraw(uint256 _shopId, uint256 _amount)
        public
        payable
        onlyShopOwner(_shopId)
    {
        Shop(shops[_shopId]).withdraw(_amount);
    }

    function completeUnlock(uint256 _requestId) internal {
        bytes32[2] memory unlockedLicense = UnlockOracleClient(oracleClient)
            .getResult(_requestId);
        Shop(shops[unlockRequests[_requestId].shopId]).closeSale(
            unlockRequests[_requestId].saleId,
            unlockedLicense
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

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external returns (bool, bytes memory) {
        uint256 completedRequestsCount = 0;
        uint256[] memory completedRequestIds;

        for (uint256 i = 0; i < pendingRequests.length; i++) {
            UnlockOracleClient(oracleClient).getResult(pendingRequests[i]);
            completedRequestIds[completedRequestsCount] = pendingRequests[i];
            completedRequestsCount++;
        }
        return (
            (completedRequestIds.length > 0), //upkeepNeeded
            abi.encodePacked(completedRequestIds) //performData
        );
    }

    function performUpkeep(bytes calldata performData) external {
        uint256[] memory pendingRequestIds = performData;
        // ABOVE CONVRSION WONT HAPPEN, NEED TO FIGURE OUT HOW TO DO IT

        for (uint256 i = 0; i < pendingRequestIds.length; i++) {
            completeUnlock(pendingRequestIds[i]);
        }
    }

    // alternative to performUpkeep ---------
    function altCompleteUnlock(
        uint256 _requestId,
        bytes32[2] memory _unlockedLicense
    ) internal {
        Shop(shops[unlockRequests[_requestId].shopId]).closeSale(
            unlockRequests[_requestId].saleId,
            _unlockedLicense
        );
        delete unlockRequests[_requestId];
    }
    //-----------------------------------------------
}
