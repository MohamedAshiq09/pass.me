"use client";

import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "@/lib/sui-client";
// import { ZkLoginService } from "@/lib/zklogin"; // Commented out for development
import { SessionManager } from "@/lib/session-manager";
import { ArrowRight, Send } from "lucide-react";
import { colors } from "@/app/brand";

export default function ZkLoginTransactionTest() {
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [isExecuting, setIsExecuting] = useState(false);
  const [txDigest, setTxDigest] = useState("");
  const [error, setError] = useState("");
  const [userAddress, setUserAddress] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExecuteTransaction = async () => {
    try {
      setIsExecuting(true);
      setError("");
      setTxDigest("");

      // Get cached address for display
      const cached = SessionManager.getCachedProof();
      if (!cached || !cached.address) {
        throw new Error(
          "No zkLogin session found. Please sign in with zkLogin first."
        );
      }

      // IMPORTANT: Use the ephemeralPrivateKey from the cached proof!
      // The zkProof is tied to a specific ephemeral key pair.
      // We MUST use the same ephemeral private key that was used to generate the proof.
      if (!cached.ephemeralPrivateKey) {
        throw new Error(
          "Cached proof missing ephemeral private key. Please sign in again."
        );
      }

      setUserAddress(cached.address);

      // Validate receiver address
      if (
        !receiverAddress ||
        receiverAddress.length !== 66 ||
        !receiverAddress.startsWith("0x")
      ) {
        throw new Error(
          "Please enter a valid Sui address (starts with 0x, 66 characters)"
        );
      }

      // Recreate ephemeral key pair from cached proof
      // This MUST be the same key that was used to generate the zkProof!
      // const ephemeralKeyPair = ZkLoginService.recreateKeyPair(
      //   cached.ephemeralPrivateKey!
      // );
      throw new Error("zkLogin functionality disabled for development");

      // Create transaction
      const tx = new Transaction();
      // NOTE: Do NOT set sender before signing - tx.sign() will use ephemeral key's address
      // We'll set the correct zkLogin sender when we build the transaction

      // Convert SUI to MIST (1 SUI = 1e9 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 1e9);

      console.log("🔐 zkLogin Transaction Test:");
      console.log("  From:", cached.address);
      console.log("  To:", receiverAddress);
      console.log("  Amount:", amount, "SUI");

      // Split and transfer
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      tx.transferObjects([coin], receiverAddress);

      // For zkLogin, we need to set the sender BEFORE building
      tx.setSender(cached.address);

      // Build the transaction (don't sign yet)
      console.log("Building transaction...");
      const txBytes = await tx.build({ client: suiClient });

      // Sign with ephemeral key
      // Sign with ephemeral key
      console.log("Signing with ephemeral key...");
      const { signature: ephemeralSignature } =
        await ephemeralKeyPair.signTransaction(txBytes);

      // Verify that we have all required cached data
      if (!cached.jwtToken || !cached.userSalt) {
        throw new Error(
          "Cached proof is missing JWT token or user salt. Please sign in again."
        );
      }

      // Note: We don't need to re-verify the address here
      // The address was computed from Enoki's addressSeed during login
      // and is cryptographically tied to the zkProof
      console.log("Using cached zkLogin address:", cached.address);

      // Create zkLogin signature using cached proof data
      console.log("Creating zkLogin signature from cached proof...");
      // const zkLoginSignature = ZkLoginService.getTransactionSignature({
      //   ephemeralSignature,
      //   useCache: true, // Use cached proof data (includes zkProof, jwtToken, userSalt)
      // });
      throw new Error("zkLogin functionality disabled for development");

      // Execute transaction
      console.log("Executing transaction on testnet...");
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log("✅ Transaction successful!");
      setTxDigest(result.digest);
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${colors.darkNavy} 0%, ${colors.darkerNavy} 100%)`,
        border: `1px solid ${colors.primary}40`,
      }}
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}40)`,
          }}
        >
          <Send className="w-6 h-6" style={{ color: colors.primary }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.white }}>
            zkLogin Transaction Test
          </h2>
          <p className="text-sm" style={{ color: colors.lightBlue }}>
            Test zkLogin on Testnet
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: `rgba(239, 68, 68, 0.1)`,
            borderColor: "rgb(239, 68, 68)",
          }}
        >
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {txDigest && (
        <div
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: `${colors.primary}10`,
            borderColor: colors.primary,
          }}
        >
          <p
            className="text-sm font-semibold mb-2"
            style={{ color: colors.white }}
          >
            Transaction Successful! ✅
          </p>
          <div className="flex items-center justify-between gap-2">
            <p
              className="font-mono text-xs break-all"
              style={{ color: colors.lightBlue }}
            >
              {txDigest}
            </p>
            <button
              onClick={() => copyToClipboard(txDigest)}
              className="flex-shrink-0 p-2 hover:opacity-80 transition-opacity"
              style={{ color: colors.primary }}
            >
              📋
            </button>
          </div>
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 text-sm font-medium hover:underline"
            style={{ color: colors.primary }}
          >
            View on Explorer
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}

      {/* User Address Display */}
      {userAddress && (
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: colors.lightBlue }}
          >
            Your zkLogin Address
          </label>
          <div
            className="px-4 py-2 rounded-lg font-mono text-xs"
            style={{
              backgroundColor: `${colors.primary}10`,
              color: colors.white,
            }}
          >
            {userAddress}
          </div>
        </div>
      )}

      {/* Form */}
      {!txDigest && (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.white }}
            >
              Receiver Address
            </label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-lg border-2 focus:ring-2 transition-all font-mono text-sm"
              style={{
                backgroundColor: `${colors.darkNavy}`,
                borderColor: `${colors.primary}30`,
                color: colors.white,
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.white }}
            >
              Amount (SUI)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0.001"
              className="w-full px-4 py-3 rounded-lg border-2 focus:ring-2 transition-all font-mono"
              style={{
                backgroundColor: `${colors.darkNavy}`,
                borderColor: `${colors.primary}30`,
                color: colors.white,
              }}
            />
          </div>

          <div
            className="p-4 rounded-lg text-sm"
            style={{
              backgroundColor: `rgba(234, 179, 8, 0.1)`,
              color: "rgb(234, 179, 8)",
            }}
          >
            <p className="font-semibold mb-1">⚠️ Note:</p>
            <p>Make sure your address has testnet SUI tokens!</p>
            <p className="text-xs mt-2">
              Get from Discord:{" "}
              <code>!faucet {userAddress || "YOUR_ADDRESS"}</code>
            </p>
          </div>

          <button
            onClick={handleExecuteTransaction}
            disabled={isExecuting || !receiverAddress}
            className="w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: colors.gradients.primary,
              color: colors.white,
            }}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Executing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Transaction
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
