// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

contract Shop {
    struct Ratings {
        uint32[4] ratingsCount;
    }

    struct Beneficiary {
        address payable addr;
        uint8 share;
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
        string sellerLicense;
    }

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

    struct ShopInfo {
        address guild;
        address owner;
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

    enum RatingOptions {
        Unrated,
        Poor,
        Fair,
        Good,
        Excellent
    }

    ShopInfo shopInfo;

    Beneficiary[] beneficiaries;

    uint256[] openSaleIds;

    Product[] products;

    mapping(uint256 => Sale) sales;
    mapping(uint256 => uint256) openSaleIdToIndex;

    mapping(uint256 => mapping(address => uint256))
        public productDiscountPercent;

    mapping(uint256 => string) public productDiscountKey;
    modifier onlyGuild() {
        require(
            msg.sender == shopInfo.guild,
            "Only guild can call this function"
        );
        _;
    }

    constructor(
        address _owner,
        address _guild,
        string memory _shopName,
        string memory _detailsCId,
        Beneficiary[] memory _beneficiaries
    ) {
        setBeneficiary(_beneficiaries);

        shopInfo = ShopInfo({
            guild: _guild,
            owner: _owner,
            detailsCId: _detailsCId,
            shopName: _shopName,
            productsCount: 0,
            salesCount: 0
        });
    }

    function updateShopDetails(string memory _detailsCId) external onlyGuild {
        shopInfo.detailsCId = _detailsCId;
    }

    function addProduct(
        string[] memory _contentCID,
        string memory _lockedLicense,
        string memory _sellerLicense,
        uint256 _price,
        uint256 _stock,
        address _discountAddress,
        uint256 _discountPercent,
        string memory _encDiscountKey
    ) external onlyGuild {
        require(
            _contentCID.length == 1,
            "Product must have exactly one contentCID"
        );
        uint32[4] memory ratings;
        products.push(
            Product({
                contentCID: _contentCID,
                lockedLicense: _lockedLicense,
                price: _price,
                stock: _stock,
                salesCount: 0,
                revenue: 0,
                creationTime: block.timestamp,
                ratings: Ratings(ratings),
                isAvailable: true,
                sellerLicense: _sellerLicense
            })
        );

        productDiscountPercent[products.length - 1][
            _discountAddress
        ] = _discountPercent;
        productDiscountKey[products.length - 1] = _encDiscountKey;
        shopInfo.productsCount++;
    }

    function updateProduct(
        uint256 _productId,
        string memory _contentCID,
        uint256 _price,
        uint256 _stock,
        bool _isAvailable
    ) external onlyGuild {
        products[_productId].contentCID.push(_contentCID);
        products[_productId].price = _price;
        products[_productId].stock = _stock;
        products[_productId].isAvailable = _isAvailable;
    }

    function addDiscount(
        uint256 _productId,
        address _discountAddress,
        uint256 _percent
    ) external onlyGuild {
        require(
            _discountAddress != address(0),
            "Discount code must be a valid address"
        );
        require(
            _percent >= 0 && _percent <= 100,
            "Discount percent must be between 0 and 100"
        );

        productDiscountPercent[_productId][_discountAddress] = _percent;
    }

    function requestSale(
        address _buyer,
        uint256 _productId,
        string memory _publicKey
    ) external payable onlyGuild {
        require(_productId <= shopInfo.productsCount, "Product does not exist");
        require(
            products[_productId].salesCount < products[_productId].stock,
            "Product is out of stock"
        );
        require(products[_productId].isAvailable, "Product is not available");
        require(products[_productId].price <= msg.value, "Payment is too low");

        sales[shopInfo.salesCount] = Sale({
            buyer: _buyer,
            publicKey: _publicKey,
            productId: _productId,
            amount: msg.value,
            saleDeadline: block.timestamp + 2 minutes,
            unlockedLicense: "",
            rating: RatingOptions.Unrated,
            status: SaleStatus.Requested
        });
        openSaleIds.push(shopInfo.salesCount);
        openSaleIdToIndex[shopInfo.salesCount] = openSaleIds.length - 1;
        shopInfo.salesCount++;
    }

    function getRefund(uint256 _saleId) external payable onlyGuild {
        require(
            sales[_saleId].status == SaleStatus.Requested,
            "Sale request is fulfilled"
        );
        require(
            block.timestamp > sales[_saleId].saleDeadline,
            "Sale deadline hasn't yet passed"
        );

        sales[_saleId].status = SaleStatus.Refunded;

        openSaleIds[openSaleIdToIndex[_saleId]] = openSaleIds[
            openSaleIds.length - 1
        ];
        openSaleIds.pop();
        delete openSaleIdToIndex[_saleId];

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
            "Sale is already fulfilled"
        );
        require(
            sales[_saleId].saleDeadline > block.timestamp,
            "Sale deadline has already passed"
        );

        sales[_saleId].unlockedLicense = _unlockedLicense;
        sales[_saleId].status = SaleStatus.Completed;
        products[sales[_saleId].productId].revenue += sales[_saleId].amount;
        products[sales[_saleId].productId].salesCount++;
        makePayout(sales[_saleId].amount);

        openSaleIds[openSaleIdToIndex[_saleId]] = openSaleIds[
            openSaleIds.length - 1
        ];
        openSaleIds.pop();
        delete openSaleIdToIndex[_saleId];
        makePayout(sales[_saleId].amount);
    }

    function makePayout(uint256 amount) internal {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 beneficiaryCut = ((beneficiaries[i].share) * amount) / 100;
            (bool success, ) = beneficiaries[i].addr.call{
                value: beneficiaryCut
            }("");

            // works without require
            // require(success, "Error on withdraw");
        }
    }

    function addRating(uint256 _saleId, RatingOptions _rating)
        external
        onlyGuild
    {
        require(
            sales[_saleId].status == SaleStatus.Completed,
            "Sale is not completed or already rated"
        );
        require(_rating != RatingOptions.Unrated, "Rating is unrated");

        sales[_saleId].rating = _rating;
        sales[_saleId].status = SaleStatus.Rated;
        products[sales[_saleId].productId].ratings.ratingsCount[
            uint256(_rating) - 1
        ]++;
    }

    function setBeneficiary(Beneficiary[] memory _beneficiaries) internal {
        uint256 totalShare = 0;
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            require(
                _beneficiaries[i].share != 0,
                "beneficiary share cannot be 0"
            );
            require(
                _beneficiaries[i].addr != address(0),
                "beneficiary cannot be 0"
            );
            beneficiaries.push(_beneficiaries[i]);
            totalShare += _beneficiaries[i].share;
        }

        require(totalShare == 100, "Total share must be 100%");
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

    function getShopInfo()
        external
        view
        returns (ShopInfo memory, Beneficiary[] memory)
    {
        return (shopInfo, beneficiaries);
    }

    function getOwner() external view returns (address) {
        return shopInfo.owner;
    }

    function getProductsCount() external view returns (uint256) {
        return shopInfo.productsCount;
    }

    function getSalesCount() external view returns (uint256) {
        return shopInfo.salesCount;
    }

    function getOpenSaleIds() external view returns (uint256[] memory) {
        return openSaleIds;
    }

    function getProducts() external view returns (Product[] memory) {
        return products;
    }

    function getDiscountPercent(uint256 _productId, address _discountAddress)
        external
        view
        returns (uint256)
    {
        return productDiscountPercent[_productId][_discountAddress];
    }

    function getProductDiscountKey(uint256 _productId)
        external
        view
        returns (string memory)
    {
        return productDiscountKey[_productId];
    }
}
