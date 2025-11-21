// Walrus Types
export interface WalrusUploadResponse {
  blobId: string;
  url: string;
  size: number;
  storedEpochs: number;
}

export interface WalrusDownloadResponse {
  data: ArrayBuffer;
  blobId: string;
}