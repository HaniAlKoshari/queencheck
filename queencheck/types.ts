
export interface ScanRecord {
  id: string;
  timestamp: Date;
  status: 'valid' | 'duplicate' | 'invalid';
}

export type ScanStatus = 'idle' | 'success' | 'error-duplicate' | 'error-invalid';

export interface AppStats {
  totalPossible: number;
  totalScanned: number;
  remaining: number;
}
