// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

// inheriting storage contract
import "./Storage.sol";

contract Shop is Storage {
    modifier onlyGuild() {
        require(msg.sender == guildAddress);
        _;
    }

    // make all the functions onlyGuild.

    // all these modifiers not required. Will be filtered at guild itself.
    // modifier onlyOwner() {
    //     require(msg.sender == shopOwner);
    //     // require(msg.sender == shopOwner);
    //     _;
    // }

    // modifier onlyManager() {
    //     require(msg.sender == shopOwner || msg.sender == houseKeeper);
    //     _;
    // }

    // modifier onlyBuyer(uint256 _saleId) {
    //     uint256 saleIndex = saleIdToIndex[_saleId];
    //     Sale memory sale = sales[saleIndex];
    //     require(msg.sender == sale.buyerAddress);
    //     _;
    // }

    // modifier onlyResolver() {
    //     require(msg.sender == resolver);
    //     _;
    // }

    // if no housekeeper, set as address(0)
    constructor(
        address _houseKeeper,
        address _resolver,
        address _shopOwner,
        string memory _shopName
    ) {
        shopOwner = _shopOwner;
        houseKeeper = _houseKeeper;
        resolver = _resolver;
        shopName = _shopName;
        guildAddress = msg.sender;
        products.push(
            Product({
                productId: 0,
                contentAddress: "",
                descAddress: "",
                liscenseHash: "",
                price: 0,
                saleCount: 0,
                isAvailable: false
            })
        );
        sales.push(
            Sale({
                saleId: 0,
                buyerAddress: address(0),
                pubKey: "",
                productId: 0,
                amount: 0,
                responseDeadline: 0,
                confirmationDeadline: 0,
                encryptedLiscense: "",
                isKeeperResponse: false,
                disputeDcryptLiscense: "",
                saleState: SaleState.Genesis
            })
        );
    }

    // Product Id starts at 1
    function addProduct(
        string memory _contentAddress,
        string memory _descAddress,
        string memory _liscenseHash,
        uint256 _price
    ) public onlyGuild {
        productCount++;
        Product memory product = Product({
            productId: productCount,
            contentAddress: _contentAddress,
            descAddress: _descAddress,
            liscenseHash: _liscenseHash,
            price: _price,
            saleCount: 0,
            isAvailable: true
        });
        products.push(product);
        productIdToIndex[product.productId] = products.length - 1;
    }

    // Sale Id starts at 1
    function requestSale(
        uint256 _productId,
        string memory _pubKey,
        address _buyerAddress
    ) public payable onlyGuild {
        uint256 productIndex = productIdToIndex[_productId];
        Product memory product = products[productIndex];
        require(product.isAvailable);
        require(msg.value >= product.price);
        // refund if require fails??

        saleCount++;
        Sale memory sale = Sale({
            saleId: saleCount++,
            buyerAddress: _buyerAddress,
            pubKey: _pubKey,
            productId: _productId,
            amount: msg.value,
            responseDeadline: block.timestamp + responseDeadlineTime,
            confirmationDeadline: 0,
            encryptedLiscense: "",
            isKeeperResponse: false,
            disputeDcryptLiscense: "",
            saleState: SaleState.Requested
        });
        sales.push(sale);
        saleIdToIndex[sale.saleId] = sales.length - 1;
    }

    function respondToSale(
        uint256 _saleId,
        string memory _encryptedLiscense,
        address _managerAddress
    ) public onlyGuild {
        // prevent owner from buying
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale storage sale = sales[saleIndex];

        require(block.timestamp < sale.responseDeadline);
        require(sale.saleState == SaleState.Requested);

        sale.encryptedLiscense = _encryptedLiscense;
        sale.confirmationDeadline = block.timestamp + confirmationDeadlineTime;
        sale.saleState = SaleState.Responded;

        if (_managerAddress == houseKeeper) {
            sale.isKeeperResponse = true;
        }
    }

    function confirmSale(uint256 _saleId) public onlyGuild {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale storage sale = sales[saleIndex];

        require(block.timestamp < sale.confirmationDeadline);
        require(sale.saleState == SaleState.Responded);
        closeSale(_saleId);
    }

    function claimDispute(uint256 _saleId, string memory _decryptedLiscense)
        public
        onlyGuild
    {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale storage sale = sales[saleIndex];

        require(block.timestamp < sale.confirmationDeadline);
        require(sale.saleState == SaleState.Responded);

        sale.disputeDcryptLiscense = _decryptedLiscense;
        sale.saleState = SaleState.Disputed;

        //Product memory product = products[sale.productId];
        // call chainlink with (sale.publicKey, sale.encryptedLiscense, sale.disputeDcryptLiscense, product._liscenseHash)
    }

    // GAS DRINKING CODE
    function settleDispute(uint256 _saleId, bool _isValidClaim)
        public
        onlyGuild
    {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale memory sale = sales[saleIndex];

        require(sale.saleState == SaleState.Disputed);

        if (_isValidClaim) {
            if (sale.isKeeperResponse) {
                // FIRE THE HOUSE KEEPER
            } else {
                // BURN DOWN THE SHOP
            }
            (bool sent, ) = sale.buyerAddress.call{value: sale.amount}("");
            require(sent, "Failed to send ether to buyer");
        } else {
            closeSale(_saleId);
            // BAN BUYER
        }
    }

    function closeSale(uint256 _saleId) internal {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale memory sale = sales[saleIndex];

        require(sale.saleState != SaleState.Genesis);

        uint256 keeperShare = 0;
        if (sale.isKeeperResponse) {
            keeperShare = (sale.amount * keeperFeePercent) / 100;
        }
        ownerBalance += sale.amount - keeperShare;
        keeperBalance += keeperShare;
        successSale++;

        uint256 productIndex = productIdToIndex[sale.productId];
        products[productIndex].saleCount++;

        sales[saleIndex] = sales[sales.length - 1];
        sales.pop();
        saleIdToIndex[sales[saleIndex].saleId] = saleIndex;
    }

    // GAS DRINKING CODE
    function noResponseRefund(uint256 _saleId) public payable onlyGuild {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale memory sale = sales[saleIndex];

        require(block.timestamp > sale.responseDeadline);
        require(sale.saleState == SaleState.Requested);

        uint256 refundAmount = sale.amount;
        address buyerAddress = sale.buyerAddress;

        sales[saleIndex] = sales[sales.length - 1];
        sales.pop();
        saleIdToIndex[sales[saleIndex].saleId] = saleIndex;

        (bool sent, ) = buyerAddress.call{value: refundAmount}("");
        require(sent, "Failed to send refund to buyer");
    }

    // GAS DRINKING CODE
    function autoConfirmation(uint256 _saleId) public payable {
        uint256 saleIndex = saleIdToIndex[_saleId];
        Sale storage sale = sales[saleIndex];

        require(block.timestamp > sale.confirmationDeadline);
        require(sale.saleState == SaleState.Responded);

        closeSale(_saleId);
    }

    // GAS DRINKING CODE
    function withdraw(uint256 _amount) public payable onlyGuild {
        if (msg.sender == houseKeeper) {
            require(keeperBalance > _amount);
            keeperBalance -= _amount;
            (bool sent, ) = houseKeeper.call{value: _amount}("");
            require(sent, "Failed to pay housekeeper");
        } else {
            require(ownerBalance > _amount);
            ownerBalance -= _amount;
            (bool sent, ) = shopOwner.call{value: _amount}("");
            require(sent, "Failed to pay shop owner");
        }
    }

    function shelfProduct(uint256 _productId) public onlyGuild {
        uint256 productIndex = productIdToIndex[_productId];
        Product storage product = products[productIndex];
        product.isAvailable = false;
    }

    function updatePrice(uint256 _productId, uint256 _price) public onlyGuild {
        uint256 productIndex = productIdToIndex[_productId];
        Product storage product = products[productIndex];
        product.price = _price;
    }

    function getOpenSales() external view returns (Sale[] memory) {
        return sales;
        //send in batches of 100
    }

    function getAllProducts() external view returns (Product[] memory) {
        return products;
        //send in batches of 100
    }

    function getOpenSalesByProduct(uint256 _productId)
        external
        view
        returns (Sale[] memory)
    {
        return filterSales(SaleFilterType.productId, address(0), _productId);
    }

    function getOpenSalesByBuyer(address _buyerAddress)
        external
        view
        returns (Sale[] memory)
    {
        return filterSales(SaleFilterType.buyerId, _buyerAddress, 0);
    }

    function filterSales(
        SaleFilterType _filterType,
        address _buyerAddress,
        uint256 _productId
    ) public view returns (Sale[] memory) {
        uint256 filteredSalesCount = 0;

        for (uint256 i = 0; i < sales.length; i++) {
            Sale memory sale = sales[i];
            if (_filterType == SaleFilterType.buyerId) {
                if (sale.buyerAddress == _buyerAddress) {
                    filteredSalesCount++;
                }
            } else if (_filterType == SaleFilterType.productId) {
                if (sale.productId == _productId) {
                    filteredSalesCount++;
                }
            }
        }

        Sale[] memory filteredSales = new Sale[](filteredSalesCount);
        uint256 filteredIndex = 0;
        for (uint256 i = 0; i < sales.length; i++) {
            Sale memory sale = sales[i];
            if (_filterType == SaleFilterType.buyerId) {
                if (sale.buyerAddress == _buyerAddress) {
                    filteredSales[filteredIndex] = sale;
                    filteredIndex++;
                }
            } else if (_filterType == SaleFilterType.productId) {
                if (sale.productId == _productId) {
                    filteredSales[filteredIndex] = sale;
                    filteredIndex++;
                }
            }
        }
        return filteredSales;
    }
}
