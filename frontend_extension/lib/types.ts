export interface ZkLoginSession {
  ephemeralPrivateKey: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce: string;
}

export interface DecodedJWT {
  iss?: string;
  sub: string;
  aud: string | string[];
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  email: string;
  nonce: string;
}
