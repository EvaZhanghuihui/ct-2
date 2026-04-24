import React, { useState } from 'react';
import { Printer, Trash2, ChevronRight, Calendar, BookOpen, CheckSquare, Square, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WrongQuestionRecord } from '../types';
import { PDFExporter } from '../services/pdfExporter';
import { cn } from '../lib/utils';

export default function NotebookPage({ 
  records, 
  onDelete 
}: { 
  records: WrongQuestionRecord[], 
  onDelete: (id: string) => void 
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [viewRecord, setViewRecord] = useState<WrongQuestionRecord | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const handlePrint = async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    const selectedRecords = records.filter(r => selectedIds.includes(r.id));
    try {
      await PDFExporter.exportToPDF(selectedRecords, `错题集_${new Date().toLocaleDateString()}.pdf`);
    } catch (e) {
      alert("导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      <div className="p-4 bg-white shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">历史错题本</h1>
          <p className="text-xs text-slate-500">共 {records.length} 条记录</p>
        </div>
        <div className="flex gap-2">
          {records.length > 0 && (
            <button 
              onClick={selectAll}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium"
            >
              {selectedIds.length === records.length ? "取消全选" : "全选"}
            </button>
          )}
          <button 
            disabled={selectedIds.length === 0 || exporting}
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-100 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-95"
          >
            {exporting ? "导出中..." : <><Printer size={16} /> 打印所选</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <BookOpen size={32} />
            </div>
            <p>还没有错题记录，去拍照识别吧</p>
          </div>
        ) : (
          records.slice().reverse().map(record => (
            <div 
              key={record.id}
              className={cn(
                "bg-white rounded-2xl p-4 shadow-sm border-2 transition-all relative",
                selectedIds.includes(record.id) ? "border-blue-500 bg-blue-50/30" : "border-transparent"
              )}
            >
              <div className="flex gap-3">
                <button 
                  onClick={() => toggleSelect(record.id)}
                  className={cn(
                    "mt-1 shrink-0 transition-colors",
                    selectedIds.includes(record.id) ? "text-blue-600" : "text-slate-300"
                  )}
                >
                  {selectedIds.includes(record.id) ? <CheckSquare /> : <Square />}
                </button>
                
                <div className="flex-1 min-w-0 pointer-events-none" onClick={() => setViewRecord(record)}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                      {record.subject || "全科"}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm truncate pr-6">{record.knowledgePoint}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {record.originalQuestion.content}
                  </p>
                  
                  <div className="mt-3 flex items-center justify-between pointer-events-auto">
                    <div className="flex gap-2 text-[10px] font-medium">
                      <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded">+{record.similarQuestions.length} 举一反三</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setViewRecord(record)}
                        className="p-1 px-3 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold"
                      >
                        详情
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {viewRecord && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <div className="p-4 border-bottom flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <button 
                onClick={() => setViewRecord(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
              <h2 className="font-bold text-slate-800">错题详情</h2>
              <div className="w-10"></div>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-64px)] space-y-6">
              <div className="bg-blue-50 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded inline-block mb-3">知识点: {viewRecord.knowledgePoint}</span>
                <p className="text-slate-800 text-sm leading-relaxed">{viewRecord.originalQuestion.content}</p>
                {viewRecord.originalQuestion.answer && (
                  <div className="mt-4 p-3 bg-white/60 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">参考答案 / 解析</span>
                    <p className="text-sm text-slate-700">{viewRecord.originalQuestion.answer}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  AI 举一反三练习
                </h3>
                {viewRecord.similarQuestions.map((q, idx) => (
                  <div key={q.id} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                    <p className="text-sm font-bold text-slate-800 mb-2">练习 {idx + 1}</p>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{q.content}</p>
                    <div className="space-y-2">
                      <div className="bg-emerald-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-600 block mb-1">答案</span>
                        <p className="text-xs text-emerald-800">{q.answer}</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-600 block mb-1">易错点解析</span>
                        <p className="text-xs text-amber-800 leading-relaxed">{q.commonErrors}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
