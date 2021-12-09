import type { NextPage } from "next";

import { createShop, addProduct } from "../lib/contractCalls";
import { useMetaMask } from "metamask-react";

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

  return (
    <div>
      <Login />
      <br />
      <br />

      <br />
      <button onClick={() => createShop("sush", "", [], ethereum)}>
        createShop
      </button>
      <br />
      <br />
      <button
        onClick={() =>
          addProduct(
            0,
            ["added using button"],
            "eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiIzMVFySGxTbWY2SGRXZFJtc2pVMjEvN1RrTmsxNlJJeSIsImVwaGVtUHVibGljS2V5IjoiTk9xY2hOWWF1dk1pVFhQRytyeUpreGhybVdEV3RQTjdXMEJKR1JtQUdCVT0iLCJjaXBoZXJ0ZXh0IjoibjZhL2hwUFBOaFppWHJWUjcrQmhNUVdtQTROUmdHUHZVSnYzS1FoWExZeGJ4T2E0N2p1UHdEMVdtU0tXSThDQiJ9",
            "0.01",
            100,
            ethereum
          )
        }
      >
        Add product
      </button>
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default appInfo;
