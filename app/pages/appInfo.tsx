import type { NextPage } from "next";
import {
  useEvents,
  sendEther,
  sendLink,
  useLinkBalance,
  useShopInfo,
  useProductInfo,
  useProductSaleInfo,
  tempProductSale,
} from "../lib/hooks";
import { useMetaMask } from "metamask-react";
import { useState } from "react";

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
  const { data: linkBalance } = useLinkBalance(account || "");
  const { data: events } = useEvents(account || "");
  const { data: shopInfos } = useShopInfo();
  const { data: productInfos } = useProductInfo(0);
  const { data: productSaleInfos } = useProductSaleInfo(0, 0);
  // console.log("product sale", productSaleInfos);

  // async function temp() {
  // const productSale = await tempProductSale(0, 0);
  // console.log("product sale", productSale);
  // }

  return (
    <div>
      <Login />
      <br />
      <br />
      ShopInfos:
      <br />
      {shopInfos &&
        shopInfos.map((shopInfo) => (
          <pre key={shopInfo.shopName}>{JSON.stringify(shopInfo, null, 2)}</pre>
        ))}
      <br />
      <br />
      ProductInfos:
      <br />
      {productInfos &&
        productInfos.map((productInfo) => (
          <pre key={productInfo.productId}>
            {JSON.stringify(productInfo, null, 2)}
          </pre>
        ))}
      <br />
      <br />
      ProductSaleInfos:
      <br />
      {productSaleInfos &&
        productSaleInfos.map((productSaleInfo) => (
          <pre key={productSaleInfo.productId}>
            {JSON.stringify(productSaleInfo, null, 2)}
          </pre>
        ))}
    </div>
  );
};

export default appInfo;
