import { useState } from "react";
import { getAddress, signTransaction } from "@stellar/freighter-api";
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Transaction,
} from "@stellar/stellar-sdk";

function App() {
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");

  const NETWORK = "Test SDF Network ; September 2015";
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");

  // 🔹 CONNECT WALLET
  const connectWallet = async () => {
    try {
      const { address } = await getAddress();
      setPublicKey(address);

      const account = await server.loadAccount(address);
      const xlmBalance = account.balances.find(
        (bal) => bal.asset_type === "native"
      );

      setBalance(xlmBalance.balance);
      setTxStatus("");
    } catch (error) {
      console.error("Connect Error:", error);
      alert("Wallet connection failed");
    }
  };

  // 🔹 SEND XLM
  const sendXLM = async () => {
    try {
      if (!receiver) {
        alert("Enter receiver public key");
        return;
      }

      if (!amount || Number(amount) <= 0) {
        alert("Enter valid amount");
        return;
      }

      if (Number(amount) > Number(balance)) {
        alert("Insufficient balance");
        return;
      }

      setTxStatus("Processing...");

      const account = await server.loadAccount(publicKey);

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK,
      })
        .addOperation(
          Operation.payment({
            destination: receiver,
            asset: Asset.native(),
            amount: amount,
          })
        )
        .setTimeout(100)
        .build();

      const { signedTxXdr } = await signTransaction(
        transaction.toXDR(),
        { networkPassphrase: NETWORK }
      );

      const signedTx = new Transaction(signedTxXdr, NETWORK);

      await server.submitTransaction(signedTx);

      setTxStatus("Transaction Successful ✅");

      // 🔄 Refresh balance
      const updatedAccount = await server.loadAccount(publicKey);
      const updatedBalance = updatedAccount.balances.find(
        (b) => b.asset_type === "native"
      );

      setBalance(updatedBalance.balance);
      setAmount("");

    } catch (error) {
      console.error("Transaction Error:", error);
      setTxStatus("Transaction Failed ❌");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Stellar White Belt 🚀</h1>

      <button onClick={connectWallet}>
        Connect Wallet
      </button>

      <p><strong>Your Public Key:</strong> {publicKey}</p>
      <p><strong>XLM Balance:</strong> {balance}</p>

      {publicKey && (
        <>
          <input
            type="text"
            placeholder="Receiver Public Key"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            style={{
              padding: "8px",
              width: "420px",
              marginTop: "10px"
            }}
          />

          <br /><br />

          <input
            type="number"
            placeholder="Enter Amount (XLM)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              padding: "8px",
              width: "200px"
            }}
          />

          <br /><br />

          <button onClick={sendXLM}>
            Send XLM
          </button>
        </>
      )}

      <p style={{ marginTop: "20px" }}>
        {txStatus}
      </p>
    </div>
  );
}

export default App;