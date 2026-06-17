'use client';

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
  Package
} from 'lucide-react';

interface Product {
  _id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  image_urls?: string[];
  size?: string;
  materials?: string;
  care_instructions?: string;
  in_stock?: boolean;
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
    category: 'TOYS',
    size: '',
    materials: '',
    care_instructions: '',
    in_stock: 'true',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error("Could not fetch product catalog.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
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
      category: 'TOYS',
      size: '',
      materials: '',
      care_instructions: '',
      in_stock: 'true',
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      size: product.size || '',
      materials: product.materials || '',
      care_instructions: product.care_instructions || '',
      in_stock: product.in_stock !== false ? 'true' : 'false',
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
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
      submissionData.append('price', formData.price);
      submissionData.append('category', formData.category.toUpperCase());
      submissionData.append('size', formData.size);
      submissionData.append('materials', formData.materials);
      submissionData.append('care_instructions', formData.care_instructions);
      submissionData.append('in_stock', formData.in_stock);
      
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          submissionData.append('images', file);
        });
      }

      let url = `${API_URL}/api/products/`;
      let method = 'POST';

      if (editingProduct && editingProduct._id) {
        url = `${API_URL}/api/products/${editingProduct._id}`;
        method = 'PUT';
      } else {
        // For creations, image file is required
        if (selectedFiles.length === 0) {
          throw new Error("Please upload at least one product image.");
        }
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });

      if (!res.ok) {
        const errData = await res.json();
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
      const res = await fetch(`${API_URL}/api/products/${productToDelete._id}`, {
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
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-850">Catalog Management</h2>
          <p className="text-xs text-stone-450 mt-1">
            Create, update, and manage your inventory of custom crochet creations.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-355 shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Catalog Metrics Summary Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-[#6B5656]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Total Products</span>
            <span className="text-stone-850 font-bold text-xl block mt-1">{totalCount}</span>
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Active / In Stock</span>
            <span className="text-emerald-700 font-bold text-xl block mt-1">{inStockCount}</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Out of Stock</span>
            <span className="text-rose-700 font-bold text-xl block mt-1">{outOfStockCount}</span>
          </div>
        </div>

        {/* Average Price */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block leading-none">Average Price</span>
            <span className="text-amber-800 font-bold text-lg block mt-1">₹{averagePrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Toolbar - Search & Filtering */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Search catalog by title, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 hover:border-stone-300 focus:border-[#D9B4B4] focus:bg-white pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none text-stone-850 placeholder-stone-400 transition-all duration-200"
          />
        </div>
        <div className="flex w-full md:w-auto gap-3 items-center">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-1/2 md:w-auto bg-stone-50 border border-stone-200 hover:border-stone-300 focus:border-[#D9B4B4] focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none text-stone-850 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs"
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
            className="w-1/2 md:w-auto bg-stone-50 border border-stone-200 hover:border-stone-300 focus:border-[#D9B4B4] focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none text-stone-850 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs"
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
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 space-y-4">
          <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-250 flex items-center justify-center mx-auto text-stone-400">
            <Plus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">No Products Found</h3>
            <p className="text-xs text-stone-450">Try adjusting your filters or create a new product.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50/50">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6 w-32">Price</th>
                  <th className="py-4 px-6 w-36">Stock Status</th>
                  <th className="py-4 px-6 max-w-xs">Description</th>
                  <th className="py-4 px-6 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60 relative shrink-0 shadow-xs">
                          <img 
                            src={product.image_url} 
                            alt={product.title} 
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-stone-850 text-sm leading-snug">{product.title}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                            <span className="bg-[#FEF9F6] text-[#6B5656] border border-[#D9B4B4]/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {product.category}
                            </span>
                            {product.size && (
                              <span className="bg-stone-100 text-stone-500 border border-stone-200/50 px-2 py-0.5 rounded-full font-semibold uppercase">
                                {product.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-stone-900 text-sm">₹{product.price.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      {product.in_stock !== false ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-250/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-stone-450 max-w-xs truncate">{product.description}</td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        title="Edit Product"
                        className="p-2 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-xl transition-colors inline-flex items-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(product)}
                        title="Delete Product"
                        className="p-2 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-xl transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

                  {/* Category & Price */}
                  <div className="grid grid-cols-2 gap-3">
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-stone-450" /> Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        required
                        value={formData.price}
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
                          ).map((url, idx) => (
                            <div key={idx} className="w-10 h-10 rounded-lg border border-stone-200 overflow-hidden relative shadow-inner">
                              <img src={url} alt={`Current ${idx}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
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
