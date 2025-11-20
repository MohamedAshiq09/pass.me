import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Initialize Sui Client for Testnet
export const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});
