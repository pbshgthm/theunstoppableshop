// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

contract Shop {
    struct Product {
        uint256 productId;
        string contentCId;
        string detailsCId;
        string licenseHash;
        string lockedLicense;
        uint256 price;
        uint256 stock;
        uint256 ratingsCount;
        uint256 ratingsSum;
        uint256 salesCount;
        bool isAvailable;
    }

    struct Sale {
        uint256 saleId;
        address buyer;
        string publicKey;
        uint256 productId;
        uint256 amount;
        uint256 saleDeadline;
        string unlockedLicense;
        uint8 rating; // struct packing
        SaleStatus status;
    }

    struct ShopInfo {
        address guild;
        address owner;
        uint256 shopBalance;
        string detailsCId;
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

    string public detailsCId;
    string public shopName;

    uint256 public productsCount = 0;
    uint256 public salesCount = 0;
    uint256 public shopBalance;
    uint256 public ownerSharePercent;

    uint256[] public openSaleIds;
    uint256[] public closeSaleIds;

    Product[] public products;

    mapping(uint256 => Sale) public sales;
    mapping(uint256 => uint256) public openSaleIdToIndex;
    mapping(address => uint256) public beneficiarySharePercent;
    mapping(address => uint256) public beneficiaryBalance;

    modifier onlyGuild() {
        require(msg.sender == guild, "Only guild can call this function");
        _;
    }

    event ProductCreated(string indexed shopName, uint256 productId);
    event RequestedSale(
        string indexed shopName,
        uint256 productId,
        uint256 saleId
    );

    event SaleClosed(string indexed shopName, uint256 productId);
    event Refunded(string indexed shopId, uint256 saleId);
    event PriceChanged(uint256 shopId, uint256 productId, uint256 newPrice);

    constructor(
        address _owner,
        address _guild,
        string memory _shopName,
        string memory _detailsCId
    ) {
        guild = _guild;
        owner = _owner;
        detailsCId = _detailsCId;
        shopName = _shopName;
        ownerSharePercent = 100;
    }

    function addProduct(
        string memory _contentCId,
        string memory _detailsCId,
        string memory _licenseHash,
        string memory _lockedLicense,
        uint256 _price,
        uint256 _stock
    ) external onlyGuild {
        products.push(
            Product({
                productId: productsCount,
                contentCId: _contentCId,
                detailsCId: _detailsCId,
                licenseHash: _licenseHash,
                lockedLicense: _lockedLicense,
                price: _price,
                stock: _stock,
                salesCount: 0,
                ratingsCount: 0,
                ratingsSum: 0,
                isAvailable: true
            })
        );
        productsCount++;

        emit ProductCreated(shopName, productsCount - 1);
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
            saleId: salesCount,
            buyer: _buyer,
            publicKey: _publicKey,
            productId: _productId,
            amount: msg.value,
            saleDeadline: block.timestamp + 10000,
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
        closeSaleIds.push(_saleId);
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

        allocateAmount(sales[_saleId].amount);
        closeSaleIds.push(_saleId);

        openSaleIds[openSaleIdToIndex[_saleId]] = openSaleIds[
            openSaleIds.length - 1
        ];
        openSaleIds.pop();
        delete openSaleIdToIndex[_saleId];
    }

    function allocateAmount(uint256 _amount) internal {
        shopBalance += (ownerSharePercent * _amount) / 100;

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
        products[sales[_saleId].productId].ratingsCount++;
        products[sales[_saleId].productId].ratingsSum += _rating;
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
    ) external onlyGuild {
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

        require(
            totalShare + ownerSharePercent == 100,
            "Total share must be 100%"
        );
    }

    function withdrawBalance() public {
        uint256 tempShopBalance = shopBalance;
        shopBalance = 0;
        (bool sent, ) = owner.call{value: tempShopBalance}("");
        require(sent, "Error on withdraw");

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
                shopBalance: shopBalance,
                detailsCId: detailsCId,
                shopName: shopName,
                productsCount: productsCount,
                salesCount: salesCount
            });
    }

    function getOpenSaleIds() external view returns (uint256[] memory) {
        return openSaleIds;
    }

    function getClosedSaleIds() external view returns (uint256[] memory) {
        return closeSaleIds;
    }

    function getProductCount() external view returns (uint256) {
        return productsCount;
    }
}
