
import React from 'react';
import { ScanStatus } from '../types';

interface OverlayProps {
  status: ScanStatus;
  message: string;
  onClose: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ status, message, onClose }) => {
  if (status === 'idle') return null;

  const isSuccess = status === 'success';
  const isEmergency = status === 'error-duplicate' || status === 'error-invalid';
  
  // خلفية التنبيه
  const bgColor = isSuccess 
    ? 'bg-green-600' 
    : 'bg-red-600';

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 transition-all duration-150 ${bgColor} ${isEmergency ? 'animate-emergency-strobe' : 'animate-fade-in'}`}
      onClick={onClose}
    >
      <div className={`${isEmergency ? 'animate-heavy-shake' : 'animate-bounce'} mb-8`}>
        {isSuccess ? (
          <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      
      <h2 className="text-5xl font-black text-white text-center mb-4 leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
        {isSuccess ? 'مقبول' : isEmergency && status === 'error-duplicate' ? 'مكرر!' : 'غير موجود!'}
      </h2>
      
      <p className="text-2xl font-bold text-white text-center opacity-100 max-w-sm leading-relaxed drop-shadow-sm">
        {message}
      </p>
      
      <button 
        className="mt-16 w-full max-w-[300px] py-6 bg-white text-red-600 rounded-[2.5rem] text-2xl font-black shadow-[0_10px_40px_rgba(0,0,0,0.3)] active:scale-95 transition-transform"
        onClick={onClose}
      >
        إغلاق التنبيه
      </button>

      <style>{`
        @keyframes strobe {
          0%, 100% { background-color: #dc2626; }
          50% { background-color: #7f1d1d; }
        }
        @keyframes heavy-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-10px, -5px) rotate(-1deg); }
          20% { transform: translate(15px, 0px) rotate(1deg); }
          30% { transform: translate(-5px, 10px) rotate(0deg); }
          40% { transform: translate(10px, -15px) rotate(1deg); }
          50% { transform: translate(-15px, 5px) rotate(-1deg); }
          60% { transform: translate(5px, -10px) rotate(0deg); }
          70% { transform: translate(-10px, 15px) rotate(1deg); }
          80% { transform: translate(15px, -5px) rotate(-1deg); }
          90% { transform: translate(-5px, 0px) rotate(0deg); }
        }
        .animate-emergency-strobe {
          animation: strobe 0.2s infinite;
        }
        .animate-heavy-shake {
          animation: heavy-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Overlay;
