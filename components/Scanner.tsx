import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isProcessing }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
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
      /* verbose= */ false
    );

    scanner.render((decodedText: string) => {
      if (!isProcessing) {
        onScan(decodedText);
      }
    }, (error) => {
      // الصمت عند فشل المسح اللحظي لتحسين الأداء
    });

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear error:", err));
      }
    };
  }, [onScan, isProcessing]);

  return (
    <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-3xl shadow-2xl border-[6px] border-white bg-[#000]">
      <div id="reader" className="w-full h-full overflow-hidden"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_blue] opacity-50 animate-scan-line pointer-events-none"></div>
    </div>
  );
};

export default Scanner;