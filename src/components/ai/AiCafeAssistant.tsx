'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  Coffee,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AiMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  category?: string;
  timestamp: string;
}

interface AiCafeAssistantProps {
  onClose?: () => void;
}

const PRESET_QUERIES = [
  "What are today's sales & AOV?",
  "Which ingredient needs restocking?",
  "Which product sells the most?",
  "Summarize my estimated profit & expenses",
  "Suggest a marketing campaign for WhatsApp",
  "What were my sales this week?",
];

export function AiCafeAssistant({ onClose }: AiCafeAssistantProps) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      sender: 'AI',
      text: "👋 Hello! I am your **Cafe OS Business Intelligence Assistant**. I have real-time access to your live PostgreSQL database (sales, inventory depletion, dining tables, orders, and operating expenses).\n\nAsk me any operational question below, or tap one of the suggested query chips!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: AiMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();

      if (data.success) {
        const aiMsg: AiMessage = {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          text: data.response,
          category: data.category,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: AiMessage = {
          id: `ai-err-${Date.now()}`,
          sender: 'AI',
          text: `⚠️ Error fetching analytics: ${data.error}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: AiMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'AI',
        text: '⚠️ Network connection error communicating with intelligence service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[94vh] sm:h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-850 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-lg text-white tracking-tight whitespace-nowrap">
                  AI ASSISTANT
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap hidden xs:inline">
                  Live Grounded
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate hidden sm:block">Natural-language reporting, margin analysis, & campaign generation</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Preset Query Chips */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 border-b border-stone-800/80 bg-stone-950/40 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 hidden sm:inline">
            Quick Queries:
          </span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 sm:px-3 py-1 bg-stone-800/80 hover:bg-stone-750 text-stone-300 hover:text-amber-300 text-[11px] sm:text-xs rounded-xl border border-stone-700/60 whitespace-nowrap transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'AI' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'USER'
                    ? 'bg-amber-600 text-white font-medium rounded-br-xs'
                    : 'bg-stone-950/90 border border-stone-800 text-stone-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[10px] text-right font-mono ${
                    msg.sender === 'USER' ? 'text-amber-200' : 'text-stone-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'USER' && (
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-stone-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span className="italic">Analyzing live cafe database metrics...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about sales, expenses, inventory, margins, or marketing..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-3 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
