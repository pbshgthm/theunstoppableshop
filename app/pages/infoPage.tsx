import type { NextPage } from "next";

import {
  useShopId,
  getShopList,
  getShop,
  getProductList,
  getProduct,
  getSale,
  getBuyerSales,
  useOwnerShopInfo,
  useGuildInfo,
  useRecentSales,
  useApiPublicKey,
  useCachedPublicKey,
} from "../lib/spiceHooks";
import { createShop, addProduct } from "../lib/contractCalls";
import { useMetaMask } from "metamask-react";
import { useState } from "react";
import { ethers } from "ethers";

const rpcApi =
  "https://polygon-mumbai.g.alchemy.com/v2/9rE76R64EAB61z4CE3BTnMwza-7R4HiV";

const provider = new ethers.providers.JsonRpcProvider(rpcApi);

function Login() {
  const { status, connect, account } = useMetaMask();

  if (status === "initializing") return <div>syncing metamask...</div>;

  if (status === "unavailable") return <div>metaMask not available</div>;

  if (status === "notConnected")
    return <button onClick={connect}>connect to metamask</button>;

  if (status === "connecting") return <div>connecting...</div>;

  if (status === "connected") return <div>connected account: {account}</div>;

  return null;
}

const appInfo: NextPage = () => {
  const { status, connect, account, ethereum } = useMetaMask();
  const { data: shopId, error: shopIdError } = useShopId("sushi");
  const { data: shopList } = getShopList();

  const { data: shopData } = getShop(0);
  const { data: productList } = getProductList(0);
  const { data: productData } = getProduct(0, 0, 1);
  const { data: saleData } = getSale(
    0,
    0,
    "0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70"
  );

  const { data: buyerSales } = getBuyerSales(
    "0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70"
  );
  const { data: ownerShopInfo, error: ownerShopError } = useOwnerShopInfo(
    "0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70"
  );

  const { data: guildInfo, error: guildError } = useGuildInfo();

  const { data: recentSales, error: recentSalesError } = useRecentSales(0);

  const { data: apiPublicKey, error: apiError } = useApiPublicKey();

  const { data: cachedPublicKey, error: cachedError } = useCachedPublicKey(
    "0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70"
  );
  console.log("Existing", cachedPublicKey);

  // async function getShopData() {
  //   const saleIds = useRecentSales(0);
  //   console.log(saleIds);
  // }

  // getShopData();

  return (
    <div>
      <Login />
      <br />
      <br />
      ShopId of 'sushi':{shopIdError ? shopIdError.message : shopId}
      <br />
      <br />
      <br />
      getShopList (all shops)
      <br />
      <br />
      {shopList && <pre>{JSON.stringify(shopList, null, 2)}</pre>}
      <br />
      <br />
      getShop(0):
      <br />
      <br />
      {shopData && <pre>{JSON.stringify(shopData, null, 2)}</pre>}
      <br />
      <br />
      getProductList(0):
      <br />
      <br />
      {productList && <pre>{JSON.stringify(productList, null, 2)}</pre>}
      <br />
      <br />
      getProduct(0,0,1):
      <br />
      <br />
      {productData && <pre>{JSON.stringify(productData, null, 2)}</pre>}
      <br />
      <br />
      getSale(0,0,0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70):
      <br />
      <br />
      {saleData && <pre>{JSON.stringify(saleData, null, 2)}</pre>}
      <br />
      <br />
      getBuyerSales(0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70):
      <br />
      <br />
      {buyerSales && <pre>{JSON.stringify(buyerSales, null, 2)}</pre>}
      <br />
      <br />
      getOwnerShopInfo(0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70):
      <br />
      <br />
      {ownerShopInfo ? (
        <pre>{JSON.stringify(ownerShopInfo, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(ownerShopError)}</pre>
      )}
      <br />
      <br />
      getGuildInfo
      <br />
      <br />
      {guildInfo && <pre>{JSON.stringify(guildInfo, null, 2)}</pre>}
      <br />
      <br />
      getRecentSales(0):
      <br />
      <br />
      {recentSales && <pre>{JSON.stringify(recentSales, null, 2)}</pre>}
      {recentSalesError && (
        <pre>{JSON.stringify(recentSalesError, null, 2)}</pre>
      )}
      <br />
      <br />
    </div>
  );
};

export default appInfo;
