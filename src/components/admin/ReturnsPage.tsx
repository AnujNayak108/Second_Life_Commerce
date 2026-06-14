import { useState } from 'react';
import { Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import type { ReturnItem } from './mockData';

interface ReturnsPageProps {
  returns: ReturnItem[];
  onUpdateReturn: (id: string, updates: Partial<ReturnItem>) => void;
  onViewDetails: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export function ReturnsPage({ returns, onUpdateReturn, onViewDetails, statusFilter, setStatusFilter }: ReturnsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [sortField, setSortField] = useState<keyof ReturnItem>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handles sorting
  const handleSort = (field: keyof ReturnItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Search Logic
  const filteredReturns = returns.filter((item) => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesCondition;
  });

  // Sort Logic
  const sortedReturns = [...filteredReturns].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedReturns.length / itemsPerPage);
  const paginatedReturns = sortedReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ['Return ID', 'Customer', 'Product', 'Category', 'Condition', 'AI Recommendation', 'Confidence', 'Status', 'Date', 'Original Price', 'Resale Price'];
    const rows = filteredReturns.map(item => [
      item.id,
      item.customer,
      item.product,
      item.category,
      item.condition,
      item.aiDecision,
      `${item.confidence}%`,
      item.status,
      item.date,
      `INR ${item.originalPrice}`,
      `INR ${item.estimatedResalePrice}`
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SecondLife_Returns_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Class helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'Overridden':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
    }
  };

  // AI Decision Badge Class helper
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Resell':
        return 'bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/10';
      case 'Refurbish':
        return 'bg-cyan-50 dark:bg-cyan-500/5 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/10';
      case 'Recycle':
        return 'bg-orange-50 dark:bg-orange-500/5 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/10';
      case 'Donate':
        return 'bg-indigo-50 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/10';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns Lifecycle Queue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor visual grading results, inspect damage logs, and approve/override circular routing paths.</p>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-[#1A222D] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order, ID or Customer..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:border-[#FF9900] dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-[#FF9900]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Overridden">Overridden</option>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => { setConditionFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-[#FF9900]"
          >
            <option value="All">All Conditions</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-800 rounded bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors ml-auto md:ml-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Returns Data Table */}
      <div className="bg-white dark:bg-[#1A222D] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">Return ID <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('customer')}>
                  <div className="flex items-center gap-1">Customer <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('product')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('condition')}>
                  <div className="flex items-center gap-1">Condition <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('aiDecision')}>
                  <div className="flex items-center gap-1">AI Recommendation <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('confidence')}>
                  <div className="flex items-center gap-1">Confidence <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 cursor-pointer hover:text-[#FF9900]" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {paginatedReturns.length > 0 ? (
                paginatedReturns.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors align-middle"
                  >
                    {/* Return ID */}
                    <td className="px-5 py-4 font-mono text-xs font-bold text-gray-900 dark:text-white">{item.id}</td>
                    
                    {/* Customer */}
                    <td className="px-5 py-4 font-medium">{item.customer}</td>
                    
                    {/* Product */}
                    <td className="px-5 py-4 font-medium max-w-xs truncate text-gray-900 dark:text-white" title={item.product}>
                      {item.product}
                    </td>
                    
                    {/* Condition */}
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${
                        item.condition === 'Like New' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        item.condition === 'Good' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20' :
                        item.condition === 'Fair' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    
                    {/* AI Decision */}
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${getDecisionBadge(item.aiDecision)}`}>
                        {item.aiDecision}
                      </span>
                    </td>
                    
                    {/* Confidence */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-250 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.confidence >= 90 ? 'bg-emerald-500' : item.confidence >= 80 ? 'bg-cyan-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{item.confidence}%</span>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    
                    {/* Date */}
                    <td className="px-5 py-4 text-xs font-medium text-gray-500">{item.date}</td>
                    
                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Details */}
                        <button 
                          onClick={() => onViewDetails(item.id)}
                          className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-[#FF9900] transition-colors"
                          title="Inspect AI Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {item.status === 'Pending' && (
                          <>
                            {/* Approve */}
                            <button 
                              onClick={() => onUpdateReturn(item.id, { status: 'Approved' })}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded text-emerald-600 font-semibold text-xs flex items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-500/20"
                              title="Approve & List on P2P"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            
                            {/* Reject */}
                            <button 
                              onClick={() => onUpdateReturn(item.id, { status: 'Rejected' })}
                              className="px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-gray-500 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
                              title="Reject Return"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>

                            {/* Override Decision Dropdown/Select */}
                            <div className="relative group/override inline-block">
                              <button 
                                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded text-gray-500 hover:text-indigo-600 transition-colors"
                                title="Override AI Routing Decision"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              
                              {/* Override Flyout menu */}
                              <div className="absolute right-0 bottom-full mb-1 z-20 hidden group-hover/override:block bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded shadow-lg p-1 min-w-[120px] text-left">
                                <div className="text-[10px] text-gray-400 font-bold uppercase p-1.5 border-b border-gray-100 dark:border-gray-800">Route to:</div>
                                {(['Resell', 'Refurbish', 'Recycle', 'Donate'] as const).map(option => (
                                  <button
                                    key={option}
                                    onClick={() => onUpdateReturn(item.id, { aiDecision: option, status: 'Overridden' })}
                                    className="w-full text-xs hover:bg-[#FF9900]/10 dark:hover:bg-[#FF9900]/10 hover:text-[#FF9900] dark:hover:text-[#FF9900] px-2.5 py-1.5 text-left rounded font-medium text-gray-700 dark:text-gray-300"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        {item.status === 'Approved' && (
                          <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved ✓
                          </span>
                        )}
                        {item.status === 'Rejected' && (
                          <span className="px-3 py-1.5 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-xs rounded border border-rose-200 dark:border-rose-500/20 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No return items match your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedReturns.length)} of {sortedReturns.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1 rounded border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-6 h-6 rounded border transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-[#FF9900] border-[#FF9900] text-gray-900 font-bold' 
                      : 'border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1 rounded border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
