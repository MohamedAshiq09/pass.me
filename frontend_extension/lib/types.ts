/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ZkLoginSession {
  ephemeralPrivateKey: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce?: string;
}

export interface ZkLoginState {
  address: string;
  jwtToken: string;
  zkProof: any;
  ephemeralKeyPair: any;
  randomness: string;
  maxEpoch: number;
  userSalt: string;
}

export interface DecodedJWT {
  iss: string;
  azp: string;
  aud: string | string[];
  sub: string;
  email: string;
  email_verified: boolean;
  nonce: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

export interface AuthData {
  address: string;
  zkProof: any;
  jwtToken: string;
  userSalt: string;
  ephemeralPrivateKey: string;
  maxEpoch: number;
  randomness: string;
}
