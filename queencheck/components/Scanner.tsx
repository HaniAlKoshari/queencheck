
import React, { useEffect, useRef } from 'react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isProcessing }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const Html5QrcodeScanner = (window as any).Html5QrcodeScanner;
    
    if (Html5QrcodeScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 15, 
          qrbox: (viewWidth: number, viewHeight: number) => {
            const size = Math.min(viewWidth, viewHeight) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true
        },
        false
      );

      scanner.render((decodedText: string) => {
        if (!isProcessing) {
          onScan(decodedText);
        }
      }, () => {});

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, isProcessing]);

  return (
    <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-3xl shadow-2xl border-[6px] border-white bg-[#000]">
      <div id="reader" className="w-full h-full overflow-hidden"></div>
      {/* Laser line animation overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_blue] opacity-50 animate-scan-line pointer-events-none"></div>
    </div>
  );
};

export default Scanner;
