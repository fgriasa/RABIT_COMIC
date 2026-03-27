/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Copy, Check } from 'lucide-react';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Panel {
  num: number;
  visual: string;
  dialogue: string;
}

interface StoryData {
  title: string;
  panels: Panel[];
}

export default function App() {
  const [keyword, setKeyword] = useState('禮拜一症候群');
  const [isLoading, setIsLoading] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `關鍵字：${keyword}`,
        config: {
          systemInstruction: `你是一位資深的雜誌短篇漫畫編劇，主角永遠是「小兔子」。小兔子必須是故事的行動者或計畫執行者。請根據關鍵字創作一個 6 格腳本。`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "漫畫標題" },
              panels: {
                type: Type.ARRAY,
                description: "6格漫畫的內容",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    num: { type: Type.NUMBER, description: "格子編號 (1-6)" },
                    visual: { type: Type.STRING, description: "畫面描述" },
                    dialogue: { type: Type.STRING, description: "角色對白" }
                  },
                  required: ['num', 'visual', 'dialogue']
                }
              }
            },
            required: ['title', 'panels']
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text) as StoryData;
        setStoryData(data);
      } else {
        throw new Error("No response text");
      }
    } catch (err) {
      console.error(err);
      setError('生成失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!storyData) return;
    
    let text = `【${storyData.title}】\n\n`;
    storyData.panels.forEach(p => {
      text += `格${p.num}：\n畫面：${p.visual}\n對白：${p.dialogue}\n---\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  return (
    <div className="min-h-screen py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center bg-[#faedcd] text-[#d4a373] px-3 py-1 rounded-full text-sm font-bold mb-3">
            🐰 永遠的主角：小兔子
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight text-gray-900">小兔子 6 格漫畫腳本助手</h1>
          <p className="text-gray-500 italic">「小兔子的參與、行動與計畫執行」</p>
        </header>

        {/* 輸入區 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="輸入關鍵字..." 
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:bg-white outline-none transition-all"
            />
            <button 
              onClick={handleGenerate}
              disabled={isLoading || !keyword.trim()}
              className="bg-amber-900 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              <span>構思小兔子的故事</span>
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            </button>
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* 結果區 */}
        {storyData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-amber-100 pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{storyData.title}</h2>
              </div>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors text-sm font-bold shadow-sm"
              >
                {showToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{showToast ? '已複製！' : '一鍵複製全部內容'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {storyData.panels.map((panel) => (
                <div 
                  key={panel.num} 
                  className="bg-white border border-[#e8e2d6] hover:border-[#d4a373] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(212,163,115,0.1)] transition-all duration-300 p-6 rounded-2xl flex flex-col gap-4"
                >
                  <div className="font-serif text-[#d4a373] text-xl font-bold">
                    #{panel.num}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {panel.visual}
                  </p>
                  <div className="font-bold text-gray-900 mt-auto border-t border-gray-100 pt-3">
                    「{panel.dialogue}」
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full text-sm font-medium transition-opacity duration-300 z-50 pointer-events-none ${showToast ? 'opacity-100' : 'opacity-0'}`}>
        已複製到剪貼簿！
      </div>
    </div>
  );
}
