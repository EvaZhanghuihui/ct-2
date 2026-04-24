import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, Sparkles, Wand2, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GeminiService } from '../services/geminiService';
import { OCRResult, Question, WrongQuestionRecord } from '../types';
import { cn } from '../lib/utils';

export default function IdentifyPage({ onSave }: { onSave: (record: WrongQuestionRecord) => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [simQuestions, setSimQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processOCR(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (base64: string, mimeType: string) => {
    setLoadingOCR(true);
    setOcrResult(null);
    setSimQuestions([]);
    try {
      const data = base64.split(',')[1];
      const result = await GeminiService.identifyQuestion(data, mimeType);
      setOcrResult(result);
    } catch (error) {
      console.error("OCR failed", error);
      alert("识别失败，请尝试重新拍照");
    } finally {
      setLoadingOCR(false);
    }
  };

  const handleGenerate = async () => {
    if (!ocrResult) return;
    setLoadingGen(true);
    try {
      const questions = await GeminiService.generateSimilarQuestions(
        ocrResult.text,
        ocrResult.knowledgePoint || "未知知识点",
        ocrResult.subject
      );
      setSimQuestions(questions);
    } catch (error) {
      console.error("Generation failed", error);
      alert("生成练习失败，请重试");
    } finally {
      setLoadingGen(false);
    }
  };

  const handleSaveToNotebook = () => {
    if (!ocrResult || simQuestions.length === 0) return;
    
    const record: WrongQuestionRecord = {
      id: Date.now().toString(),
      title: ocrResult.knowledgePoint || "新错题记录",
      timestamp: Date.now(),
      knowledgePoint: ocrResult.knowledgePoint || "未分类",
      subject: ocrResult.subject,
      originalQuestion: {
        id: 'orig-' + Date.now(),
        content: ocrResult.text,
        options: ocrResult.options,
        answer: ocrResult.answer || "未提供",
        explanation: "原题记录",
        isOriginal: true
      },
      similarQuestions: simQuestions
    };
    
    onSave(record);
    // Reset state after save
    setImage(null);
    setOcrResult(null);
    setSimQuestions([]);
    alert("已保存到错题本");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800">拍照识错题</h1>
        <p className="text-xs text-slate-500">上传图片，AI 助你举一反三</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload Section */}
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl aspect-[4/3] flex flex-col items-center justify-center bg-white hover:border-blue-400 transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera className="text-blue-500" size={32} />
            </div>
            <p className="text-slate-600 font-medium">点击拍照或上传图片</p>
            <p className="text-slate-400 text-xs mt-1">支持数学、语文、英语等全学科</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-black aspect-video flex items-center justify-center">
              <img src={image} alt="Target" className="max-h-full object-contain" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X size={20} />
              </button>
            </div>

            {loadingOCR && (
              <div className="flex items-center justify-center p-8 bg-white rounded-xl space-x-3 text-blue-600">
                <Loader2 className="animate-spin" />
                <span>AI 正在识别题目中...</span>
              </div>
            )}

            {ocrResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                    {ocrResult.subject || "全科"}
                  </span>
                  <span className="text-xs text-slate-400">识别成功</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">原题文本</label>
                    <textarea 
                      className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-200 resize-none min-h-[100px]"
                      value={ocrResult.text}
                      onChange={(e) => setOcrResult({...ocrResult, text: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">核心知识点</label>
                      <input 
                        className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-200"
                        value={ocrResult.knowledgePoint}
                        onChange={(e) => setOcrResult({...ocrResult, knowledgePoint: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">答案</label>
                      <input 
                        className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-200"
                        value={ocrResult.answer || ""}
                        placeholder="如识别失败可手动填写"
                        onChange={(e) => setOcrResult({...ocrResult, answer: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={handleGenerate}
                    disabled={loadingGen}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                  >
                    {loadingGen ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    生成举一反三题目
                  </button>
                  <button 
                    onClick={() => processOCR(image.split(',')[1], 'image/png')}
                    className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                    title="重新识别"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Generated Items */}
            <AnimatePresence>
              {simQuestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-slate-800 font-bold px-1">
                    <Wand2 size={18} className="text-amber-500" />
                    <span>AI 举一反三生成结果</span>
                  </div>
                  
                  {simQuestions.map((q, i) => (
                    <motion.div 
                      key={q.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-5 rounded-2xl border-l-4 border-l-blue-500 shadow-sm"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">练习 {i + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                         <div className="bg-emerald-50/50 p-3 rounded-lg">
                           <span className="text-[10px] font-bold text-emerald-600 block mb-1">参考答案</span>
                           <p className="text-sm text-emerald-800">{q.answer}</p>
                         </div>
                         <div className="bg-amber-50/50 p-3 rounded-lg">
                           <span className="text-[10px] font-bold text-amber-600 block mb-1">易错点解析</span>
                           <p className="text-sm text-amber-800 italic">"{q.commonErrors}"</p>
                           <p className="text-xs text-slate-500 mt-2">{q.explanation}</p>
                         </div>
                      </div>
                    </motion.div>
                  ))}

                  <button 
                    onClick={handleSaveToNotebook}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 mt-4 active:scale-95 transition-all"
                  >
                    <Check size={18} />
                    保存至错题本
                  </button>
                  
                  <button 
                    onClick={handleGenerate}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all mt-2"
                  >
                    <RotateCcw size={16} />
                    不满意？重新生成
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
