import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Scanner from './components/Scanner';
import Overlay from './components/Overlay';
import { ScanRecord, ScanStatus } from './types';
import { audioService } from './services/audioService';

const APP_KEY = 'queencheck_db_prod_final_v3';
const TOTAL_INVITATIONS = 500;

const App: React.FC = () => {
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');
  const [searchTerm, setSearchTerm] = useState('');
  
  const scannedIdsRef = useRef<Set<string>>(new Set());
  const isCurrentlyProcessing = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(APP_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const ids = parsed.scannedIds || [];
        setScannedIds(ids);
        scannedIdsRef.current = new Set(ids);
        setHistory((parsed.history || []).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(APP_KEY, JSON.stringify({ scannedIds, history }));
  }, [scannedIds, history]);

  const handleScan = useCallback((decodedText: string) => {
    if (isCurrentlyProcessing.current) return;
    isCurrentlyProcessing.current = true;

    const rawId = decodedText.trim();
    const num = parseInt(rawId, 10);
    const formattedId = !isNaN(num) && num > 0 ? num.toString().padStart(3, '0') : rawId;

    if (scannedIdsRef.current.has(formattedId)) {
      setStatus('error-duplicate');
      setMessage(`هذه الدعوة (#${formattedId}) تم استخدامها مسبقاً!`);
      audioService.playError();
      addHistory(formattedId, 'duplicate');
      return; 
    } 

    if (isNaN(num) || num < 1 || num > TOTAL_INVITATIONS) {
      setStatus('error-invalid');
      setMessage(`هذه الدعوة (#${rawId}) غير موجودة في النظام!`);
      audioService.playError();
      addHistory(rawId, 'invalid');
      return;
    } 

    setStatus('success');
    setMessage(`تم تفعيل الدعوة رقم ${formattedId}. مرحباً بك.`);
    audioService.playSuccess();
    
    scannedIdsRef.current.add(formattedId);
    setScannedIds(prev => [...prev, formattedId]);
    addHistory(formattedId, 'valid');
  }, []);

  const addHistory = (id: string, status: ScanRecord['status']) => {
    const record: ScanRecord = { id, status, timestamp: new Date() };
    setHistory(prev => [record, ...prev]);
  };

  const handleCloseOverlay = () => {
    setStatus('idle');
    setMessage('');
    setTimeout(() => {
      isCurrentlyProcessing.current = false;
    }, 1000);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ هل أنت متأكد من مسح كافة سجلات الحضور؟')) {
      setScannedIds([]);
      scannedIdsRef.current.clear();
      setHistory([]);
      localStorage.removeItem(APP_KEY);
    }
  };

  const exportToPDF = () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const dateStr = new Date().toLocaleString('ar-SA');
    const validCount = scannedIds.length;
    const duplicateCount = history.filter(h => h.status === 'duplicate').length;
    const invalidCount = history.filter(h => h.status === 'invalid').length;

    const rows = history.map(rec => `
      <tr>
        <td>${rec.id}</td>
        <td class="${rec.status === 'valid' ? 'status-valid' : 'status-error'}">
          ${rec.status === 'valid' ? 'مقبول' : rec.status === 'duplicate' ? 'مكرر' : 'غير موجود'}
        </td>
        <td>${rec.timestamp.toLocaleTimeString('ar-SA')}</td>
        <td>${rec.timestamp.toLocaleDateString('ar-SA')}</td>
      </tr>
    `).join('');

    printArea.innerHTML = `
      <div class="report-header">
        <h1 style="font-size: 28px; color: #1e40af; margin-bottom: 5px;">QueenCheck - تقرير تدقيق الحضور</h1>
        <p style="color: #666;">تاريخ التقرير: ${dateStr}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <p style="font-size: 12px; color: #666; font-weight: bold;">إجمالي المقبولين</p>
          <h2 style="font-size: 24px; color: #16a34a; margin: 0;">${validCount}</h2>
        </div>
        <div class="stat-card">
          <p style="font-size: 12px; color: #666; font-weight: bold;">إجمالي المكرر</p>
          <h2 style="font-size: 24px; color: #dc2626; margin: 0;">${duplicateCount}</h2>
        </div>
        <div class="stat-card">
          <p style="font-size: 12px; color: #666; font-weight: bold;">غير موجود بالخطة</p>
          <h2 style="font-size: 24px; color: #6b7280; margin: 0;">${invalidCount}</h2>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>رقم الدعوة</th>
            <th>الحالة</th>
            <th>الوقت</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      
      <div style="margin-top: 40px; text-align: left; font-size: 10px; color: #aaa;">
        تم إنشاء هذا التقرير تلقائياً عبر نظام QueenCheck
      </div>
    `;

    window.print();
  };

  const filteredHistory = useMemo(() => {
    return history.filter(r => r.id.includes(searchTerm));
  }, [history, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-[#F7F9FF] safe-area-inset overflow-hidden">
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 leading-none tracking-tight">QueenCheck</h1>
        </div>
        <button onClick={clearAllData} className="p-2.5 text-gray-300 hover:text-red-500 active:bg-red-50 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      <div className="p-6 shrink-0">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-blue-100 mb-1 uppercase tracking-widest">الحضور المعتمد</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter">{scannedIds.length}</span>
                <span className="text-lg font-bold text-blue-200">/ {TOTAL_INVITATIONS}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white/10 h-3 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${(scannedIds.length / TOTAL_INVITATIONS) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-2 shrink-0">
        <div className="bg-gray-200/50 p-1 rounded-2xl flex">
          <button onClick={() => setActiveTab('scanner')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'scanner' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>الماسح</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>السجل</button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'scanner' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <Scanner onScan={handleScan} isProcessing={status !== 'idle'} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 sticky top-0 bg-[#F7F9FF] pb-4 z-10">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="بحث عن رقم..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full px-5 py-4 rounded-2xl border-0 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                />
              </div>
              <button 
                onClick={exportToPDF}
                disabled={history.length === 0}
                className="bg-blue-600 text-white px-5 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
            
            {filteredHistory.map((rec, i) => (
              <div key={i} className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 ${rec.status === 'valid' ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${rec.status === 'valid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{rec.status === 'valid' ? '✓' : '✕'}</div>
                  <div><h4 className="font-black text-gray-900">#{rec.id}</h4><p className="text-[10px] font-bold text-gray-400">{rec.timestamp.toLocaleTimeString('ar-SA')}</p></div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${rec.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>{rec.status === 'valid' ? 'مقبول' : rec.status === 'duplicate' ? 'مكرر' : 'غير موجود'}</span>
              </div>
            ))}
            
            {filteredHistory.length === 0 && (
               <div className="py-20 text-center opacity-20 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="font-bold">السجل فارغ</p>
               </div>
            )}
          </div>
        )}
      </main>
      <Overlay status={status} message={message} onClose={handleCloseOverlay} />
    </div>
  );
};

export default App;
