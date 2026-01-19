import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, isProcessing }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<{ message: string; type: 'auth' | 'tech' | 'busy' | 'not-found' } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const [restarts, setRestarts] = useState(0);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("[Scanner] Error stopping:", err);
      }
    }
  };

  const startScanner = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    setIsRetrying(false);

    try {
      // محاولة الوصول للكاميرا بشكل صريح أولاً
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      await stopScanner();
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewWidth: number, viewHeight: number) => {
          const size = Math.min(viewWidth, viewHeight) * 0.75;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (!isProcessing) {
            onScan(decodedText);
          }
        },
        () => {}
      );

      console.log(`[Scanner] Started. Retries so far: ${restarts}`);
    } catch (err: any) {
      console.error("[Scanner] Init failed:", err.name);
      
      let errorData: { message: string; type: 'auth' | 'tech' | 'busy' | 'not-found' };

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasPermission(false);
        errorData = { 
          message: "إذن الكاميرا مرفوض. يرجى تفعيل الصلاحية من إعدادات المتصفح للمتابعة.",
          type: 'auth' 
        };
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorData = { 
          message: "الكاميرا قيد الاستخدام من تطبيق آخر أو معطلة برمجياً. سنحاول إعادة الاتصال...",
          type: 'busy' 
        };
      } else if (err.name === 'NotFoundError') {
        errorData = { 
          message: "لم نتمكن من العثور على كاميرا خلفية في هذا الجهاز.",
          type: 'not-found' 
        };
      } else {
        errorData = { 
          message: "حدث خطأ غير متوقع في تهيئة الكاميرا. سنحاول الإصلاح تلقائياً.",
          type: 'tech' 
        };
      }

      setError(errorData);

      // محاولة إعادة تشغيل تلقائي للحالات التقنية فقط
      if (errorData.type !== 'auth' && errorData.type !== 'not-found') {
        setIsRetrying(true);
        if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = window.setTimeout(() => {
          setRestarts(prev => prev + 1);
          startScanner();
        }, 3500);
      }
    } finally {
      setIsStarting(false);
    }
  }, [isProcessing, onScan, restarts, isStarting]);

  useEffect(() => {
    startScanner();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !scannerRef.current?.isScanning) {
        startScanner();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (restartTimeoutRef.current) window.clearTimeout(restartTimeoutRef.current);
      stopScanner();
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm aspect-square mx-auto overflow-hidden rounded-[3.5rem] shadow-2xl border-[12px] border-white bg-neutral-900 flex flex-col items-center justify-center transition-all duration-500">
      {/* Viewport container that stays square */}
      <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center">
         <div id="reader" className="w-full h-full"></div>
         {!hasPermission && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 z-10">
               <div className="w-14 h-14 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
               <p className="text-blue-400 text-[10px] font-black mt-6 tracking-widest uppercase animate-pulse">Initializing Lens</p>
            </div>
         )}
      </div>
      
      {/* Error UI Card */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-900/95 p-8 text-center backdrop-blur-xl animate-in fade-in zoom-in duration-300">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-2xl ${
            error.type === 'auth' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h4 className="text-white text-xl font-black mb-3">عُطلاً في المسح</h4>
          <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10 px-4">
            {error.message}
          </p>
          
          {isRetrying ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex space-x-2">
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-blue-400 text-xs font-black tracking-widest animate-pulse">جاري محاولة الإصلاح التلقائي...</p>
            </div>
          ) : (
            <button 
              onClick={() => { setRestarts(0); startScanner(); }}
              className="w-full max-w-[200px] py-4 bg-white text-gray-900 rounded-2xl font-black shadow-xl active:scale-95 transition-all hover:bg-gray-100"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}

      {/* Active Scanner HUD Overlay */}
      {hasPermission && !error && (
        <>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {/* Pulsing frame with soft glow */}
            <div className="w-64 h-64 border-2 border-white/5 rounded-[3rem] relative animate-frame-glow">
              <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-blue-500 rounded-tl-[2rem] -mt-1 -ml-1 shadow-glow-blue"></div>
              <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-blue-500 rounded-tr-[2rem] -mt-1 -mr-1 shadow-glow-blue"></div>
              <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-blue-500 rounded-bl-[2rem] -mb-1 -ml-1 shadow-glow-blue"></div>
              <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-blue-500 rounded-br-[2rem] -mb-1 -mr-1 shadow-glow-blue"></div>
            </div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-400/80 to-transparent shadow-[0_0_30px_rgba(59,130,246,0.8)] opacity-90 animate-scan-line pointer-events-none z-10"></div>
          
          {/* Heartbeat activity indicator */}
          <div className="absolute top-8 right-8 flex items-center gap-2 z-20">
             <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-60">Live</span>
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          
          {restarts > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600/20 backdrop-blur-xl text-blue-400 text-[8px] px-5 py-2 rounded-full z-20 border border-blue-500/30 font-black tracking-widest uppercase">
               Self-Healing Mode: {restarts}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 15%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        @keyframes frame-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        .animate-scan-line {
          animation: scan-line 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-frame-glow {
          animation: frame-glow 2.5s ease-in-out infinite;
        }
        .shadow-glow-blue {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
        }
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.05); /* Slight zoom for aesthetic */
        }
        #reader {
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
        }
        #reader:not(:empty) {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Scanner;