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

  // تنشيط محرك الصوت عند أول لمسة للشاشة (ضروري لسياسة المتصفحات)
  useEffect(() => {
    const handleInit = () => audioService.init();
    window.addEventListener('click', handleInit, { once: true });
    window.addEventListener('touchstart', handleInit, { once: true });
    return () => {
      window.removeEventListener('click', handleInit);
      window.removeEventListener('touchstart', handleInit);
    };
  }, []);

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

    // 1. فحص التكرار (إنذار طوارئ)
    if (scannedIdsRef.current.has(formattedId)) {
      setStatus('error-duplicate');
      setMessage(`هذه الدعوة (#${formattedId}) تم استخدامها مسبقاً!`);
      audioService.playError(); // صوت عالي واهتزاز
      addHistory(formattedId, 'duplicate');
      return; 
    } 

    // 2. فحص النطاق فوق 500 (إنذار طوارئ: غير موجود)
    if (isNaN(num) || num < 1 || num > TOTAL_INVITATIONS) {
      setStatus('error-invalid');
      setMessage(`الدعوة (#${rawId}) غير موجودة في قاعدة البيانات!`);
      audioService.playError(); // صوت عالي واهتزاز
      addHistory(rawId, 'invalid');
      return;
    } 

    // 3. حالة النجاح
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
    }, 800);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ مسح كافة البيانات؟')) {
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
        <h1>QueenCheck - تقرير الحضور</h1>
        <p>التاريخ: ${dateStr}</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><h3>المقبولين</h3><h2>${scannedIds.length}</h2></div>
        <div class="stat-card"><h3>المرفوضين</h3><h2>${history.length - scannedIds.length}</h2></div>
      </div>
      <table>
        <thead><tr><th>رقم الدعوة</th><th>الحالة</th><th>الوقت</th><th>التاريخ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    window.print();
  };

  const filteredHistory = useMemo(() => {
    return history.filter(r => r.id.includes(searchTerm));
  }, [history, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-[#F7F9FF] safe-area-inset overflow-hidden">
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">✓</div>
          <h1 className="text-xl font-black text-gray-900 leading-none">QueenCheck</h1>
        </div>
        <button onClick={clearAllData} className="p-2 text-gray-300 active:text-red-500">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </header>

      <div className="p-6 shrink-0">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-6 text-white shadow-xl">
          <p className="text-[10px] font-black opacity-80 mb-1">الحضور الحالي</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black">{scannedIds.length}</span>
            <span className="text-lg opacity-60">/ {TOTAL_INVITATIONS}</span>
          </div>
          <div className="mt-6 bg-white/10 h-3 rounded-full overflow-hidden">
            <div className="bg-white h-full transition-all duration-1000" style={{ width: `${(scannedIds.length / TOTAL_INVITATIONS) * 100}%` }} />
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
          <div className="h-full flex flex-col items-center justify-center">
            <Scanner onScan={handleScan} isProcessing={status !== 'idle'} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 sticky top-0 bg-[#F7F9FF] pb-4 z-10">
              <input type="text" placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-5 py-4 rounded-2xl border-0 shadow-sm font-bold outline-none" />
              <button onClick={exportToPDF} className="bg-blue-600 text-white px-5 rounded-2xl shadow-lg active:scale-95">PDF</button>
            </div>
            {filteredHistory.map((rec, i) => (
              <div key={i} className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between ${rec.status === 'valid' ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.status === 'valid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{rec.status === 'valid' ? '✓' : '✕'}</div>
                  <div><h4 className="font-black">#{rec.id}</h4><p className="text-[10px] text-gray-400">{rec.timestamp.toLocaleTimeString('ar-SA')}</p></div>
                </div>
                <span className={`text-[10px] font-black ${rec.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>{rec.status === 'valid' ? 'مقبول' : rec.status === 'duplicate' ? 'مكرر' : 'غير موجود'}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      <Overlay status={status} message={message} onClose={handleCloseOverlay} />
    </div>
  );
};

export default App;
