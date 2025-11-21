// zkLogin Types
export interface ZkLoginSession {
  jwt: string;
  salt: string;
  maxEpoch: number;
  randomness: string;
  ephemeralKeyPair: {
    publicKey: string;
    privateKey: string;
  };
  userAddress: string;
}