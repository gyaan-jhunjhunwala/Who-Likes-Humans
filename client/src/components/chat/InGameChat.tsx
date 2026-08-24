'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { MessageSquare, Send, X, ChevronUp, ChevronDown } from 'lucide-react';

export const InGameChat: React.FC = () => {
  const { chatMessages, sendChat, playerId } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChat(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-400/40 transform hover:scale-105 active:scale-95 transition-all"
        >
          <MessageSquare className="w-5 h-5" />
          {chatMessages.length > 0 && (
            <span className="bg-white text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {chatMessages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-panel w-80 sm:w-96 h-96 rounded-3xl flex flex-col shadow-2xl border border-white/10 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-neutral-950/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Match Chat
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-neutral-500 text-center my-auto py-8">
                No chat messages yet. Say hello!
              </p>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.playerId === playerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-neutral-400 font-bold mb-0.5 px-1">
                      {isMe ? 'You' : msg.playerName}
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl max-w-[85%] break-words ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-neutral-950/90 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={150}
              className="flex-1 bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
