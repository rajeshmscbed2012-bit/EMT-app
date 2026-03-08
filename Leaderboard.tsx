import React from 'react';
import { QuizResult } from '../types';

interface LeaderboardProps {
  results: QuizResult[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ results, onBack }) => {
  const bestScores = new Map<string, QuizResult>();
  results.forEach(r => {
    const existing = bestScores.get(r.emtId);
    if (!existing || r.percentage > existing.percentage) bestScores.set(r.emtId, r);
  });

  const leaderboard = Array.from(bestScores.values()).sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken);
  const topPerformers = leaderboard.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0c1222] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="bg-[#0c1222]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 text-lg">←</button>
            <div>
              <h1 className="font-black flex items-center gap-2">🏆 Leaderboard</h1>
              <p className="text-[10px] text-gray-500">Top EMT Rankings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {leaderboard.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-7xl mb-4 opacity-20 animate-float">🏆</div>
            <h2 className="text-xl font-black text-gray-600 mb-2">No Results Yet</h2>
            <p className="text-xs text-gray-700">Take a test to appear here</p>
          </div>
        ) : (
          <>
            {leaderboard.length >= 1 && (
              <div className="flex items-end justify-center gap-3 mb-8 px-4 animate-slide-up">
                {leaderboard.length >= 2 && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-xl rotate-[-3deg]">🥈</div>
                    <div className="text-xs font-black truncate w-full text-center">{leaderboard[1].emtName}</div>
                    <div className="text-[9px] text-gray-600 font-mono">{leaderboard[1].emtId}</div>
                    <div className="glass-card rounded-t-2xl w-full h-20 flex items-center justify-center mt-2 border-gray-400/10">
                      <span className="text-xl font-black text-gray-300">{leaderboard[1].percentage}%</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center w-1/3">
                  <div className="relative animate-float">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-xl shadow-yellow-500/20 glow-amber">🏆</div>
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#0c1222]">#1</div>
                  </div>
                  <div className="text-sm font-black truncate w-full text-center">{leaderboard[0].emtName}</div>
                  <div className="text-[9px] text-gray-600 font-mono">{leaderboard[0].emtId}</div>
                  <div className="bg-gradient-to-b from-yellow-500/15 to-amber-500/10 border border-yellow-500/20 rounded-t-2xl w-full h-28 flex items-center justify-center mt-2">
                    <span className="text-2xl font-black text-gradient-gold">{leaderboard[0].percentage}%</span>
                  </div>
                </div>
                {leaderboard.length >= 3 && (
                  <div className="flex flex-col items-center w-1/3">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-xl rotate-[3deg]">🥉</div>
                    <div className="text-xs font-black truncate w-full text-center">{leaderboard[2].emtName}</div>
                    <div className="text-[9px] text-gray-600 font-mono">{leaderboard[2].emtId}</div>
                    <div className="glass-card rounded-t-2xl w-full h-16 flex items-center justify-center mt-2 border-amber-700/10">
                      <span className="text-xl font-black text-amber-500">{leaderboard[2].percentage}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="glass-card rounded-3xl overflow-hidden mb-6">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-black text-sm flex items-center gap-2">🏅 Full Rankings</h3>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {topPerformers.map((r, idx) => (
                  <div key={r.id} className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${idx < 3 ? 'bg-yellow-500/[0.02]' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400 glow-amber' :
                      idx === 1 ? 'bg-gray-400/15 text-gray-300' :
                      idx === 2 ? 'bg-amber-700/15 text-amber-500' :
                      'bg-white/5 text-gray-600'
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        {r.emtName}
                        {idx === 0 && <span className="text-yellow-400 text-xs">⭐</span>}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono">{r.emtId}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-sm ${
                        r.percentage >= 90 ? 'text-emerald-400' : r.percentage >= 75 ? 'text-teal-400' : r.percentage >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>{r.percentage}%</div>
                      <div className="text-[10px] text-gray-600">{r.score}/{r.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">📈 Statistics</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'EMTs', value: leaderboard.length, color: 'text-teal-400', icon: '👥' },
                  { label: 'Highest', value: leaderboard.length > 0 ? `${leaderboard[0].percentage}%` : 'N/A', color: 'text-emerald-400', icon: '🏆' },
                  { label: 'Average', value: leaderboard.length > 0 ? `${Math.round(leaderboard.reduce((s, r) => s + r.percentage, 0) / leaderboard.length)}%` : 'N/A', color: 'text-amber-400', icon: '📊' },
                  { label: 'Tests', value: results.length, color: 'text-cyan-400', icon: '📝' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{stat.icon}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
