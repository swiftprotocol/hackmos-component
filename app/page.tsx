"use client";

import { makeSignDoc, StdTx } from "@cosmjs/amino";
import { getWallet, useConnect, WalletType } from "graz";
import Image from "next/image";
import { useState } from "react";
import {
  GetResponseType as AuthorizationsGetResponse,
  SetResponseType as AuthorizationsSetResponse,
} from "@swiftprotocol/api/routes/notify/auth/types";

const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { connectAsync } = useConnect();

  async function signup() {
    if (!email) return;
    const isValidEmail = emailRegex.test(email);
    if (!isValidEmail) {
      alert("Invalid email address");
      return;
    }

    const key = await connectAsync({
      chainId: "cosmoshub-4",
      walletType: WalletType.KEPLR,
    });
    console.log(key);
    const address = key.accounts["cosmoshub-4"].bech32Address;

    const wallet = getWallet(WalletType.KEPLR);

    const authMsg =
      "I am signing this message to authorize ATOM Accelerator DAO to sign me up for an email newsletter.";

    let signDoc = makeSignDoc(
      [
        {
          type: "sign/MsgSignData",
          value: {
            signer: address,
            data: btoa(authMsg),
          },
        },
      ],
      {
        gas: "0",
        amount: [],
      },
      "",
      "",
      0,
      0
    );

    const sig = await wallet.signAmino("cosmoshub-4", address, signDoc);

    const walletSignature: StdTx = {
      msg: [
        {
          type: "sign/MsgSignData",
          value: {
            signer: address,
            data: btoa(authMsg),
          },
        },
      ],
      fee: { gas: "0", amount: [] },
      memo: "",
      signatures: [sig.signature],
    };

    const api = process.env.NEXT_PUBLIC_SWIFT_API!;
    const appId = parseInt(process.env.NEXT_PUBLIC_SWIFT_APP_ID!);

    const authorizationsResponse = await fetch(api + `/notify/auth/get`, {
      method: "POST",
      body: JSON.stringify({
        address: address,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let authorizations: AuthorizationsGetResponse["authorizations"];

    if (authorizationsResponse.status !== 200) {
      authorizations = [];
    } else {
      const auth: AuthorizationsGetResponse =
        await authorizationsResponse.json();
      authorizations = auth.authorizations;
    }

    const authIndex = authorizations.findIndex((auth) => auth.app === appId);
    if (authIndex >= 0) {
      authorizations[authIndex].methods = ["email"];
    } else {
      authorizations.push({
        app: appId,
        methods: ["email"],
      });
    }

    const setAuthorizationsResponse = await fetch(api + `/notify/auth/set`, {
      method: "POST",
      body: JSON.stringify({
        signature: walletSignature,
        authorizations: authorizations,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (setAuthorizationsResponse.status !== 200) {
      throw new Error("Failed to set authorizations");
    } else {
      setIsSubscribed(true);
    }
  }
  return (
    <main className="mt-16 max-w-4xl mx-auto">
      {isSubscribed ? (
        <div className="bg-blue-700 rounded-xl p-8">
          <p className="text-white font-semibold text-3xl">
            Thank you for subscribing!
          </p>
          <p className="text-white text-sm mt-2">
            You should receive your first newsletter soon.
          </p>
        </div>
      ) : (
        <div className="bg-blue-700 rounded-xl pt-8 px-8 flex flex-row justify-between items-start">
          <div className="pr-8">
            <p className="text-white font-semibold text-3xl">
              Sign up for our newsletter
            </p>
            <p className="text-white text-sm mt-2">
              Receive <b>monthly updates</b> from the ATOM Accelerator DAO with
              detailed information on your delegations and latest governance
              happenings.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <input
                className="border-white/25 text-white bg-white/10 rounded-xl border px-4"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <button
                onClick={signup}
                className="bg-white hover:text-white hover:bg-white/10 border border-transparent hover:border-white/25 rounded-xl px-6 py-4 text-black inline-flex font-medium justify-center items-center flex-row space-x-2"
              >
                <Image
                  src="/keplr.svg"
                  width={256}
                  height={256}
                  className="w-6 h-6"
                  alt="Keplr"
                />
                <p>Sign up with Keplr</p>
              </button>
            </div>
            <span className="text-xs inline-flex space-x-2 mt-6 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                className="size-4 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
              <p>
                Your email address will be encrypted using a temporary key,
                which will be deleted immediately after encryption. Only{" "}
                <b>ATOM Accelerator DAO</b> (sw-app-3) will be able to decrypt
                your information.
              </p>
            </span>
          </div>
          <div className="flex flex-col justify-between flex-shrink-0">
            <div></div>
            <Image
              width={1080}
              height={1006}
              loading="eager"
              src="/newsletter.png"
              alt="Newsletter"
              className="h-64 w-auto"
            />
          </div>
        </div>
      )}
    </main>
  );
}
