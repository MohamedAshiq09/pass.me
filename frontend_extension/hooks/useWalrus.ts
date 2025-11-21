import { useState, useCallback } from 'react';

// Mock types for development
interface WalrusUploadResponse {
  blobId: string;
  url: string;
  size: number;
  storedEpochs: number;
}

interface WalrusDownloadResponse {
  data: ArrayBuffer;
  blobId: string;
}

// Mock implementations
const uploadToWalrus = async (data: string | ArrayBuffer): Promise<WalrusUploadResponse> => {
  // Mock upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    blobId: 'mock-blob-' + Date.now(),
    url: 'https://mock-walrus-url.com',
    size: typeof data === 'string' ? data.length : data.byteLength,
    storedEpochs: 100,
  };
};

const downloadFromWalrus = async (blobId: string): Promise<WalrusDownloadResponse> => {
  // Mock download
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockData = new TextEncoder().encode('mock-data');
  return {
    data: mockData.buffer,
    blobId,
  };
};

const checkBlobExists = async (blobId: string): Promise<boolean> => {
  // Mock check
  await new Promise(resolve => setTimeout(resolve, 200));
  return blobId.startsWith('mock-blob-');
};

export function useWalrus() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (data: string | ArrayBuffer): Promise<WalrusUploadResponse | null> => {
    try {
      setIsUploading(true);
      setError(null);
      
      const result = await uploadToWalrus(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const download = useCallback(async (blobId: string): Promise<WalrusDownloadResponse | null> => {
    try {
      setIsDownloading(true);
      setError(null);
      
      const result = await downloadFromWalrus(blobId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const checkExists = useCallback(async (blobId: string): Promise<boolean> => {
    try {
      setError(null);
      return await checkBlobExists(blobId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Check failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    download,
    checkExists,
    isUploading,
    isDownloading,
    error,
    clearError,
  };
}