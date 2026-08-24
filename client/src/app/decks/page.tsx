'use client';

import React, { useState } from 'react';
import { OFFICIAL_DECKS } from '../../../../shared/decks';
import { BlackCard } from '../../components/cards/BlackCard';
import { WhiteCard } from '../../components/cards/WhiteCard';
import {
  Layers,
  Plus,
  Sparkles,
  BookOpen,
  Check,
  Download,
  Trash2,
} from 'lucide-react';

export default function DecksPage() {
  const [selectedDeckId, setSelectedDeckId] = useState('base');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [newBlackText, setNewBlackText] = useState('');
  const [newBlackPick, setNewBlackPick] = useState(1);
  const [newWhiteText, setNewWhiteText] = useState('');

  const [customBlackCards, setCustomBlackCards] = useState<{ id: string; text: string; pick: number }[]>([]);
  const [customWhiteCards, setCustomWhiteCards] = useState<{ id: string; text: string }[]>([]);

  const activeDeck = OFFICIAL_DECKS[selectedDeckId] || OFFICIAL_DECKS['base'];

  const handleAddBlackCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackText.trim()) return;
    setCustomBlackCards([
      ...customBlackCards,
      { id: `cb-${Date.now()}`, text: newBlackText.trim(), pick: newBlackPick },
    ]);
    setNewBlackText('');
    setNewBlackPick(1);
  };

  const handleAddWhiteCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhiteText.trim()) return;
    setCustomWhiteCards([
      ...customWhiteCards,
      { id: `cw-${Date.now()}`, text: newWhiteText.trim() },
    ]);
    setNewWhiteText('');
  };

  const handleExportDeck = () => {
    const deckData = {
      title: customTitle || 'Custom Deck',
      description: customDesc,
      blackCards: customBlackCards,
      whiteCards: customWhiteCards,
    };
    const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customTitle || 'custom-deck'}.json`;
    a.click();
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Card Deck Library
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Official & Custom Decks
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Explore default card packs or build your own custom expansions to use in private rooms.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCustom(!isCreatingCustom)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {isCreatingCustom ? 'Browse Official Packs' : 'Create Custom Deck'}
        </button>
      </div>

      {isCreatingCustom ? (
        /* Custom Deck Builder Section */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-xl font-black text-white">Custom Deck Builder</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add black prompt cards (use _ for blanks) and white answer cards.
              </p>
            </div>
            {(customBlackCards.length > 0 || customWhiteCards.length > 0) && (
              <button
                onClick={handleExportDeck}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4" /> Export Deck JSON
              </button>
            )}
          </div>

          {/* Deck Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1">Deck Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. My College Inside Jokes"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1">Description</label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="A funny pack for friends"
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Add Black Cards Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
                Add Black Card (Prompt)
              </h3>
              <form onSubmit={handleAddBlackCard} className="space-y-3">
                <textarea
                  value={newBlackText}
                  onChange={(e) => setNewBlackText(e.target.value)}
                  placeholder="e.g. What is the real reason why _ happened?"
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-bold">Pick Count:</span>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewBlackPick(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                        newBlackPick === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Pick {p}
                    </button>
                  ))}
                  <button
                    type="submit"
                    disabled={!newBlackText.trim()}
                    className="ml-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl border border-neutral-700 transition-all"
                  >
                    Add Black Card
                  </button>
                </div>
              </form>

              {/* Added Black Cards List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {customBlackCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-200"
                  >
                    <span className="truncate pr-2">{card.text}</span>
                    <button
                      onClick={() =>
                        setCustomBlackCards(customBlackCards.filter((_, i) => i !== idx))
                      }
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add White Cards Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
                Add White Card (Answer)
              </h3>
              <form onSubmit={handleAddWhiteCard} className="space-y-3">
                <textarea
                  value={newWhiteText}
                  onChange={(e) => setNewWhiteText(e.target.value)}
                  placeholder="e.g. An aggressively loud sneeze."
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newWhiteText.trim()}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl border border-neutral-700 transition-all"
                  >
                    Add White Card
                  </button>
                </div>
              </form>

              {/* Added White Cards List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {customWhiteCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-200"
                  >
                    <span className="truncate pr-2">{card.text}</span>
                    <button
                      onClick={() =>
                        setCustomWhiteCards(customWhiteCards.filter((_, i) => i !== idx))
                      }
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Official Deck Explorer */
        <div className="space-y-6">
          {/* Deck Tabs */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(OFFICIAL_DECKS).map(([id, deck]) => (
              <button
                key={id}
                onClick={() => setSelectedDeckId(id)}
                className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  selectedDeckId === id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                {deck.name}
              </button>
            ))}
          </div>

          {/* Active Deck Overview */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">{activeDeck.name}</h2>
              <p className="text-xs text-neutral-400 mt-1">{activeDeck.description}</p>
              <div className="flex gap-4 mt-3 text-xs font-mono font-bold text-indigo-400">
                <span>{activeDeck.blackCards.length} Black Cards</span>
                <span>•</span>
                <span>{activeDeck.whiteCards.length} White Cards</span>
              </div>
            </div>

            {/* Cards Showcase Preview */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                  Sample Black Cards
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {activeDeck.blackCards.slice(0, 5).map((card) => (
                    <div key={card.id} className="flex-shrink-0">
                      <BlackCard card={card} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-3">
                  Sample White Cards
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {activeDeck.whiteCards.slice(0, 6).map((card) => (
                    <div key={card.id} className="flex-shrink-0">
                      <WhiteCard card={card} isSmall />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
