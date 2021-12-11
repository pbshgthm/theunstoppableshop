import type { NextPage } from "next";

import { createShop, addProduct, checkoutCart } from "../lib/contractCalls";
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
      <button>createShop</button>
      <br />
      <br />
      {/* <button onClick={checkoutCart}>Checkout Cart</button> */}

      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default appInfo;
