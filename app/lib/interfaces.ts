interface SaleDeets {
 shopId: number,
 saleId: number,   
}

interface ProductDeets{
    shopId: number,
    productId: number,
}


enum swrKeys {
    useShopId= "useShopId",
    useOwnerShopInfo = "useOwnerShopInfo",
    useGuildInfo = "useGuildInfo",
    useRecentSales= "useRecentSales",
    useApiPublicKey = "useApiPublicKey",
    useCachedPublicKey = "useCachedPublicKey",
}
export type {SaleDeets, ProductDeets};
export {swrKeys};