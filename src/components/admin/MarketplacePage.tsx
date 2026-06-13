import { useState } from 'react';
import { Search, Plus, ExternalLink, Edit2, Trash2, CheckCircle, Save, ShoppingCart, X } from 'lucide-react';
import type { MarketplaceListing } from './mockData';

interface MarketplacePageProps {
  listings: MarketplaceListing[];
  onUpdateListing: (id: string, updates: Partial<MarketplaceListing>) => void;
  onRemoveListing: (id: string) => void;
}

export function MarketplacePage({ listings, onUpdateListing, onRemoveListing }: MarketplacePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editInventory, setEditInventory] = useState<number>(0);

  // Bulk actions selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Product Preview Modal state
  const [previewItem, setPreviewItem] = useState<MarketplaceListing | null>(null);

  // Filters
  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredListings.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const handleEditClick = (item: MarketplaceListing) => {
    setEditingId(item.id);
    setEditPrice(item.resalePrice);
    setEditInventory(item.inventory);
  };

  const handleSaveClick = (id: string) => {
    onUpdateListing(id, { resalePrice: editPrice, inventory: editInventory });
    setEditingId(null);
  };

  const handleBulkStatusChange = (status: MarketplaceListing['status']) => {
    selectedIds.forEach(id => {
      onUpdateListing(id, { status });
    });
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      onRemoveListing(id);
    });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resale Listings Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Publish inspected and graded stock onto Amazon Renewed and peer-to-peer marketplaces.</p>
        </div>
        <button 
          onClick={() => {
            const name = prompt("Enter product name:");
            if (name) {
              const price = Number(prompt("Enter resale price (INR):") || 0);
              const original = Number(prompt("Enter original retail price (INR):") || 0);
              const condition = 'Good';
              const id = `MP00${listings.length + 1}`;
              onUpdateListing(id, { 
                id, 
                product: name, 
                category: 'Electronics', 
                condition, 
                resalePrice: price, 
                originalPrice: original, 
                inventory: 1, 
                status: 'Draft',
                image: '📦'
              });
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#FF9900] hover:bg-[#E08800] text-gray-900 font-bold rounded shadow transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Manual Listing
        </button>
      </div>

      {/* Control bar */}
      <div className="bg-white dark:bg-[#1A222D] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Marketplace Inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:border-[#FF9900] dark:text-white"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#FF9900]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Listings</option>
            <option value="Draft">Draft Listings</option>
            <option value="Refurbishing">Refurbishing</option>
          </select>

          {/* Bulk actions block */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-3">
              <span className="text-xs text-gray-400 font-bold">{selectedIds.length} Selected:</span>
              <button
                onClick={() => handleBulkStatusChange('Active')}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-xs font-bold rounded border border-emerald-200 dark:border-emerald-500/10 transition-colors"
              >
                Publish All
              </button>
              <button
                onClick={() => handleBulkStatusChange('Refurbishing')}
                className="px-2.5 py-1 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 text-xs font-bold rounded border border-cyan-200 dark:border-cyan-500/10 transition-colors"
              >
                Refurbish All
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 text-xs font-bold rounded border border-rose-200 dark:border-rose-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Grid/Table Layout */}
      <div className="bg-white dark:bg-[#1A222D] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredListings.length && filteredListings.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-800 focus:ring-[#FF9900]"
                  />
                </th>
                <th className="px-5 py-4">Product Details</th>
                <th className="px-5 py-4">Condition</th>
                <th className="px-5 py-4">Resale Price</th>
                <th className="px-5 py-4">Inventory</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredListings.length > 0 ? (
                filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors align-middle">
                    
                    {/* Checkbox select */}
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-800 focus:ring-[#FF9900]"
                      />
                    </td>

                    {/* Product cell with image */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 flex items-center justify-center text-2xl shrink-0">
                          {item.image}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{item.product}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {item.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="px-5 py-4 font-semibold text-xs text-gray-900 dark:text-white">
                      Grade {item.condition === 'Like New' ? 'A' : item.condition === 'Good' ? 'B' : 'C'} ({item.condition})
                    </td>

                    {/* Resale Price */}
                    <td className="px-5 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1 max-w-[120px]">
                          <span className="text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-full text-xs font-bold px-2 py-1 border border-gray-300 dark:border-gray-800 rounded bg-gray-55 dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">₹{item.resalePrice.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-gray-400">Original: ₹{item.originalPrice.toLocaleString('en-IN')}</div>
                        </div>
                      )}
                    </td>

                    {/* Inventory */}
                    <td className="px-5 py-4">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editInventory}
                          onChange={(e) => setEditInventory(Number(e.target.value))}
                          className="w-16 text-xs px-2 py-1 border border-gray-300 dark:border-gray-800 rounded bg-gray-55 dark:bg-gray-900 dark:text-white font-semibold"
                        />
                      ) : (
                        <span className={`font-semibold ${item.inventory <= 2 ? 'text-amber-600 font-bold' : ''}`}>
                          {item.inventory} units
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                        item.status === 'Draft' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                        'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {editingId === item.id ? (
                          <button
                            onClick={() => handleSaveClick(item.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'Draft' && (
                          <button
                            onClick={() => onUpdateListing(item.id, { status: 'Active' })}
                            className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded text-emerald-600 font-bold"
                            title="Publish Listing"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-[#FF9900]"
                          title="Preview Storefront Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onRemoveListing(item.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-rose-600"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No products ready in the marketplace table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />
          <div className="bg-white border border-[#D5D9D9] rounded shadow-2xl max-w-xl w-full z-10 overflow-hidden text-[#0F1111] font-sans">
            
            {/* Modal Header bar */}
            <div className="bg-[#131921] px-5 py-3.5 flex justify-between items-center text-white border-b border-[#232F3E]">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base leading-tight">amazon</span>
                <span className="text-[#FF9900] text-[8px] font-black uppercase tracking-wider">Renewed Preview</span>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Amazon Product Detail Page Widget */}
            <div className="p-6 bg-[#EAEDED] space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="bg-white rounded border border-[#D5D9D9] p-5 flex flex-col md:flex-row gap-5">
                
                {/* Photo Gallery Column */}
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="w-full aspect-square bg-[#F7F8F8] border border-gray-150 rounded flex items-center justify-center text-6xl">
                    {previewItem.image}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase mt-2 font-bold tracking-wider">Visual Scan Verified</span>
                </div>

                {/* Buy Box & Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 leading-snug hover:underline hover:cursor-pointer">{previewItem.product} - Renewed</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs bg-[#FF9900]/10 border border-[#FF9900]/20 text-[#E08800] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider">Certified Renewed</span>
                      <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">Grade {previewItem.condition === 'Like New' ? 'A' : previewItem.condition === 'Good' ? 'B' : 'C'}</span>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-gray-500">Price:</span>
                      <span className="text-xl font-medium text-[#B12704]">₹{previewItem.resalePrice.toLocaleString('en-IN')}.00</span>
                    </div>
                    <div className="text-xs text-gray-500">M.R.P.: <span className="line-through">₹{previewItem.originalPrice.toLocaleString('en-IN')}.00</span></div>
                    <div className="text-xs text-emerald-600 font-bold">In Stock.</div>
                  </div>

                  <div className="bg-[#FFFBF0] border border-[#FFD814]/50 rounded-sm p-3 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1 text-[#007600]"><ShoppingCart className="w-3.5 h-3.5" /> Eco-Shopping Benefit</div>
                    <p className="text-gray-600">Purchase of this Renewed item prevents <strong>8.2kg</strong> of electronic landfill waste and awards you <strong>50 Green Coins 🪙</strong>.</p>
                  </div>

                  <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-gray-900 font-bold py-1.5 rounded-full text-xs transition-colors shadow-sm cursor-not-allowed">
                    Add to Cart
                  </button>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-150 font-bold text-gray-700"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
