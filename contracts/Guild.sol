// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

interface IShopFactory {
    function createShop(
        address owner,
        string memory _shopName,
        string memory _detailsCId,
        address[] memory _beneficiaryList,
        uint256[] memory _sharePercent
    ) external;

    function getLatestShopAddress() external view returns (address);
}

interface IShop {
    struct Sale {
        address buyer;
        string publicKey;
        uint256 productId;
        uint256 amount;
        uint256 saleDeadline;
        string unlockedLicense;
        RatingOptions rating;
        SaleStatus status;
    }
    enum RatingOptions {
        Unrated,
        Poor,
        Fair,
        Good,
        Excellent
    }
    enum SaleStatus {
        Requested,
        Refunded,
        Completed,
        Rated
    }
    struct Product {
        string[] contentCID;
        string lockedLicense;
        uint256 price;
        uint256 stock;
        uint256 salesCount;
        uint256 revenue;
        uint256 creationTime;
        Ratings ratings;
        bool isAvailable;
    }
    struct Ratings {
        uint32[4] ratingsCount;
    }

    struct ShopInfo {
        address guild;
        address owner;
        string detailsCId;
        uint256 shopBalance;
        string shopName;
        uint256 productsCount;
        uint256 salesCount;
    }

    function getOwner() external view returns (address);

    function getSale(uint256 _saleId) external view returns (Sale memory);

    function getProductsCount() external view returns (uint256);

    function getSalesCount() external view returns (uint256);

    function getProduct(uint256 _productId)
        external
        view
        returns (Product memory);

    function updateShopDetails(string memory _detailsCId) external;

    function getRefund(uint256 _saleId) external payable;

    function addProduct(
        string[] memory _contentCID,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) external;

    function addRating(uint256 _saleId, RatingOptions _rating) external;

    function updateProduct(
        uint256 _productId,
        string memory _contentCID,
        uint256 _price,
        uint256 _stock,
        bool _isAvailable
    ) external;

    function requestSale(
        address _buyer,
        uint256 _productId,
        string memory _publicKey
    ) external payable;

    function withdrawBalance() external;

    function closeSale(uint256 _saleId, string memory _unlockedLicense)
        external;

    function getShopInfo() external view returns (ShopInfo memory);

