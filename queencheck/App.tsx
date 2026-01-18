
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Scanner from './components/Scanner';
import Overlay from './components/Overlay';
import { ScanRecord, ScanStatus } from './types';
import { audioService } from './services/audioService';

const APP_KEY = 'queencheck_db_prod';
const TOTAL_INVITATIONS = 500;

const App: React.FC = () => {
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(APP_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScannedIds(parsed.scannedIds || []);
        setHistory((parsed.history || []).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(APP_KEY, JSON.stringify({ scannedIds, history }));
  }, [scannedIds, history]);

  const handleScan = useCallback((decodedText: string) => {
    if (status !== 'idle') return;

    const rawId = decodedText.trim();
    const num = parseInt(rawId, 10);
    const formattedId = !isNaN(num) && num > 0 ? num.toString().padStart(3, '0') : rawId;

    // Validation Logic
    if (isNaN(num) || num < 1 || num > TOTAL_INVITATIONS) {
      setStatus('error-invalid');
      setMessage(`الرمز (${rawId}) غير موجود في قاعدة البيانات.`);
      audioService.playError();
      addHistory(rawId, 'invalid');
    } 
    else if (scannedIds.includes(formattedId)) {
      setStatus('error-duplicate');
      setMessage(`هذه الدعوة (#${formattedId}) تم استخدامها مسبقاً!`);
      audioService.playError();
      addHistory(formattedId, 'duplicate');
    } 
    else {
      setStatus('success');
      setMessage(`تم تفعيل الدعوة رقم ${formattedId}. مرحباً بك.`);
      audioService.playSuccess();
      setScannedIds(prev => [...prev, formattedId]);
      addHistory(formattedId, 'valid');
    }
  }, [scannedIds, status]);

  const addHistory = (id: string, status: ScanRecord['status']) => {
    const record: ScanRecord = { id, status, timestamp: new Date() };
    setHistory(prev => [record, ...prev]);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ تحذير: سيتم مسح كافة سجلات الحضور. هل أنت متأكد؟')) {
      setScannedIds([]);
      setHistory([]);
      localStorage.removeItem(APP_KEY);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(r => r.id.includes(searchTerm));
  }, [history, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-[#F7F9FF] safe-area-inset overflow-hidden">
      {/* App Header */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">QueenCheck</h1>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Security & Verification</span>
          </div>
        </div>
        <button onClick={clearAllData} className="p-2.5 text-gray-400 hover:text-red-500 active:bg-red-50 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      {/* Stats Summary */}
      <div className="p-6 shrink-0">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[28px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-blue-100 mb-1">إجمالي الحضور</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">{scannedIds.length}</span>
                <span className="text-sm font-bold text-blue-200">/ {TOTAL_INVITATIONS}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-100 mb-1">المتبقي</p>
              <span className="text-xl font-black">{TOTAL_INVITATIONS - scannedIds.length}</span>
            </div>
          </div>
          <div className="mt-5 bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${(scannedIds.length / TOTAL_INVITATIONS) * 100}%` }}
            />
          </div>
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-2 shrink-0">
        <div className="bg-gray-200/50 p-1 rounded-2xl flex">
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'scanner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            المسح الضوئي
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            سجل التدقيق
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-10">
        {activeTab === 'scanner' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 py-4">
            <Scanner onScan={handleScan} isProcessing={status !== 'idle'} />
            <div className="text-center">
               <h3 className="text-lg font-bold text-gray-800">جاهز للمسح</h3>
               <p className="text-xs text-gray-400 mt-1">يرجى توجيه الكاميرا نحو رمز الاستجابة السريع</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-0 bg-[#F7F9FF] pt-2 pb-4 z-10">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="بحث برقم الدعوة..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 rounded-2xl border-0 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              filteredHistory.map((rec, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${rec.status === 'valid' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {rec.status === 'valid' ? '✓' : '✕'}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">رقم الدعوة: {rec.id}</h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{rec.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${
                    rec.status === 'valid' ? 'bg-green-100 text-green-700' : 
                    rec.status === 'duplicate' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {rec.status === 'valid' ? 'سليمة' : rec.status === 'duplicate' ? 'مكررة' : 'غير صالحة'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-30">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="text-sm font-bold">لا توجد سجلات حالياً</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status Overlays */}
      <Overlay status={status} message={message} onClose={() => setStatus('idle')} />
    </div>
  );
};

export default App;
