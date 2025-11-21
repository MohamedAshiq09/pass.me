// Extension Message Types
export type ExtensionMessageType =
  | 'GET_VAULT'
  | 'ADD_PASSWORD'
  | 'UPDATE_PASSWORD'
  | 'DELETE_PASSWORD'
  | 'GENERATE_PASSWORD'
  | 'AUTO_FILL'
  | 'LOCK_VAULT'
  | 'UNLOCK_VAULT'
  | 'SYNC_VAULT'
  | 'GET_ALERTS';

export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: any;
  requestId?: string;
}

export interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}