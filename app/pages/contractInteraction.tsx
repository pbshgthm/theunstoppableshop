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
import sigUtils from "@metamask/eth-sig-util";
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
  const guildAddress = "0xd5c879EfDB2C9174165C493639cf8B40EaCE09f1";
  const { status, connect, account, ethereum } = useMetaMask();

  async function signData(hash: string | null) {
    const sign = await ethereum.request({
      method: "personal_sign",
      params: [account, hash],
    });
    console.log(sign);
    // sigUtils.signTypedData({
    //   data: account,
    //   privateKey: Buffer.from(
    //
    //     "utf8"
    //   ),
    // });
  }

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
        getEmbedding
      </button>
      <br />
      <br />
      <button
        onClick={async () =>
          await signData(
            "0x264bc59dc56a96d1f7e5e885cb8f0d4d7f95889b36100c770da2603edcde59d7"
          )
        }
      >
        signMessageHash
      </button>
      <br />
      <br />
    </div>
  );
};
// 0x682ec112fe5d1d2a44d542aa8ebda59d2c6e87f17e74501da625de7e955b8f2d262566c098710c48435ee08b6c7755045adb859f1365af0526df3187bc3df97f1b;
export default appInfo;

// flow: get message hash from contract, sign it, send to contract for verification