    function getOpenSaleIds() external view returns (uint256[] memory);
}

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

    struct CartItem {
        uint256 shopId;
        uint256 productId;
        uint256 amount;
    }

    address owner;
    address oracleClient;
    address public shopFactory;
    address[] public shops;
    uint256 ratingReward = 0.001 ether;
    uint256 serviceTax = 0.2 ether;
    uint256 constant MAX_UINT = 2**256 - 1;
    uint256[] pendingRequests;

    IShopFactory FactoryInterface;

    mapping(uint256 => UnlockRequest) unlockRequests;
    mapping(uint256 => uint256) public requestIdToRequestIndex;
    mapping(string => uint256) public shopNameToShopId;
    mapping(string => bool) public isShopNameTaken;
    mapping(address => uint256) public buyerCredits;
    mapping(address => string) public buyerEncryptionKeys;
    mapping(address => uint256) public beneficiaryBalances;

    //Events
    event ProductCreated(uint256 indexed shopId, uint256 productId);
    event RequestedSale(
        uint256 indexed shopId,
        address indexed buyer,
        uint256 indexed productId,
        uint8 contentVersion,
        uint256 saleId
    );

    event ShopCreated(uint256 shopId, address indexed owner); // emitted

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call the function!");
        _;
    }

    modifier onlyShopOwner(uint256 _shopId) {
        require(
            msg.sender == IShop(shops[_shopId]).getOwner(),
            "only shop owner can call the function!"
        );
        _;
    }

    modifier onlyBuyer(uint256 _shopId, uint256 _saleId) {
        IShop.Sale memory sale = IShop(shops[_shopId]).getSale(_saleId);
        require(msg.sender == sale.buyer, "Only buyer can call the function!");
        _;
    }

    modifier onlyOracleClient() {
        require(
            msg.sender == oracleClient,
            "Only oracle client can call the function!"
        );
        _;
    }

    constructor(address _oracleClient, address _shopFactory) {
        owner = msg.sender;
        oracleClient = _oracleClient;
        shopFactory = _shopFactory;
        FactoryInterface = IShopFactory(shopFactory);
    }

    function changeOracle(address _oracle) external onlyOwner {
        oracleClient = _oracle;
    }

    function updateShopDetails(uint256 _shopId, string memory _detailsCId)
        external
        onlyShopOwner(_shopId)
    {
        IShop(shops[_shopId]).updateShopDetails(_detailsCId);
    }

    function updateProduct(
        uint256 _shopId,
        uint256 _productId,
        string memory _contentCID,
        uint256 _price,
        uint256 _stock,
        bool _isAvailable
    ) external {
        IShop(shops[_shopId]).updateProduct(
            _productId,
            _contentCID,
            _price,
            _stock,
            _isAvailable
        );
    }

    function createShop(
        string memory _shopName,
        string memory _detailsCId,
        address[] memory _beneficiaryList,
        uint256[] memory _sharePercent
    ) external {
        require(!isShopNameTaken[_shopName], "Shop name already taken");

        FactoryInterface.createShop(
            msg.sender,
            _shopName,
            _detailsCId,
            _beneficiaryList,
            _sharePercent
        );

        shops.push(FactoryInterface.getLatestShopAddress());
        shopNameToShopId[_shopName] = shops.length - 1;
        isShopNameTaken[_shopName] = true;

        emit ShopCreated(shopNameToShopId[_shopName], owner);
    }

    function addProduct(
        uint256 _shopId,
        string[] memory _contentCID,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) public onlyShopOwner(_shopId) {
        IShop(shops[_shopId]).addProduct(
            _contentCID,
            _lockedLicense,
            _price,
            _stock
        );
        emit ProductCreated(
            _shopId,
            IShop(shops[_shopId]).getProductsCount() - 1
        );
    }

    function requestSale(
        uint256 _shopId,
        uint256 _productId,
        string memory _publicKey,
        uint256 _amount
    ) internal {
        //require(msg.sender != IShop(shops[_shopId]).getOwner());

        if (bytes(_publicKey).length == 0) {
            require(
                bytes(buyerEncryptionKeys[msg.sender]).length != 0,
                "No encryption key found for this user"
            );
            _publicKey = buyerEncryptionKeys[msg.sender];
        }

        IShop(shops[_shopId]).requestSale{
            value: _amount - ratingReward - serviceTax
        }(msg.sender, _productId, _publicKey);

        IShop.Sale memory sale = IShop(shops[_shopId]).getSale(
            IShop(shops[_shopId]).getSalesCount() - 1
        );

        IShop.Product memory product = IShop(shops[_shopId]).getProduct(
            _productId
        );

        IUnlockOracleClient(oracleClient).addRequest(
            product.lockedLicense,
            _publicKey
        );

        uint256 unlockRequestId = IUnlockOracleClient(oracleClient)
            .requestsCount() - 1;

        unlockRequests[unlockRequestId] = UnlockRequest({
            requestId: unlockRequestId,
            shopId: _shopId,
            saleId: IShop(shops[_shopId]).getSalesCount() - 1
        });

        pendingRequests.push(unlockRequestId);
        requestIdToRequestIndex[unlockRequestId] = pendingRequests.length - 1;

        emit RequestedSale(
            _shopId,
            msg.sender,
            sale.productId,
            uint8(product.contentCID.length),
            IShop(shops[_shopId]).getSalesCount() - 1
        );
    }

    function getRefund(uint256 _shopId, uint256 _saleId)
        external
        payable
        onlyBuyer(_shopId, _saleId)
    {
        buyerCredits[msg.sender] += ratingReward;

        IShop(shops[_shopId]).getRefund(_saleId);
    }

    function addRating(
        uint256 _shopId,
        uint256 _saleId,
        IShop.RatingOptions _rating
    ) public onlyBuyer(_shopId, _saleId) {
        IShop(shops[_shopId]).addRating(_saleId, _rating);
        buyerCredits[msg.sender] += ratingReward;
    }

    function withdrawBalance(uint256 _shopId) external {
        IShop(shops[_shopId]).withdrawBalance();
    }

    function completeUnlock(uint256 _requestId, string memory _unlockedLicense)
        external
        onlyOracleClient
    {
        IShop(shops[unlockRequests[_requestId].shopId]).closeSale(
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

    function checkoutCart(
        CartItem[] memory _cartItems,
        string memory _encryptionKey,
        uint256 _redeemCredits
    ) external payable {
        uint256 avaiableAmount = msg.value;
        require(
            buyerCredits[msg.sender] >= _redeemCredits,
            "Not enough credits"
        );
        buyerCredits[msg.sender] -= _redeemCredits;
        avaiableAmount += _redeemCredits;

        for (uint256 i = 0; i < _cartItems.length; i++) {
            require(avaiableAmount > _cartItems[i].amount, "Not enough funds");
            avaiableAmount -= _cartItems[i].amount;
            requestSale(
                _cartItems[i].shopId,
                _cartItems[i].productId,
                _encryptionKey,
                _cartItems[i].amount
            );
        }
    }

    // getter functions
    function getSaleInfo(uint256 _shopId, uint256 _saleId)
        external
        view
        returns (IShop.Sale memory)
    {
        return IShop(shops[_shopId]).getSale(_saleId);
    }

    function getProductInfo(uint256 _shopId, uint256 _productId)
        external
        view
        returns (IShop.Product memory)
    {
        return IShop(shops[_shopId]).getProduct(_productId);
    }

    function getShopInfo(uint256 _shopId)
        external
        view
        returns (IShop.ShopInfo memory)
    {
        return IShop(shops[_shopId]).getShopInfo();
    }

    function getOpenSaleIds(uint256 _shopId)
        external
        view
        returns (uint256[] memory)
    {
        return IShop(shops[_shopId]).getOpenSaleIds();
    }

    function setServiceTax(uint256 _newServiceTax) external onlyOwner {
        serviceTax = _newServiceTax;
    }

    function setRatingReward(uint256 _newRatingReward) external onlyOwner {
        ratingReward = _newRatingReward;
    }

    function getShopCount() external view returns (uint256) {
        return shops.length;
    }

    function getProductsCount(uint256 _shopId) external view returns (uint256) {
        return IShop(shops[_shopId]).getProductsCount();
    }
}
