export enum AppMode {
  SELECTION = 'SELECTION',
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
}

export interface TransferredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  blob: Blob;
}

export interface HistoryItem {
  id: string;
  file: File;
  preview: string;
  status: 'queued' | 'sending' | 'sent' | 'error';
  progress: number;
  errorMessage?: string;
}

export interface TransferPacket {
  type: 'meta' | 'file' | 'complete';
  payload?: any;
  meta?: {
    name: string;
    size: number;
    mime: string;
  };
}

// PeerJS global type definition workaround for script tag usage
declare global {
  interface Window {
    Peer: any;
  }
}