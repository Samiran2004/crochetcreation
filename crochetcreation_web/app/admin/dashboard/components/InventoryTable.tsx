'use client';
import { apiFetch } from '../../../utils/apiFetch';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Check, 
  X, 
  Trash2, 
  EyeOff, 
  Edit2, 
  PlusCircle, 
  MinusCircle,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import AddProductDrawer from './AddProductDrawer';

interface Product {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  in_stock?: boolean;
  stock_quantity?: number;
  stock_count?: number;
  size?: string;
  materials?: string;
  care_instructions?: string;
  delivery_time?: string;
  width?: number;
  height?: number;
  originalPrice?: number;
  sellingPrice?: number;
}

interface InventoryTableProps {
  products?: Product[];
  onUpdateProduct?: (productId: string, updatedFields: Partial<Product>) => Promise<any>;
  onDeleteProduct?: (productId: string) => Promise<void>;
  onAddProduct?: () => void;
}

export default function InventoryTable({
  products: initialProducts,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct
}: InventoryTableProps) {
  // Live products and loading states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'LOW' | 'OUT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Selected products for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Editing state for table cells: { productId, field: 'price' | 'stock' }
  const [activeEditCell, setActiveEditCell] = useState<{ id: string; field: 'price' | 'stock' } | null>(null);

  // Local state for all product edits (to track dirty rows)
  const [localEdits, setLocalEdits] = useState<Record<string, { price: number; stock: number }>>({});

  // Active action menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Loading state for individual row saving
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Real-time stock sync status: maps productId -> 'saving' | 'saved' | 'error' | null
  const [stockSyncStatus, setStockSyncStatus] = useState<Record<string, 'saving' | 'saved' | 'error' | null>>({});

  // Drawer state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Base API configuration
  const API_URL = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  }, []);

  const token = useMemo(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  // Fetch products from live database
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        console.error("Failed to load live catalog products");
      }
    } catch (err) {
      console.error("Live products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch products
  useEffect(() => {
    fetchProducts();
  }, [API_URL]);

  // Synchronize initialProducts prop if provided
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Auto-initialize localEdits when products list changes
  useEffect(() => {
    const edits: Record<string, { price: number; stock: number }> = {};
    products.forEach(p => {
      const id = p._id || p.id || '';
      const stock = p.stock_quantity !== undefined 
        ? p.stock_quantity 
        : (p.stock_count !== undefined ? p.stock_count : (p.in_stock !== false ? 15 : 0));
      
      edits[id] = {
        price: p.price,
        stock: stock
      };
    });
    setLocalEdits(edits);
  }, [products]);

  // Slide-out transition handler
  useEffect(() => {
    if (selectedProduct) {
      const timer = setTimeout(() => setDrawerOpen(true), 50);
      return () => clearTimeout(timer);
    } else {
      setDrawerOpen(false);
    }
  }, [selectedProduct]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Check if a specific row has been modified
  const isRowDirty = (productId: string) => {
    const original = products.find(p => p._id === productId || p.id === productId);
    const edited = localEdits[productId];
    if (!original || !edited) return false;
    
    const origStock = original.stock_quantity !== undefined 
      ? original.stock_quantity 
      : (original.stock_count !== undefined ? original.stock_count : (original.in_stock !== false ? 15 : 0));

    return original.price !== edited.price || origStock !== edited.stock;
  };

  // Helper: Computed Stock Badges
  const getStockBadge = (units: number) => {
    if (units === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-rose-550/10 text-rose-700 border border-rose-200/40 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Out of Stock
        </span>
      );
    }
    if (units <= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/40 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        In Stock
      </span>
    );
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const id = p._id || p.id || '';
      const editData = localEdits[id];
      const units = editData ? editData.stock : (p.in_stock ? 15 : 0);

      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                            p.category.toLowerCase().includes(search.toLowerCase()) ||
                            id.toLowerCase().includes(search.toLowerCase());
      
      let matchesStock = true;
      if (stockFilter === 'OUT') matchesStock = units === 0;
      else if (stockFilter === 'LOW') matchesStock = units > 0 && units <= 5;
      else if (stockFilter === 'IN') matchesStock = units > 5;

      const matchesCategory = categoryFilter === 'ALL' || p.category.toUpperCase() === categoryFilter.toUpperCase();

      return matchesSearch && matchesStock && matchesCategory;
    });
  }, [products, search, stockFilter, categoryFilter, localEdits]);

  // Input change handler for inline editing cells
  const handleCellChange = (productId: string, field: 'price' | 'stock', value: number) => {
    setLocalEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  // Real-time stock sync counter button action (Optimistic UI update)
  const handleStockClick = async (productId: string, change: number) => {
    const currentProduct = products.find(p => p._id === productId || p.id === productId);
    if (!currentProduct) return;

    const currentStock = localEdits[productId]?.stock ?? currentProduct.stock_quantity ?? currentProduct.stock_count ?? (currentProduct.in_stock ? 15 : 0);
    const newStock = Math.max(0, currentStock + change);

    // 1. Optimistic Update
    setLocalEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock: newStock
      }
    }));

    setProducts(prev => prev.map(p => {
      if (p._id === productId || p.id === productId) {
        return {
          ...p,
          stock_quantity: newStock,
          stock_count: newStock,
          in_stock: newStock > 0
        };
      }
      return p;
    }));

    // 2. Async Sync to Database
    setStockSyncStatus(prev => ({ ...prev, [productId]: 'saving' }));

    try {
      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_quantity: newStock,
          in_stock: newStock > 0
        })
      });

      if (res.ok) {
        setStockSyncStatus(prev => ({ ...prev, [productId]: 'saved' }));
        if (onUpdateProduct) {
          onUpdateProduct(productId, { stock_quantity: newStock, in_stock: newStock > 0 });
        }
        setTimeout(() => {
          setStockSyncStatus(prev => {
            if (prev[productId] === 'saved') {
              return { ...prev, [productId]: null };
            }
            return prev;
          });
        }, 1500);
      } else {
        throw new Error("Failed to update stock");
      }
    } catch (err) {
      console.error(err);
      setStockSyncStatus(prev => ({ ...prev, [productId]: 'error' }));
      // Revert stock update
      setLocalEdits(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          stock: currentStock
        }
      }));
      setProducts(prev => prev.map(p => {
        if (p._id === productId || p.id === productId) {
          return {
            ...p,
            stock_quantity: currentStock,
            stock_count: currentStock,
            in_stock: currentStock > 0
          };
        }
        return p;
      }));
    }
  };

  // Real-time stock sync manual typing input action (Optimistic UI update)
  const handleStockInputChange = async (productId: string, newStock: number) => {
    const currentProduct = products.find(p => p._id === productId || p.id === productId);
    if (!currentProduct) return;

    // 1. Optimistic Update
    setLocalEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock: newStock
      }
    }));

    setProducts(prev => prev.map(p => {
      if (p._id === productId || p.id === productId) {
        return {
          ...p,
          stock_quantity: newStock,
          stock_count: newStock,
          in_stock: newStock > 0
        };
      }
      return p;
    }));

    // 2. Async Sync to Database
    setStockSyncStatus(prev => ({ ...prev, [productId]: 'saving' }));

    try {
      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_quantity: newStock,
          in_stock: newStock > 0
        })
      });

      if (res.ok) {
        setStockSyncStatus(prev => ({ ...prev, [productId]: 'saved' }));
        if (onUpdateProduct) {
          onUpdateProduct(productId, { stock_quantity: newStock, in_stock: newStock > 0 });
        }
        setTimeout(() => {
          setStockSyncStatus(prev => {
            if (prev[productId] === 'saved') {
              return { ...prev, [productId]: null };
            }
            return prev;
          });
        }, 1500);
      } else {
        throw new Error("Failed to update stock");
      }
    } catch (err) {
      console.error(err);
      setStockSyncStatus(prev => ({ ...prev, [productId]: 'error' }));
      // Revert stock update
      const origStock = currentProduct.stock_quantity ?? currentProduct.stock_count ?? (currentProduct.in_stock ? 15 : 0);
      setLocalEdits(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          stock: origStock
        }
      }));
      setProducts(prev => prev.map(p => {
        if (p._id === productId || p.id === productId) {
          return {
            ...p,
            stock_quantity: origStock,
            stock_count: origStock,
            in_stock: origStock > 0
          };
        }
        return p;
      }));
    }
  };

  // Save changes to database (for other fields like Price)
  const handleSaveRow = async (productId: string) => {
    const edited = localEdits[productId];
    if (!edited) return;
    
    setSavingRowId(productId);
    try {
      const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: edited.price,
          stock_quantity: edited.stock,
          in_stock: edited.stock > 0
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(prev => prev.map(p => (p._id === productId || p.id === productId ? updated : p)));
        setActiveEditCell(null);
      } else {
        alert("Could not update catalog.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRowId(null);
    }
  };

  // Revert changes back to original
  const handleRevertRow = (productId: string) => {
    const original = products.find(p => p._id === productId || p.id === productId);
    if (!original) return;

    const origStock = original.stock_quantity !== undefined 
      ? original.stock_quantity 
      : (original.stock_count !== undefined ? original.stock_count : (original.in_stock !== false ? 15 : 0));

    setLocalEdits(prev => ({
      ...prev,
      [productId]: {
        price: original.price,
        stock: origStock
      }
    }));
    setActiveEditCell(null);
  };

  // Toggle Visibility / Hide Product
  const handleToggleHideProduct = async (productId: string, currentInStock: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentInStock ? 'hide/out-of-stock' : 'show/in-stock'} this product?`)) {
      const nextStock = currentInStock ? 0 : 15;
      try {
        const res = await apiFetch(`${API_URL}/api/products/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            in_stock: !currentInStock,
            stock_quantity: nextStock
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts(prev => prev.map(p => (p._id === productId || p.id === productId ? updated : p)));
        }
      } catch (err) {
        console.error(err);
      }
      setActiveMenuId(null);
    }
  };

  // Selection Checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p._id || p.id || '')));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (productId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  // Bulk Actions
  const handleBulkMarkOutOfStock = async () => {
    if (window.confirm(`Mark all ${selectedIds.size} selected products as Out of Stock?`)) {
      try {
        const promises = Array.from(selectedIds).map(id => apiFetch(`${API_URL}/api/products/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            in_stock: false,
            stock_quantity: 0
          })
        }));
        await Promise.all(promises);
        fetchProducts();
        setSelectedIds(new Set());
        alert("Selected items marked as Out of Stock.");
      } catch (err) {
        alert("Some items could not be updated.");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`WARNING: Are you sure you want to permanently delete all ${selectedIds.size} selected products?`)) {
      try {
        const promises = Array.from(selectedIds).map(id => {
          if (onDeleteProduct) {
            return onDeleteProduct(id);
          }
          return apiFetch(`${API_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        });
        await Promise.all(promises);
        fetchProducts();
        setSelectedIds(new Set());
        alert("Selected items successfully deleted.");
      } catch (err) {
        alert("Some items could not be deleted.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Utilities */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search catalog, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none placeholder-gray-400 font-semibold shadow-xs w-60 text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs focus:outline-none cursor-pointer hover:border-gray-300"
          >
            <option value="ALL">All Stocks</option>
            <option value="IN">In Stock</option>
            <option value="LOW">Low Stock (≤5)</option>
            <option value="OUT">Out of Stock</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs focus:outline-none cursor-pointer hover:border-gray-300"
          >
            <option value="ALL">All Categories</option>
            <option value="TOYS">Toys / Amigurumi</option>
            <option value="HOME">Home Decor</option>
            <option value="BAGS">Bags & Purses</option>
            <option value="GARMENTS">Garments</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </div>

        {/* ➕ Add Product Button */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>

      </div>

      {/* Bulk Action Panel */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md text-[10px]">
              {selectedIds.size}
            </span>
            <span>Items Selected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkOutOfStock}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Mark as Out of Stock
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Stock Data Grid */}
      <div className="border border-gray-150 rounded-xl bg-gray-50/20 p-1 min-h-[300px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Syncing live catalog data...</span>
          </div>
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl bg-white border border-gray-100">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 select-none">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-slate-955 focus:ring-slate-955 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Product details</th>
                    <th className="py-3 px-4 w-32">SKU Code</th>
                    <th className="py-3 px-4 w-32">Category</th>
                    <th className="py-3 px-4 w-36">Price</th>
                    <th className="py-3 px-4 w-36">Status</th>
                    <th className="py-3 px-4 w-44">Units Stock</th>
                    <th className="py-3 px-4 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400 text-xs">
                        No catalog items match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const id = p._id || p.id || '';
                      const isSelected = selectedIds.has(id);
                      const editData = localEdits[id] || { price: p.price, stock: p.in_stock ? 15 : 0 };
                      const isDirty = isRowDirty(id);
                      const syncState = stockSyncStatus[id];

                      return (
                        <tr 
                          key={id} 
                          className={`hover:bg-slate-50/30 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-50/20' : ''
                          }`}
                          onClick={() => setSelectedProduct(p)}
                        >
                          {/* Checkbox */}
                          <td className="py-4.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(id, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                            />
                          </td>

                          {/* Product Details info */}
                          <td className="py-4.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-stone-50 shadow-xs">
                                <img
                                  src={p.image_url}
                                  alt={p.title}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div className="text-left max-w-[200px]">
                                <p className="text-slate-900 font-bold truncate leading-tight">{p.title}</p>
                                <p className="text-[10px] text-gray-400 font-normal mt-0.5">{p.size || 'Standard Size'}</p>
                              </div>
                            </div>
                          </td>

                          {/* SKU Code */}
                          <td className="py-4.5 px-4 font-mono text-[10px] tracking-wide text-gray-450 uppercase font-bold">
                            SKU-CR-{id.slice(-6).toUpperCase()}
                          </td>

                          {/* Category */}
                          <td className="py-4.5 px-4 text-gray-500 uppercase text-[9px] font-bold tracking-wider">
                            {p.category}
                          </td>

                          {/* Price cell (Directly Inline Editable) */}
                          <td 
                            className="py-4.5 px-4 cursor-pointer hover:bg-slate-50/50 rounded-lg group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEditCell({ id, field: 'price' });
                            }}
                          >
                            {activeEditCell?.id === id && activeEditCell.field === 'price' ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <span className="text-gray-455 font-bold">₹</span>
                                <input
                                  type="number"
                                  autoFocus
                                  value={editData.price}
                                  onChange={(e) => handleCellChange(id, 'price', parseFloat(e.target.value) || 0)}
                                  onBlur={() => setActiveEditCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setActiveEditCell(null);
                                  }}
                                  className="w-20 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  ₹{editData.price?.toFixed(2)}
                                </span>
                                <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4.5 px-4">
                            {getStockBadge(editData.stock)}
                          </td>

                          {/* Units Stock cell with Optimistic counter & DB sync indicator */}
                          <td className="py-4.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStockClick(id, -1)}
                                className="text-gray-400 hover:text-slate-900 p-0.5 rounded-full transition-colors"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                              
                              <div 
                                className="w-10 text-center cursor-pointer hover:bg-slate-50 rounded py-0.5 font-extrabold text-slate-900"
                                onClick={() => setActiveEditCell({ id, field: 'stock' })}
                              >
                                {activeEditCell?.id === id && activeEditCell.field === 'stock' ? (
                                  <input
                                    type="number"
                                    autoFocus
                                    value={editData.stock}
                                    onChange={(e) => handleCellChange(id, 'stock', parseInt(e.target.value) || 0)}
                                    onBlur={() => {
                                      setActiveEditCell(null);
                                      handleStockInputChange(id, editData.stock);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setActiveEditCell(null);
                                        handleStockInputChange(id, editData.stock);
                                      }
                                    }}
                                    className="w-12 bg-gray-55 border border-gray-200 rounded px-1 py-0.5 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                                  />
                                ) : (
                                  <span>{editData.stock}</span>
                                )}
                              </div>

                              <button
                                onClick={() => handleStockClick(id, 1)}
                                className="text-gray-400 hover:text-slate-900 p-0.5 rounded-full transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              {/* Real-time DB Sync Indicators */}
                              <div className="w-16 flex items-center justify-start text-[10px]">
                                {syncState === 'saving' && (
                                  <span className="flex items-center gap-1 text-slate-400 font-semibold">
                                    <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                    Saving...
                                  </span>
                                )}
                                {syncState === 'saved' && (
                                  <span className="flex items-center gap-1 text-emerald-605 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Saved
                                  </span>
                                )}
                                {syncState === 'error' && (
                                  <span className="flex items-center gap-1 text-rose-600 font-bold" title="Reverted to DB state">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Error
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Action Column */}
                          <td className="py-4.5 px-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                            {isDirty ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  disabled={savingRowId === id}
                                  onClick={() => handleSaveRow(id)}
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-xs hover:shadow transition-all"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRevertRow(id)}
                                  className="p-1 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-lg transition-colors"
                                  title="Revert"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === id ? null : id)}
                                  className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {activeMenuId === id && (
                                  <>
                                    <div className="fixed inset-0 z-35" onClick={() => setActiveMenuId(null)}></div>
                                    <div className="absolute right-4 mt-8 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in-50 slide-in-from-top-2 duration-150 text-left">
                                      <button
                                        onClick={() => {
                                          setSelectedProduct(p);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                                      >
                                        <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          onUpdateProduct?.(id, {}); 
                                        }}
                                        className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                        Edit Details
                                      </button>
                                      <button
                                        onClick={() => handleToggleHideProduct(id, p.in_stock !== false)}
                                        className="w-full px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                                      >
                                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                                        {p.in_stock !== false ? 'Hide Product' : 'Show Product'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm("Are you sure you want to permanently delete this product?")) {
                                            if (onDeleteProduct) {
                                              onDeleteProduct(id);
                                            } else {
                                              apiFetch(`${API_URL}/api/products/${id}`, {
                                                method: 'DELETE',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                              }).then(() => fetchProducts());
                                            }
                                          }
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2 border-t border-gray-100 mt-1 pt-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        Delete Product
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Card Grid */}
            <div className="block md:hidden space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No catalog items match current filter criteria.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const id = p._id || p.id || '';
                  const isSelected = selectedIds.has(id);
                  const editData = localEdits[id] || { price: p.price, stock: p.in_stock ? 15 : 0 };
                  const isDirty = isRowDirty(id);
                  const syncState = stockSyncStatus[id];
                  
                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedProduct(p)}
                      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 space-y-3 shadow-xs active:scale-[0.98] transition-transform duration-100 select-none relative ${
                        isSelected ? 'border-slate-900 dark:border-white bg-slate-50/10' : 'border-gray-250 dark:border-slate-850'
                      }`}
                    >
                      {/* Top Row: Checkbox, SKU, Status & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center min-w-[32px] min-h-[32px]">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(id, e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-slate-955 focus:ring-slate-955 cursor-pointer"
                            />
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-bold">
                            SKU-CR-{id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStockBadge(editData.stock)}
                          
                          <div onClick={(e) => e.stopPropagation()} className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === id ? null : id)}
                              className="p-1.5 text-gray-405 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[36px] min-w-[36px]"
                            >
                              <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                            
                            {activeMenuId === id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)}></div>
                                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-40 text-left">
                                  <button
                                    onClick={() => {
                                      setSelectedProduct(p);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 min-h-[40px]"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onUpdateProduct?.(id, {}); 
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 min-h-[40px]"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => handleToggleHideProduct(id, p.in_stock !== false)}
                                    className="w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 min-h-[40px]"
                                  >
                                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                                    {p.in_stock !== false ? 'Hide Product' : 'Show Product'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm("Are you sure you want to permanently delete this product?")) {
                                        if (onDeleteProduct) {
                                          onDeleteProduct(id);
                                        } else {
                                          apiFetch(`${API_URL}/api/products/${id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          }).then(() => fetchProducts());
                                        }
                                      }
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold text-rose-600 flex items-center gap-2 border-t border-gray-100 dark:border-slate-800 mt-1 pt-1 min-h-[40px]"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    Delete Product
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Product Info Block */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 shrink-0 bg-stone-50 shadow-xs">
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">{p.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {p.category}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{p.size || 'Standard Size'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Stock Stepper Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-850">
                        {/* Price cell (Directly Inline Editable) */}
                        <div 
                          className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg py-1 px-2 -ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEditCell({ id, field: 'price' });
                          }}
                        >
                          {activeEditCell?.id === id && activeEditCell.field === 'price' ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-gray-405 font-bold">₹</span>
                              <input
                                type="number"
                                autoFocus
                                value={editData.price}
                                onChange={(e) => handleCellChange(id, 'price', parseFloat(e.target.value) || 0)}
                                onBlur={() => setActiveEditCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setActiveEditCell(null);
                                }}
                                className="w-16 bg-gray-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none text-slate-800 dark:text-white"
                              />
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                              ₹{editData.price?.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Stock Stepper */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStockClick(id, -1)}
                            className="text-gray-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full transition-colors active:scale-90 min-h-[36px] min-w-[36px] flex items-center justify-center border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          
                          <div 
                            className="w-8 text-center cursor-pointer font-black text-slate-905 dark:text-slate-205 text-xs"
                            onClick={() => setActiveEditCell({ id, field: 'stock' })}
                          >
                            {activeEditCell?.id === id && activeEditCell.field === 'stock' ? (
                              <input
                                type="number"
                                autoFocus
                                value={editData.stock}
                                onChange={(e) => handleCellChange(id, 'stock', parseInt(e.target.value) || 0)}
                                onBlur={() => {
                                  setActiveEditCell(null);
                                  handleStockInputChange(id, editData.stock);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setActiveEditCell(null);
                                    handleStockInputChange(id, editData.stock);
                                  }
                                }}
                                className="w-10 bg-gray-55 dark:bg-slate-950 border border-gray-250 dark:border-slate-850 rounded px-0.5 py-0.5 text-center text-xs font-bold text-slate-800 dark:text-white"
                              />
                            ) : (
                              <span>{editData.stock}</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleStockClick(id, 1)}
                            className="text-gray-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full transition-colors active:scale-90 min-h-[36px] min-w-[36px] flex items-center justify-center border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          
                          {/* Sync indicator */}
                          {syncState && (
                            <div className="w-12 text-[9px] font-bold">
                              {syncState === 'saving' && <span className="text-slate-400">Saving...</span>}
                              {syncState === 'saved' && <span className="text-emerald-500">Saved</span>}
                              {syncState === 'error' && <span className="text-rose-500">Err</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Save/Revert row controls if dirty */}
                      {isDirty && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-gray-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRevertRow(id)}
                            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg"
                          >
                            Revert
                          </button>
                          <button
                            disabled={savingRowId === id}
                            onClick={() => handleSaveRow(id)}
                            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 shadow-xs"
                          >
                            {savingRowId === id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide-out Product Details Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleCloseDrawer}
          ></div>

          {/* Drawer container */}
          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div 
              className={`w-screen max-w-md bg-white shadow-2xl flex flex-col divide-y divide-gray-150 transform transition-transform duration-300 ease-in-out ${
                drawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50 flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Product Details</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                    SKU-CR-{(selectedProduct._id || selectedProduct.id || '').slice(-6).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-left">
                {/* Product Image */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.title}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Title & Category */}
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2 leading-tight">
                    {selectedProduct.title}
                  </h3>
                </div>

                {/* Stock status indicator */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Inventory</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {localEdits[selectedProduct._id || selectedProduct.id || '']?.stock ?? selectedProduct.stock_quantity ?? selectedProduct.stock_count ?? (selectedProduct.in_stock ? 15 : 0)} units
                    </p>
                  </div>
                  <div>
                    {getStockBadge(localEdits[selectedProduct._id || selectedProduct.id || '']?.stock ?? selectedProduct.stock_quantity ?? selectedProduct.stock_count ?? (selectedProduct.in_stock ? 15 : 0))}
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pricing Architecture</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 border border-slate-100 rounded-xl bg-white text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Base Price</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        ₹{(localEdits[selectedProduct._id || selectedProduct.id || '']?.price ?? selectedProduct.price)?.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Selling Price</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        ₹{selectedProduct.sellingPrice ? selectedProduct.sellingPrice.toFixed(2) : '-'}
                      </p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl bg-white text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Original Price</p>
                      <p className="text-sm font-extrabold text-slate-400 line-through mt-1">
                        ₹{selectedProduct.originalPrice ? selectedProduct.originalPrice.toFixed(2) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specifications & Properties */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Specifications</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold">Dimensions</span>
                      <span className="font-semibold text-slate-800">
                        {selectedProduct.width && selectedProduct.height 
                          ? `${selectedProduct.width}w x ${selectedProduct.height}h px`
                          : selectedProduct.size || 'Standard Size'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Materials</span>
                      <span className="font-semibold text-slate-800">{selectedProduct.materials || 'Organic Yarn / Cotton'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Delivery Time</span>
                      <span className="font-semibold text-slate-800">{selectedProduct.delivery_time || '5-7 business days'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Care Instructions</span>
                      <span className="font-semibold text-slate-800">{selectedProduct.care_instructions || 'Hand wash cold'}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedProduct.description || 'No description provided for this product.'}
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Product Drawer */}
      <AddProductDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSuccess={fetchProducts}
      />

    </div>
  );
}
