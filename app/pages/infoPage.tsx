import type { NextPage } from "next";

import {
  getShopId,
  getShopList,
  getShop,
  getProductList,
  getProduct,
  getSale,
  getBuyerSales,
  getOwnerShops,
} from "../lib/spiceHooks";
import { createShop, addProduct } from "../lib/contractCalls";
import { useMetaMask } from "metamask-react";
import { useState } from "react";
import { ethers } from "ethers";

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
  const { data: shopId } = getShopId("sushi");
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

  async function getShopData() {
    const shopData = await getOwnerShops(
      "0xDa69589145AEBaa0cDae6dAC6512Db0363F44B70"
    );
    console.log(shopData);
  }

  getShopData();

  return (
    <div>
      <Login />
      <br />
      <br />
      ShopId of 'sushi':{parseInt(shopId)}
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
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default appInfo;
