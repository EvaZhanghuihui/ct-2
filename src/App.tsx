/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Camera, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IdentifyPage from './components/IdentifyPage';
import NotebookPage from './components/NotebookPage';
import { WrongQuestionRecord } from './types';
import { cn } from './lib/utils';

type Tab = 'identify' | 'notebook';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('identify');
  const [records, setRecords] = useState<WrongQuestionRecord[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('wrong_question_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse records", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('wrong_question_records', JSON.stringify(records));
  }, [records]);

  const handleSaveRecord = (record: WrongQuestionRecord) => {
    setRecords(prev => [...prev, record]);
    // Optionally switch to notebook
    // setActiveTab('notebook');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-hidden relative border-x border-slate-200">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'identify' ? (
            <motion.div 
              key="identify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <IdentifyPage onSave={handleSaveRecord} />
            </motion.div>
          ) : (
            <motion.div 
              key="notebook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <NotebookPage records={records} onDelete={handleDeleteRecord} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 pb-4 sticky bottom-0 z-30">
        <button 
          onClick={() => setActiveTab('identify')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'identify' ? "text-blue-600 scale-110" : "text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-all",
            activeTab === 'identify' ? "bg-blue-50 shadow-sm" : ""
          )}>
            <Camera size={24} strokeWidth={activeTab === 'identify' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">错题识别</span>
        </button>

        <button 
          onClick={() => setActiveTab('notebook')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'notebook' ? "text-blue-600 scale-110" : "text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-all",
            activeTab === 'notebook' ? "bg-blue-50 shadow-sm" : ""
          )}>
            <BookOpen size={24} strokeWidth={activeTab === 'notebook' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">错题本</span>
        </button>
      </nav>
    </div>
  );
}

