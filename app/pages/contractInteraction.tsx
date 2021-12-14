import type { NextPage } from "next";

import {
  createShop,
  addProduct,
  checkoutCart,
  addRating,
  addMumbai,
} from "../lib/contractCalls";

import { getEmbedding } from "../lib/spiceHooks";
import { useMetaMask } from "metamask-react";
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
      {/* <button
        onClick={async () =>
          await checkoutCart(
            [
              {
                shopId: 0,
                productId: 0,
                amount: "0.001",
              },
            ],
            "bW5KZDNRSWZFREIrcFlDOHJ2Nk55dTNvM3pqUnlCbHpDZ3dMb1pTQXBFRT0=",
            0,
            "0.001",
            ethereum
          )
        }
      >
        Checkout Cart
      </button> */}
      <br />
      <br />
      {/* <button onClick={async () => await addMumbai(ethereum)}>
        Add mumbai
      </button> */}
      <br />
      <br />
      <button onClick={() => getEmbedding(0, 0, "0.0021", ethereum)}>
        getSignature
      </button>
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default appInfo;

{
  /* 
 [[0, 0, ethers.utils.parseEther("0.0001")]],
    "",
    0,
    { value: ethers.utils.parseEther("0.0001") } */
}

{
  /* cartItems: CartItems[], */
}
{
  /* publicKey: string, */
}
{
  /* redeemCredits: number, */
}
{
  /* totalAmount: number, */
}
{
  /* ethereum: ethers.providers.ExternalProvider */
}
