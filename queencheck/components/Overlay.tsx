
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
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-600';
  const icon = isSuccess ? (
    <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-fade-in ${bgColor} transition-colors duration-300`}
      onClick={onClose}
    >
      <div className="animate-bounce mb-8">
        {icon}
      </div>
      <h2 className="text-4xl font-bold text-white text-center mb-4">
        {isSuccess ? 'تم التحقق بنجاح' : 'تنبيه خطأ'}
      </h2>
      <p className="text-2xl text-white text-center opacity-90">
        {message}
      </p>
      
      <button 
        className="mt-12 px-8 py-3 bg-white text-gray-900 rounded-full font-bold shadow-xl active:scale-95 transition-transform"
        onClick={onClose}
      >
        متابعة المسح
      </button>
    </div>
  );
};

export default Overlay;
