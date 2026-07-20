'use client';
import { apiFetch } from '../../utils/apiFetch';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Folder, 
  IndianRupee, 
  FileText,
  AlertTriangle,
  Ruler,
  Sparkles,
  Heart,
  Check,
  HelpCircle,
  Search,
  SlidersHorizontal,
  Package,
  Truck
} from 'lucide-react';

interface Product {
  _id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  sellingPrice?: number;
  category: string;
  image_url: string;
  image_urls?: string[];
  size?: string;
  materials?: string;
  care_instructions?: string;
  in_stock?: boolean;
  delivery_time?: string;
  has_sizes?: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStock, setSelectedStock] = useState('ALL');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    sellingPrice: '',
    category: 'TOYS',
    size: '',
    materials: '',
    care_instructions: '',
    in_stock: 'true',
    delivery_time: '5-7 working days',
    has_sizes: 'false',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete modal confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : 'https://crochetcreation.onrender.com');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/products?limit=1000`);
      if (!res.ok) throw new Error("Could not fetch product catalog.");
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      setProducts(items);
    } catch (err: any) {
      setError(err.message || "Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      sellingPrice: '',
      category: 'TOYS',
      size: '',
      materials: '',
      care_instructions: '',
      in_stock: 'true',
      delivery_time: '5-7 working days',
      has_sizes: 'false',
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setDeletedImages([]);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : product.price.toString(),
      sellingPrice: product.sellingPrice ? product.sellingPrice.toString() : product.price.toString(),
      category: product.category,
      size: product.size || '',
      materials: product.materials || '',
      care_instructions: product.care_instructions || '',
      in_stock: product.in_stock !== false ? 'true' : 'false',
      delivery_time: product.delivery_time || '5-7 working days',
      has_sizes: product.has_sizes !== false && product.has_sizes !== undefined ? 'true' : 'false',
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setDeletedImages([]);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitError("Session expired. Please log in again.");
      setSubmitLoading(false);
      return;
    }

    try {
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('description', formData.description);
      const basePrice = formData.sellingPrice || formData.price || formData.originalPrice || '0';
      submissionData.append('price', basePrice);
      if (formData.originalPrice) {
        submissionData.append('originalPrice', formData.originalPrice);
      }
      if (formData.sellingPrice) {
        submissionData.append('sellingPrice', formData.sellingPrice);
      }
      submissionData.append('category', formData.category.toUpperCase());
      submissionData.append('size', formData.size);
      submissionData.append('materials', formData.materials);
      submissionData.append('care_instructions', formData.care_instructions);
      submissionData.append('in_stock', formData.in_stock);
      submissionData.append('delivery_time', formData.delivery_time);
      submissionData.append('has_sizes', formData.category.toUpperCase() === 'GARMENTS' ? formData.has_sizes : 'false');
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          submissionData.append('images', file);
        });
      }

      if (deletedImages.length > 0) {
        submissionData.append('deleted_images', JSON.stringify(deletedImages));
      }

      let url = `${API_URL}/api/products/`;
      let method = 'POST';

      if (editingProduct && editingProduct._id) {
        url = `${API_URL}/api/products/${editingProduct._id}`;
        method = 'PUT'; // Using PUT because backend update_product accepts Form
      } else {
        // For creations, image file is required
        if (selectedFiles.length === 0) {
          throw new Error("Please upload at least one product image.");
        }
      }

      // Check for empty image list on edit
      if (editingProduct && editingProduct._id) {
        const remainingImages = (editingProduct.image_urls && editingProduct.image_urls.length > 0 
          ? editingProduct.image_urls 
          : [editingProduct.image_url]).filter(url => url && !deletedImages.includes(url));
        
        if (remainingImages.length === 0 && selectedFiles.length === 0) {
          throw new Error("Product must have at least one image. Upload a new image before deleting the last one.");
        }
      }

      const res = await apiFetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });

      if (!res.ok) {
        const errData = await res.json();
        // Parse validation error properly
        if (errData.detail && Array.isArray(errData.detail)) {
          const messages = errData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join('.') : '';
            return `${loc}: ${err.msg}`;
          });
          throw new Error(messages.join(', '));
        }
        throw new Error(errData.detail || "Request failed. Please check inputs.");
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process product. Try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !productToDelete._id) return;
    setDeleteLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      setDeleteLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/api/products/${productToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Could not delete product.");
      }

      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalCount = products.length;
  const inStockCount = products.filter(p => p.in_stock !== false).length;
  const outOfStockCount = products.filter(p => p.in_stock === false).length;
  const averagePrice = products.length > 0 
    ? products.reduce((acc, p) => acc + p.price, 0) / products.length 
    : 0;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesStock = selectedStock === 'ALL' || 
                         (selectedStock === 'IN_STOCK' && product.in_stock !== false) ||
                         (selectedStock === 'OUT_OF_STOCK' && product.in_stock === false);
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Premium Top Header Card */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-8 rounded-[2rem] border border-[#F0E4E4] shadow-sm bg-gradient-to-br from-[#FEF9F6] to-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-bl from-[#D9B4B4]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-gradient-to-tr from-[#EADBDB]/30 to-transparent rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-[#4A3E3E] tracking-wide mb-2">Catalog Management</h2>
          <p className="text-sm font-medium text-stone-500 max-w-lg leading-relaxed">
            Create, update, and manage your inventory of custom crochet creations.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="relative z-10 bg-[#4A3E3E] hover:bg-[#6B5656] text-white font-bold text-[11px] uppercase tracking-widest py-4 px-7 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-[#4A3E3E]/10 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Premium Catalog Metrics Summary Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Products */}
        <div className="group relative bg-white hover:bg-stone-50/50 border border-stone-100 hover:border-stone-200 rounded-[2rem] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 flex flex-col gap-5 overflow-hidden">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-stone-600 w-fit group-hover:scale-110 transition-transform duration-300">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Total Products</span>
            <span className="text-[#4A3E3E] font-serif text-3xl md:text-4xl block leading-none">{totalCount}</span>
          </div>
        </div>

        {/* In Stock */}
        <div className="group relative bg-white hover:bg-emerald-50/30 border border-stone-100 hover:border-emerald-100 rounded-[2rem] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)] transition-all duration-300 flex flex-col gap-5 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 w-fit group-hover:scale-110 transition-transform duration-300 relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-ping"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 -right-1"></span>
            <Check className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Active / In Stock</span>
            <span className="text-emerald-700 font-serif text-3xl md:text-4xl block leading-none">{inStockCount}</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="group relative bg-white hover:bg-rose-50/30 border border-stone-100 hover:border-rose-100 rounded-[2rem] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] hover:shadow-[0_8px_30px_rgb(244,63,94,0.06)] transition-all duration-300 flex flex-col gap-5 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100/50 text-rose-600 w-fit group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Out of Stock</span>
            <span className="text-rose-600 font-serif text-3xl md:text-4xl block leading-none">{outOfStockCount}</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="group relative bg-white hover:bg-amber-50/30 border border-stone-100 hover:border-amber-100 rounded-[2rem] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.06)] transition-all duration-300 flex flex-col gap-5 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100/50 text-amber-600 w-fit group-hover:scale-110 transition-transform duration-300">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Average Price</span>
            <span className="text-amber-700 font-serif text-3xl md:text-4xl block leading-none">₹{averagePrice.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Premium Toolbar - Search & Filtering */}
      <div className="bg-white border border-stone-100 rounded-[2rem] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#D9B4B4] transition-colors" />
          <input 
            type="text"
            placeholder="Search catalog by title, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border-2 border-stone-100 hover:border-stone-200 focus:border-[#D9B4B4] focus:bg-white pl-11 pr-5 py-3.5 rounded-2xl text-xs font-medium focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-300"
          />
        </div>
        <div className="flex w-full md:w-auto gap-3 items-center">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-1/2 md:w-auto bg-stone-50 border-2 border-stone-100 hover:border-stone-200 focus:border-[#D9B4B4] focus:bg-white px-4 py-3.5 rounded-2xl text-[10px] focus:outline-none text-stone-700 font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer appearance-none outline-none pr-10 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239C9292%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
          >
            <option value="ALL">All Categories</option>
            <option value="TOYS">Toys / Amigurumi</option>
            <option value="HOME">Home Decor</option>
            <option value="BAGS">Bags & Purses</option>
            <option value="GARMENTS">Garments</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
          <select 
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="w-1/2 md:w-auto bg-stone-50 border-2 border-stone-100 hover:border-stone-200 focus:border-[#D9B4B4] focus:bg-white px-4 py-3.5 rounded-2xl text-[10px] focus:outline-none text-stone-700 font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer appearance-none outline-none pr-10 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239C9292%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
          >
            <option value="ALL">All Stock Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Main Catalog View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-stone-200 rounded-2xl">
          <div className="w-8 h-8 border-3 border-[#6B5656] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-stone-450 uppercase tracking-wider mt-3">Loading Catalog...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800 space-y-3">
          <p className="text-sm font-semibold">{error}</p>
          <button 
            onClick={fetchProducts} 
            className="bg-white border border-red-300 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-[2rem] p-16 text-center text-stone-500 flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4 text-[#D9B4B4] shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-stone-700 uppercase tracking-widest mb-2">No Products Found</h3>
          <p className="text-xs text-stone-450 max-w-sm">Try adjusting your filters or add a new product to your catalog.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[9px] font-black text-stone-400 uppercase tracking-widest bg-stone-50/50">
                  <th className="py-5 px-8">Product Details</th>
                  <th className="py-5 px-6 w-32">Price</th>
                  <th className="py-5 px-6 w-40">Stock Status</th>
                  <th className="py-5 px-6 max-w-xs">Description</th>
                  <th className="py-5 px-8 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/80 text-xs">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1rem] overflow-hidden bg-stone-100 border border-stone-200/50 relative shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                          <img 
                            src={product.image_url} 
                            alt={product.title} 
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-serif font-bold text-[#4A3E3E] text-base leading-snug group-hover:text-[#6B5656] transition-colors">{product.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[9px]">
                            <span className="bg-[#FEF9F6] text-[#6B5656] border border-[#D9B4B4]/40 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                              {product.category}
                            </span>
                            {product.size && (
                              <span className="bg-stone-50 text-stone-500 border border-stone-200/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                {product.size}
                              </span>
                            )}
                            <span className="bg-stone-50 text-stone-500 border border-stone-200/50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 uppercase tracking-wider">
                              <Truck className="w-3 h-3" /> {product.delivery_time || '5-7 days'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-stone-900 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#4A3E3E] text-base">₹{(product.sellingPrice ?? product.price).toFixed(2)}</span>
                        {(() => {
                          const originalPrice = product.originalPrice ?? null;
                          const sellingPrice = product.sellingPrice ?? product.price ?? null;
                          const hasDiscount = originalPrice !== null && originalPrice > sellingPrice;
                          const discountPercent = hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;
                          
                          if (hasDiscount && discountPercent > 0) {
                            return (
                              <div className="flex flex-col mt-1 gap-1">
                                <span className="text-[10px] text-stone-400 line-through font-medium">₹{originalPrice.toFixed(2)}</span>
                                <span className="text-[9px] font-black text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-md self-start tracking-wider">
                                  {discountPercent}% OFF
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {product.in_stock !== false ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200/50 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6 text-stone-500 max-w-xs text-xs font-medium leading-relaxed truncate">{product.description}</td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          title="Edit Product"
                          className="p-2.5 bg-stone-50 hover:bg-[#D9B4B4]/20 border border-stone-200 hover:border-[#D9B4B4] text-stone-500 hover:text-[#6B5656] rounded-xl transition-all duration-300 inline-flex items-center shadow-sm hover:shadow"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(product)}
                          title="Delete Product"
                          className="p-2.5 bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-500 hover:text-rose-600 rounded-xl transition-all duration-300 inline-flex items-center shadow-sm hover:shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-[#FEF9F6]">
              <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wide">
                {editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl font-semibold">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Basic info & Images */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black tracking-widest text-[#6B5656] uppercase border-b border-stone-100 pb-1.5">Basic Information</h4>
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-450" /> Product Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Handmade Woolen Teddy Bear"
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-200"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-stone-450" /> Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-3 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                    >
                      <option value="TOYS">Toys / Amigurumi</option>
                      <option value="HOME">Home Decor</option>
                      <option value="BAGS">Bags & Purses</option>
                      <option value="GARMENTS">Garments</option>
                      <option value="ACCESSORIES">Accessories</option>
                    </select>
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-stone-450" /> Original Price (MRP)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="originalPrice"
                        required
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="e.g. 1599.00"
                        className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 font-bold transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-stone-450" /> Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                        placeholder="e.g. 1299.00"
                        className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 font-bold transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Availability / In Stock */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stone-450" /> Availability Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, in_stock: 'true' }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 uppercase tracking-wider text-center ${
                          formData.in_stock === 'true'
                            ? 'bg-[#FEF9F6] border-[#D9B4B4] text-[#6B5656] shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'
                        }`}
                      >
                        In Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, in_stock: 'false' }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 uppercase tracking-wider text-center ${
                          formData.in_stock === 'false'
                            ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'
                        }`}
                      >
                        Out of Stock
                      </button>
                    </div>
                  </div>

                  {/* Enable Size Selection (GARMENTS only) */}
                  {formData.category.toUpperCase() === 'GARMENTS' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-stone-450" /> Size Selection Options
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, has_sizes: 'true' }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 uppercase tracking-wider text-center ${
                            formData.has_sizes === 'true'
                              ? 'bg-[#FEF9F6] border-[#D9B4B4] text-[#6B5656] shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          Enable sizes (S, M, L)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, has_sizes: 'false' }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-300 uppercase tracking-wider text-center ${
                            formData.has_sizes === 'false'
                              ? 'bg-[#FEF9F6] border-[#D9B4B4] text-[#6B5656] shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          Disable sizes
                        </button>
                      </div>
                      <p className="text-[9px] text-stone-400 mt-0.5">
                        Choose whether size selection is active on the details page for this garment.
                      </p>
                    </div>
                  )}

                  {/* Estimated Crafting & Delivery */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-stone-450" /> Estimated Crafting & Delivery
                    </label>
                    <input
                      type="text"
                      name="delivery_time"
                      value={formData.delivery_time}
                      onChange={handleInputChange}
                      placeholder="e.g. 5-7 working days"
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 font-bold transition-all duration-200"
                    />
                  </div>

                  {/* Image Upload Area */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-stone-450" /> Product Images
                    </label>
                    
                    {editingProduct && (
                      <div className="space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Current Images:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(editingProduct.image_urls && editingProduct.image_urls.length > 0
                            ? editingProduct.image_urls
                            : [editingProduct.image_url]
                          ).filter(url => url && !deletedImages.includes(url)).map((url, idx) => (
                            <div key={idx} className="w-12 h-12 rounded-lg border border-stone-200 overflow-hidden relative shadow-inner group/current">
                              <img src={url} alt={`Current ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setDeletedImages(prev => [...prev, url])}
                                className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-650 text-white rounded-full p-1 transition-all shadow opacity-0 group-hover/current:opacity-100"
                                title="Remove image"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                          
                          {/* If all images are deleted */}
                          {(editingProduct.image_urls && editingProduct.image_urls.length > 0
                            ? editingProduct.image_urls
                            : [editingProduct.image_url]
                          ).filter(url => url && !deletedImages.includes(url)).length === 0 && (
                            <div className="text-[10px] text-red-500 font-semibold py-1">
                              All current images marked for deletion. Please select a new image below.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border border-dashed border-stone-300 hover:border-[#D9B4B4] rounded-2xl p-4 bg-stone-50/50 hover:bg-[#FEF9F6]/10 transition-colors space-y-3">
                      <div className="flex flex-wrap gap-2 min-h-[60px] items-center">
                        {previewUrls.length > 0 ? (
                          previewUrls.map((url, index) => (
                            <div key={index} className="w-16 h-16 rounded-xl border border-stone-200 bg-white overflow-hidden relative group/preview shadow-sm">
                              <img src={url} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                  setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-650 text-white rounded-full p-1 transition-all shadow"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="w-full py-2 text-center text-stone-400 text-[10px] flex flex-col items-center justify-center gap-1.5">
                            <Upload className="w-5 h-5 text-stone-300" />
                            <span>No new images selected</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[9px] text-stone-400">Supports PNG, JPG, JPEG up to 5MB. Multiple files allowed.</span>
                        <label className="mt-2.5 inline-flex bg-white hover:bg-[#FEF9F6] border border-stone-250 hover:border-[#D9B4B4] text-[#6B5656] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95">
                          Choose Files
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleFileChange} 
                            className="hidden" 
                            required={!editingProduct}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Specifications & Description */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black tracking-widest text-[#6B5656] uppercase border-b border-stone-100 pb-1.5">Specifications & Details</h4>
                  
                  {/* Size */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-stone-450" /> Dimensions / Size
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="e.g. 15 cm height, 10 cm width"
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-200"
                    />
                  </div>

                  {/* Materials */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-stone-450" /> Materials Used
                    </label>
                    <input
                      type="text"
                      name="materials"
                      value={formData.materials}
                      onChange={handleInputChange}
                      placeholder="e.g. 100% Organic Cotton, Safety Eyes"
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-200"
                    />
                  </div>

                  {/* Care Instructions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-stone-450" /> Care Instructions
                    </label>
                    <input
                      type="text"
                      name="care_instructions"
                      value={formData.care_instructions}
                      onChange={handleInputChange}
                      placeholder="e.g. Handwash gently in cold water, dry flat"
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-200"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-450" /> Product Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell customers about the stitch quality, sizing, and design details..."
                      className="w-full bg-stone-50 border border-stone-250 hover:border-stone-400 focus:border-[#D9B4B4] focus:bg-white px-4 py-2.5 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 leading-relaxed transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-white hover:bg-stone-50 border border-stone-250 text-stone-650 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all duration-350 active:scale-95 shadow-md flex items-center justify-center gap-1.5 min-w-[120px]"
                >
                  {submitLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Uploading...
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-bold text-stone-850 uppercase tracking-wide">Delete Product</h3>
                <p className="text-xs text-stone-450 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-stone-800">"{productToDelete.title}"</span>? This action is permanent.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4.5 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="bg-white hover:bg-stone-50 border border-stone-250 text-stone-650 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleteLoading}
                className="bg-red-650 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
