import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isProcessing }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<{ message: string; type: string } | null>(null);
  
  const internalProcessingRef = useRef(false);
  useEffect(() => {
    internalProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const startScanner = useCallback(async () => {
    // التأكد من وجود الحاوية قبل البدء
    const readerElement = document.getElementById("reader");
    if (!readerElement) return;

    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewWidth: number, viewHeight: number) => {
          // التأكد من أن الحجم لا يقل عن 50 بكسل لتجنب خطأ المكتبة
          const calculatedSize = Math.min(viewWidth, viewHeight) * 0.75;
          const finalSize = Math.max(Math.floor(calculatedSize), 150); 
          // إذا كان عرض الشاشة صغيراً جداً، نضمن أن القيمة لا تقل عن 50 أبداً
          const safeSize = Math.min(finalSize, viewWidth - 20, viewHeight - 20);
          return { 
            width: Math.max(safeSize, 50), 
            height: Math.max(safeSize, 50) 
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (!internalProcessingRef.current) {
            onScan(decodedText);
          }
        },
        () => {}
      );
      setHasPermission(true);
      setError(null);
    } catch (err: any) {
      console.error("Scanner Error:", err);
      if (err.toString().includes("Permission")) {
        setHasPermission(false);
        setError({ message: "يرجى منح صلاحية الكاميرا", type: "auth" });
      } else {
        setError({ message: "فشل في تشغيل الكاميرا - يرجى المحاولة مرة أخرى", type: "tech" });
      }
    }
  }, [onScan]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.warn);
      }
    };
  }, [startScanner]);

  return (
    <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-[3.5rem] shadow-2xl border-[12px] border-white bg-neutral-900 transition-all duration-500">
      <div id="reader" className="w-full h-full"></div>
      
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-900/95 p-8 text-center backdrop-blur-xl">
          <p className="text-white font-bold mb-4">{error.message}</p>
          <button 
            onClick={() => startScanner()}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
          >
            إعادة محاولة
          </button>
        </div>
      )}

      {!error && hasPermission && (
        <>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-64 h-64 border-2 border-white/10 rounded-[3rem] relative animate-pulse">
              <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-blue-500 rounded-tl-[2rem] -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-blue-500 rounded-tr-[2rem] -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-blue-500 rounded-bl-[2rem] -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-blue-500 rounded-br-[2rem] -mb-1 -mr-1"></div>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/50 shadow-[0_0_15px_blue] animate-scan-line pointer-events-none z-10"></div>
        </>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
