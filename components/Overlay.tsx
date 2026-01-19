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
  const isDuplicate = status === 'error-duplicate';
  
  // خلفية حمراء فاقعة للمكرر، وأحمر داكن للخطأ التقني، وأخضر للنجاح
  const bgColor = isSuccess 
    ? 'bg-green-600' 
    : isDuplicate 
      ? 'bg-red-500' 
      : 'bg-red-800';

  const icon = isSuccess ? (
    <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-28 h-28 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 transition-all duration-300 ${bgColor} ${!isSuccess ? 'animate-emergency-flash' : 'animate-fade-in'}`}
      onClick={onClose}
    >
      <div className={`${!isSuccess ? 'animate-shake' : 'animate-bounce'} mb-10`}>
        {icon}
      </div>
      
      <h2 className="text-5xl font-black text-white text-center mb-6 leading-tight drop-shadow-md">
        {isSuccess ? 'دخول مسموح' : isDuplicate ? 'تحذير: مكرر!' : 'خطأ في الرمز'}
      </h2>
      
      <p className="text-2xl font-bold text-white text-center opacity-95 max-w-xs leading-relaxed">
        {message}
      </p>
      
      <button 
        className="mt-16 w-full max-w-[280px] py-5 bg-white text-gray-900 rounded-[2rem] text-xl font-black shadow-2xl active:scale-95 transition-transform"
        onClick={onClose}
      >
        إغلاق التنبيه
      </button>

      <style>{`
        @keyframes emergency-flash {
          0%, 100% { background-color: rgb(239 68 68); }
          50% { background-color: rgb(153 27 27); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-emergency-flash {
          animation: emergency-flash 0.5s infinite;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
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
