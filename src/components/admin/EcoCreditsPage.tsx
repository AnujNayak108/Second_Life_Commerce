import { useState } from 'react';
import { Search, Trophy, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import type { EcoCreditUser } from './mockData';
import { MOCK_USERS } from './mockData';

export function EcoCreditsPage() {
  const [users] = useState<EcoCreditUser[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof EcoCreditUser>('currentBalance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Transaction History Modal state
  const [activeUser, setActiveUser] = useState<EcoCreditUser | null>(null);

  // Sorting
  const handleSort = (field: keyof EcoCreditUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredUsers = users.filter(user => 
    user.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Top 3 Leaderboard contributors
  const leaderboard = [...users]
    .sort((a, b) => b.creditsEarned - a.creditsEarned)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eco Credits Ledger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer rewards balance, track coin transactions, and view carbon offset leaders.</p>
      </div>

      {/* Leaderboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboard.map((item, index) => {
          const medals = ['🥇 Gold', '🥈 Silver', '🥉 Bronze'];
          const colors = [
            'border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
            'border-slate-300 bg-slate-100/30 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400',
            'border-amber-600/30 bg-amber-600/5 dark:bg-amber-600/10 text-amber-700 dark:text-amber-500'
          ];
          return (
            <div 
              key={item.id} 
              className={`p-5 rounded-lg border flex items-center justify-between shadow-sm relative overflow-hidden bg-white dark:bg-[#1A222D] ${colors[index]}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75">{medals[index]} Contributor</span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{item.customer}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avoided {item.impactSaved} landfill</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{item.creditsEarned}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-75">Credits Earned</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control bar */}
      <div className="bg-white dark:bg-[#1A222D] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:border-[#FF9900] dark:text-white"
          />
        </div>

        {/* Sort Helper tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-gray-400 uppercase">Sort by:</span>
          <button 
            onClick={() => handleSort('currentBalance')}
            className={`px-3 py-1 rounded border ${sortField === 'currentBalance' ? 'bg-[#FF9900] border-[#FF9900] text-gray-900 font-bold' : 'border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'}`}
          >
            Balance
          </button>
          <button 
            onClick={() => handleSort('creditsEarned')}
            className={`px-3 py-1 rounded border ${sortField === 'creditsEarned' ? 'bg-[#FF9900] border-[#FF9900] text-gray-900 font-bold' : 'border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'}`}
          >
            Earned
          </button>
          <button 
            onClick={() => handleSort('totalTransactions')}
            className={`px-3 py-1 rounded border ${sortField === 'totalTransactions' ? 'bg-[#FF9900] border-[#FF9900] text-gray-900 font-bold' : 'border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'}`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Users Balance Table */}
      <div className="bg-white dark:bg-[#1A222D] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Customer Name</th>
                <th className="px-5 py-4 cursor-pointer" onClick={() => handleSort('creditsEarned')}>Credits Earned</th>
                <th className="px-5 py-4 cursor-pointer" onClick={() => handleSort('creditsRedeemed')}>Credits Redeemed</th>
                <th className="px-5 py-4 cursor-pointer" onClick={() => handleSort('currentBalance')}>Active Balance</th>
                <th className="px-5 py-4 cursor-pointer" onClick={() => handleSort('totalTransactions')}>Total Transactions</th>
                <th className="px-5 py-4 text-right">Ledger Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors align-middle">
                  <td className="px-5 py-4 font-mono font-bold text-gray-400">#{user.rank}</td>
                  <td className="px-5 py-4 font-bold text-gray-950 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{user.avatar}</span>
                      <span>{user.customer}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-500">+{user.creditsEarned} 🪙</td>
                  <td className="px-5 py-4 text-rose-600 dark:text-rose-500">-{user.creditsRedeemed} 🪙</td>
                  <td className="px-5 py-4 font-black text-gray-900 dark:text-white">{user.currentBalance} 🪙</td>
                  <td className="px-5 py-4 font-medium">{user.totalTransactions} transactions</td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => setActiveUser(user)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-800 rounded hover:bg-[#FF9900]/10 dark:hover:bg-[#FF9900]/10 hover:text-[#FF9900] dark:hover:text-[#FF9900] hover:border-[#FF9900] dark:hover:border-[#FF9900] font-bold text-xs transition-all text-gray-700 dark:text-gray-300"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Modal */}
      {activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveUser(null)} />
          <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl max-w-lg w-full z-10 overflow-hidden text-gray-700 dark:text-gray-350">
            
            {/* Modal Header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-5 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Eco Ledgers: {activeUser.customer}</h3>
              </div>
              <button onClick={() => setActiveUser(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content - Ledger */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              
              {/* User Account summary stats */}
              <div className="grid grid-cols-3 gap-3 text-center border-b border-gray-150 dark:border-gray-800 pb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Credits Earned</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-1">{activeUser.creditsEarned}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Credits Redeemed</span>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-500 mt-1">{activeUser.creditsRedeemed}</div>
                </div>
                <div className="p-3 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded">
                  <span className="text-[10px] uppercase font-bold text-[#FF9900]">Wallet Balance</span>
                  <div className="text-lg font-black text-gray-900 dark:text-white mt-1">{activeUser.currentBalance} 🪙</div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction History</h4>
                
                {activeUser.transactions.length > 0 ? (
                  activeUser.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded border border-gray-150 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <div className="space-y-0.5 pr-4 text-xs">
                        <div className="font-bold text-gray-900 dark:text-white">{tx.activity}</div>
                        <div className="text-[10px] text-gray-400">{tx.date} · TransID: {tx.id}</div>
                      </div>
                      <div className="shrink-0 text-right font-black text-sm">
                        {tx.type === 'Earned' ? (
                          <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-0.5">
                            <ArrowUpRight className="w-4 h-4" /> +{tx.amount}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-500 flex items-center gap-0.5">
                            <ArrowDownRight className="w-4 h-4" /> -{tx.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No recent eco credit transactions found.</p>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-55 dark:bg-gray-900 px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setActiveUser(null)}
                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded"
              >
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
