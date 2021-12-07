// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

contract Shop {
    struct Ratings {
        uint32[4] ratingsCount;
    }
    struct Product {
        string[] metadata;
        string lockedLicense;
        uint256 price;
        uint256 stock;
        uint256 salesCount;
        uint256 totalVolume;
        uint256 creationTime;
        Ratings ratings;
        bool isAvailable;
    }

    struct Sale {
        address buyer;
        string publicKey;
        uint256 productId;
        uint256 amount;
        uint256 saleDeadline;
        string unlockedLicense;
        uint8 rating;
        SaleStatus status;
    }

    struct ShopInfo {
        address guild;
        address owner;
        uint256 shopBalance;
        string shopName;
        uint256 productsCount;
        uint256 salesCount;
    }

    enum SaleStatus {
        Requested,
        Refunded,
        Completed,
        Rated
    }

    address public guild;
    address public owner;
    address[] public beneficiaryList;

    string[] public detailsCId;
    string public shopName;

    uint256 public productsCount = 0;
    uint256 public salesCount = 0;

    uint256[] public openSaleIds;

    Product[] public products;

    mapping(uint256 => Sale) public sales;
    mapping(uint256 => uint256) public openSaleIdToIndex;
    mapping(address => uint256) public beneficiarySharePercent;
    mapping(address => uint256) public beneficiaryBalance;

    modifier onlyGuild() {
        require(msg.sender == guild, "Only guild can call this function");
        _;
    }

    constructor(
        address _owner,
        address _guild,
        string memory _shopName,
        string memory _detailsCId,
        address[] memory _beneficiaryList,
        uint256[] memory _sharePercent
    ) {
        guild = _guild;
        owner = _owner;
        detailsCId.push(_detailsCId);
        shopName = _shopName;
        setBeneficiary(_beneficiaryList, _sharePercent);
    }

    function addProduct(
        string[] memory _metadata,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) external onlyGuild {
        uint32[4] memory _ratingsCount;

        products.push(
            Product({
                metadata: _metadata,
                lockedLicense: _lockedLicense,
                price: _price,
                stock: _stock,
                salesCount: 0,
                totalVolume: 0,
                creationTime: block.timestamp,
                ratings: Ratings(_ratingsCount),
                isAvailable: true
            })
        );
        productsCount++;
    }

    function requestSale(
        address _buyer,
        uint256 _productId,
        string memory _publicKey
    ) public payable onlyGuild {
        require(_productId <= productsCount, "Product does not exist");
        require(
            products[_productId].salesCount < products[_productId].stock,
            "Product is out of stock"
        );
        require(products[_productId].isAvailable, "Product is not available");
        require(products[_productId].price <= msg.value, "Payment is too low");

        sales[salesCount] = Sale({
            buyer: _buyer,
            publicKey: _publicKey,
            productId: _productId,
            amount: msg.value,
            saleDeadline: block.timestamp + 2 minutes,
            unlockedLicense: "",
            rating: 0,
            status: SaleStatus.Requested
        });
        openSaleIds.push(salesCount);
        openSaleIdToIndex[salesCount] = openSaleIds.length - 1;
        salesCount++;
    }

    function getRefund(uint256 _saleId) external payable onlyGuild {
        require(
            sales[_saleId].status == SaleStatus.Requested,
            "Sale is not requested"
        );
        require(
            block.timestamp > sales[_saleId].saleDeadline,
            "Sale deadline hasn't been passed"
        );

        sales[_saleId].status = SaleStatus.Refunded;

        openSaleIds[openSaleIdToIndex[_saleId]] = openSaleIds[
            openSaleIds.length - 1
        ];
        openSaleIds.pop();
        delete openSaleIdToIndex[_saleId];

        // decrementing product.SalesCount
        products[sales[_saleId].productId].salesCount--;
        (bool sent, ) = sales[_saleId].buyer.call{value: sales[_saleId].amount}(
            ""
        );
        require(sent, "Could not send refund");
    }

    function closeSale(uint256 _saleId, string memory _unlockedLicense)
        external
        onlyGuild
    {
        require(
            sales[_saleId].status == SaleStatus.Requested,
            "Sale is not requested"
        );
        require(
            sales[_saleId].saleDeadline > block.timestamp,
            "Sale deadline hasn't been passed"
        );

        sales[_saleId].unlockedLicense = _unlockedLicense;
        sales[_saleId].status = SaleStatus.Completed;
        products[sales[_saleId].productId].totalVolume += sales[_saleId].amount;

        allocateAmount(sales[_saleId].amount);

        openSaleIds[openSaleIdToIndex[_saleId]] = openSaleIds[
            openSaleIds.length - 1
        ];
        openSaleIds.pop();
        delete openSaleIdToIndex[_saleId];
    }

    function allocateAmount(uint256 _amount) internal {
        for (uint256 i = 0; i < beneficiaryList.length; i++) {
            beneficiaryBalance[beneficiaryList[i]] +=
                (beneficiarySharePercent[beneficiaryList[i]] * _amount) /
                100;
        }
    }

    function addRating(uint256 _saleId, uint8 _rating) external onlyGuild {
        require(
            sales[_saleId].status == SaleStatus.Completed,
            "Sale is not completed"
        );
        sales[_saleId].rating = _rating;
        sales[_saleId].status = SaleStatus.Rated;
        products[sales[_saleId].productId].ratings.ratingsCount[_rating]++;
    }

    function shelfProduct(uint256 _productId) external onlyGuild {
        products[_productId].isAvailable = false;
    }

    function changePrice(uint256 _productId, uint256 _price)
        external
        onlyGuild
    {
        products[_productId].price = _price;
    }

    function changeStock(uint256 _productId, uint256 _stock)
        external
        onlyGuild
    {
        products[_productId].stock = _stock;
    }

    // function to set beneficiary
    function setBeneficiary(
        address[] memory _beneficiaryList,
        uint256[] memory _sharePercent
    ) internal {
        // deleting current share percent values
        for (uint256 i = 0; i < _beneficiaryList.length; i++) {
            delete beneficiarySharePercent[_beneficiaryList[i]];
        }

        uint256 totalShare = 0;
        beneficiaryList = _beneficiaryList;
        for (uint256 i = 0; i < beneficiaryList.length; i++) {
            require(_sharePercent[i] != 0, "beneficiary share cannot be 0");
            require(
                _beneficiaryList[i] != address(0),
                "beneficiary cannot be 0"
            );
            beneficiarySharePercent[beneficiaryList[i]] = _sharePercent[i];
            totalShare += _sharePercent[i];
        }

        require(totalShare == 100, "Total share must be 100%");
    }

    function withdrawBalance() external {
        for (uint256 i = 0; i < beneficiaryList.length; i++) {
            uint256 tempBeneficiaryBalance = beneficiaryBalance[
                beneficiaryList[i]
            ];
            beneficiaryBalance[beneficiaryList[i]] = 0;
            (bool success, ) = beneficiaryList[i].call{
                value: tempBeneficiaryBalance
            }("");
            require(success, "Error on withdraw");
        }
    }

    // helper functions
    function getOwner() external view returns (address) {
        return owner;
    }

    function getSale(uint256 _saleId) external view returns (Sale memory) {
        return sales[_saleId];
    }

    function getProduct(uint256 _productId)
        external
        view
        returns (Product memory)
    {
        return products[_productId];
    }

    function getSalesCount() external view returns (uint256) {
        return salesCount;
    }

    function getShopInfo() external view returns (ShopInfo memory) {
        return
            ShopInfo({
                guild: guild,
                owner: owner,
                shopBalance: beneficiaryBalance[owner],
                shopName: shopName,
                productsCount: productsCount,
                salesCount: salesCount
            });
    }

    function getOpenSaleIds() external view returns (uint256[] memory) {
        return openSaleIds;
    }

    function getProductCount() external view returns (uint256) {
        return productsCount;
    }

    function getProductMetadata(uint256 _productId, uint256 _version)
        external
        view
        returns (string memory)
    {
        return products[_productId].metadata[_version];
    }
}
