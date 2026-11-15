import React, { useState } from 'react';
import type { ForexFactoryNewsEvent, ForexNewsFilter, NewsApiConfig, NewsSourceType } from '../types/news';
import type { ForexPair } from '../types/forex';
import { ForexFactoryNewsService } from '../services/forexFactoryNews';
import { ForexMath } from '../services/forexMath';
import {
  Newspaper,
  X,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ForexNewsDeckProps {
  isOpen: boolean;
  onClose: () => void;
  events: ForexFactoryNewsEvent[];
  currentPair: ForexPair;
  newsFilter: ForexNewsFilter;
  onChangeFilter: (filter: ForexNewsFilter) => void;
  apiConfig: NewsApiConfig;
  onChangeApiConfig: (cfg: NewsApiConfig) => void;
  onRefreshNews: () => void;
  isFetching: boolean;
  onSelectEvent?: (event: ForexFactoryNewsEvent) => void;
}

export const ForexNewsDeck: React.FC<ForexNewsDeckProps> = ({
  isOpen,
  onClose,
  events,
  currentPair,
  newsFilter,
  onChangeFilter,
  apiConfig,
  onChangeApiConfig,
  onRefreshNews,
  isFetching,
  onSelectEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'settings'>('events');
  const [apiKeyInput, setApiKeyInput] = useState(apiConfig.jblankedApiKey);

  if (!isOpen) return null;

  const filteredEvents = ForexFactoryNewsService.filterEvents(events, currentPair, newsFilter).filter(
    (ev) =>
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highImpactCount = events.filter((e) => e.impact === 'High').length;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#000000] border-l border-[#E8DEF4] dark:border-[#1F1F24] shadow-2xl flex flex-col h-full select-none text-xs text-[#1A1325] dark:text-[#EDEDED] animate-in slide-in-from-right duration-150 transition-colors duration-150">
      {/* Header */}
      <div className="p-3 border-b border-[#E8DEF4] dark:border-[#1F1F24] flex items-center justify-between bg-[#FAF7FD] dark:bg-[#050507]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-[6px] bg-[#7C3AED]/10 text-[#7C3AED]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-[#1A1325] dark:text-[#EDEDED]">Forex Factory News</span>
              <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-1.5 py-0.2 rounded font-semibold flex items-center space-x-0.5">
                <Flame className="w-3 h-3" />
                <span>{highImpactCount} High</span>
              </span>
            </div>
            <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">Real-time Economic Calendar Feed</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onRefreshNews}
            title="Refresh news feed"
            disabled={isFetching}
            className="p-1.5 text-[#5B526D] dark:text-[#A1A1AA] hover:text-[#1A1325] dark:hover:text-[#EDEDED] rounded-[4px] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#7C3AED]' : ''}`} />
          </button>
          <button
            onClick={onClose}
            title="Close News Panel"
            className="p-1.5 text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED] rounded-[4px] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-[#E8DEF4] dark:border-[#1F1F24] px-3 pt-2 bg-white dark:bg-[#000000] space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'events'
              ? 'border-[#7C3AED] text-[#7C3AED]'
              : 'border-transparent text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
          }`}
        >
          Calendar Events ({filteredEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center space-x-1 ${
            activeTab === 'settings'
              ? 'border-[#7C3AED] text-[#7C3AED]'
              : 'border-transparent text-[#897E9C] dark:text-[#71717A] hover:text-[#1A1325] dark:hover:text-[#EDEDED]'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>API & Filters</span>
        </button>
      </div>

      {activeTab === 'events' ? (
        <>
          {/* Quick Filter Bar */}
          <div className="p-2.5 border-b border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#050507] space-y-2">
            <div className="flex items-center space-x-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#897E9C] dark:text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search events (e.g. CPI, NFP, USD)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] pl-7 pr-2 py-1 text-xs text-[#1A1325] dark:text-[#EDEDED] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <button
                onClick={() =>
                  onChangeFilter({
                    ...newsFilter,
                    currencyFilter: newsFilter.currencyFilter === 'PAIR_ONLY' ? 'ALL' : 'PAIR_ONLY',
                  })
                }
                title="Toggle Pair Currencies vs All Currencies"
                className={`px-2 py-1 rounded-[6px] border text-[11px] font-semibold transition-colors cursor-pointer ${
                  newsFilter.currencyFilter === 'PAIR_ONLY'
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]'
                    : 'border-[#E8DEF4] dark:border-[#27272A] bg-white dark:bg-[#0A0A0C] text-[#5B526D] dark:text-[#A1A1AA]'
                }`}
              >
                {newsFilter.currencyFilter === 'PAIR_ONLY' ? `${currentPair.symbol} Only` : 'All Currencies'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5 text-[11px]">
              <div className="flex items-center space-x-1">
                <Filter className="w-3 h-3 text-[#897E9C] dark:text-[#71717A]" />
                <span className="text-[#897E9C] dark:text-[#71717A]">Impact:</span>
                {(['ALL', 'HIGH_MEDIUM', 'HIGH_ONLY'] as const).map((imp) => (
                  <button
                    key={imp}
                    onClick={() => onChangeFilter({ ...newsFilter, impactFilter: imp })}
                    className={`px-1.5 py-0.5 rounded-[4px] border text-[10px] font-semibold transition-colors cursor-pointer ${
                      newsFilter.impactFilter === imp
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                        : 'border-[#E8DEF4] dark:border-[#27272A] bg-white dark:bg-[#0A0A0C] text-[#5B526D] dark:text-[#A1A1AA] hover:bg-[#F3EEF9] dark:hover:bg-[#18181B]'
                    }`}
                  >
                    {imp === 'ALL' ? 'All' : imp === 'HIGH_MEDIUM' ? 'High+Med' : 'High Only'}
                  </button>
                ))}
              </div>

              <label className="flex items-center space-x-1.5 cursor-pointer text-[#5B526D] dark:text-[#A1A1AA]">
                <input
                  type="checkbox"
                  checked={newsFilter.showOnChart}
                  onChange={(e) => onChangeFilter({ ...newsFilter, showOnChart: e.target.checked })}
                  className="rounded border-[#E8DEF4] dark:border-[#27272A] text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <span className="text-[11px]">Show on Chart</span>
              </label>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-[#897E9C] dark:text-[#71717A] space-y-1">
                <Calendar className="w-8 h-8 mx-auto text-[#D6C7EC] dark:text-[#3B2D54]" />
                <p className="font-semibold text-xs text-[#1A1325] dark:text-[#EDEDED]">No news events found</p>
                <p className="text-[11px]">Try changing your impact filter or search query.</p>
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const color = ForexFactoryNewsService.getImpactColor(ev.impact);
                const badge = ForexFactoryNewsService.getImpactBadge(ev.impact);
                const timeString = ForexMath.formatPakistaniTime(ev.timestamp, false);

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev)}
                    className="border border-[#E8DEF4] dark:border-[#1F1F24] bg-white dark:bg-[#0A0A0C] hover:border-[#7C3AED]/40 hover:bg-[#FAF7FD] dark:hover:bg-[#121216] rounded-[6px] p-2.5 space-y-1.5 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="px-1.5 py-0.2 rounded font-bold text-[10px] text-white tracking-wider"
                          style={{ backgroundColor: color }}
                        >
                          {badge}
                        </span>
                        <span className="font-bold text-xs text-[#7C3AED] dark:text-[#A78BFA] px-1.5 py-0.2 rounded bg-[#F3EEF9] dark:bg-[#7C3AED]/15">
                          {ev.country}
                        </span>
                        <span className="text-[11px] text-[#897E9C] dark:text-[#71717A] font-medium">{timeString} (PKT)</span>
                      </div>

                      <span className="text-[10px] text-[#897E9C] dark:text-[#71717A]">
                        {new Date(ev.timestamp * 1000).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#1A1325] dark:text-[#EDEDED] group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors">
                      {ev.title}
                    </div>

                    {(ev.forecast || ev.previous || ev.actual) && (
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#F3EEF9] dark:border-[#1F1F24] text-[10px]">
                        <div>
                          <span className="text-[#897E9C] dark:text-[#71717A]">Actual: </span>
                          <span className="font-semibold text-[#1A1325] dark:text-[#EDEDED]">{ev.actual || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[#897E9C] dark:text-[#71717A]">Forecast: </span>
                          <span className="font-semibold text-[#5B526D] dark:text-[#A1A1AA]">{ev.forecast || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[#897E9C] dark:text-[#71717A]">Previous: </span>
                          <span className="font-semibold text-[#5B526D] dark:text-[#A1A1AA]">{ev.previous || '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Settings Tab */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1325] dark:text-[#EDEDED]">Data Provider Source</label>
            <p className="text-[11px] text-[#897E9C] dark:text-[#71717A]">
              Select which Forex Factory API source or feed to query for news events.
            </p>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: 'FAIRECONOMY' as NewsSourceType,
                  title: 'Forex Factory (Fair Economy CDN)',
                  desc: 'Direct free live JSON feed from Fair Economy. No API key needed.',
                },
                {
                  id: 'JBLANKED' as NewsSourceType,
                  title: 'JBlanked Free News API (Thread 1247273)',
                  desc: 'Community API from Forex Factory thread 1247273. Supports custom API key.',
                },
                {
                  id: 'HISTORICAL' as NewsSourceType,
                  title: 'Built-in Historical Backtest Dataset',
                  desc: 'Offline authentic Forex Factory news synced with chart candles.',
                },
              ].map((src) => (
                <div
                  key={src.id}
                  onClick={() => onChangeApiConfig({ ...apiConfig, source: src.id })}
                  className={`p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                    apiConfig.source === src.id
                      ? 'border-[#7C3AED] bg-[#7C3AED]/5 dark:bg-[#7C3AED]/15'
                      : 'border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#0A0A0C] hover:bg-white dark:hover:bg-[#141418]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1A1325] dark:text-[#EDEDED]">{src.title}</span>
                    {apiConfig.source === src.id && <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />}
                  </div>
                  <p className="text-[11px] text-[#897E9C] dark:text-[#71717A] mt-0.5">{src.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {apiConfig.source === 'JBLANKED' && (
            <div className="space-y-2 p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px]">
              <label className="text-xs font-semibold text-[#1A1325] dark:text-[#EDEDED]">JBlanked API Key (Optional)</label>
              <input
                type="text"
                placeholder="Enter your JBlanked API key..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-white dark:bg-[#000000] border border-[#E8DEF4] dark:border-[#27272A] rounded-[6px] px-2.5 py-1 text-xs text-[#1A1325] dark:text-[#EDEDED] focus:outline-none focus:border-[#7C3AED]"
              />
              <button
                onClick={() => {
                  onChangeApiConfig({ ...apiConfig, jblankedApiKey: apiKeyInput });
                  onRefreshNews();
                }}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-1 rounded-[6px] text-xs transition-colors cursor-pointer"
              >
                Save & Query API
              </button>
            </div>
          )}

          <div className="p-3 bg-[#FAF7FD] dark:bg-[#0A0A0C] border border-[#E8DEF4] dark:border-[#1F1F24] rounded-[6px] space-y-2">
            <span className="text-xs font-bold text-[#1A1325] dark:text-[#EDEDED]">Forex Factory Integration Info</span>
            <p className="text-[11px] text-[#5B526D] dark:text-[#A1A1AA] leading-relaxed">
              Forex Factory calendar events are automatically mapped to chart timestamps. High, Medium, and Low impact
              news events appear as color-coded markers directly above or below candles.
            </p>
            <a
              href="https://www.forexfactory.com/thread/1247273-free-news-api-machine-learning-live-trading-and"
              target="_blank"
              rel="noreferrer"
              className="text-[#7C3AED] hover:underline text-[11px] font-semibold flex items-center space-x-1"
            >
              <span>View Forex Factory Thread 1247273</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-2.5 border-t border-[#E8DEF4] dark:border-[#1F1F24] bg-[#FAF7FD] dark:bg-[#050507] flex items-center justify-between text-[11px] text-[#897E9C] dark:text-[#71717A]">
        <span>Source: {apiConfig.source}</span>
        <span className="font-medium text-[#1A1325] dark:text-[#EDEDED]">{filteredEvents.length} events loaded</span>
      </div>
    </div>
  );
};
