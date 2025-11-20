import { SuiClient, SuiHTTPTransport } from '@mysten/sui.js/client';
import { config } from './env';

export const suiConfig = {
  network: config.SUI_NETWORK,
  rpcUrl: config.SUI_RPC_URL,
  packageId: config.VAULT_PACKAGE_ID,
  modules: {
    vault: 'vault',
    passwordEntry: 'password_entry',
    alertSystem: 'alert_system',
    accessControl: 'access_control',
    recovery: 'recovery',
    zkloginIntegration: 'zklogin_integration',
  },
};

// Create Sui client instance
export const createSuiClient = (): SuiClient => {
  return new SuiClient({
    transport: new SuiHTTPTransport({
      url: config.SUI_RPC_URL,
    }),
  });
};

export default suiConfig;