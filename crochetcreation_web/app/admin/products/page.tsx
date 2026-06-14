'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Folder, 
  DollarSign, 
  FileText,
  AlertTriangle
} from 'lucide-react';

interface Product {
  _id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'TOYS',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete modal confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crochetcreation.onrender.com';

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
    });
    setSelectedFile(null);
    setPreviewUrl(null);
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
    });
    setSelectedFile(null);
    setPreviewUrl(product.image_url);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
      
      if (selectedFile) {
        submissionData.append('image', selectedFile);
      }

      let url = `${API_URL}/api/products/`;
      let method = 'POST';

      if (editingProduct && editingProduct._id) {
        url = `${API_URL}/api/products/${editingProduct._id}`;
        method = 'PUT';
      } else {
        // For creations, image file is required
        if (!selectedFile) {
          throw new Error("Please upload a product image.");
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
          className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-350 shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
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
      ) : products.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 space-y-4">
          <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-250 flex items-center justify-center mx-auto text-stone-400">
            <Plus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">No Products Found</h3>
            <p className="text-xs text-stone-450">Get started by creating your first product item.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-[#6B5656] hover:bg-[#D9B4B4] hover:text-[#6B5656] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl inline-flex items-center gap-1.5 transition-all duration-300"
          >
            <Plus className="w-3.5 h-3.5" /> Create Product
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-5 w-24">Image</th>
                  <th className="py-3 px-5">Title</th>
                  <th className="py-3 px-5">Price</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative shadow-inner">
                        <img 
                          src={product.image_url} 
                          alt={product.title} 
                          className="w-full h-full object-cover object-center" 
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-stone-800">{product.title}</td>
                    <td className="py-3.5 px-5 font-bold text-stone-850">₹{product.price.toFixed(2)}</td>
                    <td className="py-3.5 px-5">
                      <span className="bg-[#FEF9F6] text-[#6B5656] border border-[#D9B4B4]/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-stone-450 max-w-xs truncate">{product.description}</td>
                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        title="Edit Product"
                        className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(product)}
                        title="Delete Product"
                        className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in-50 zoom-in-95 duration-200">
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
            <form onSubmit={handleFormSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl font-semibold">
                  {submitError}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-stone-450" /> Product Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Handmade Woolen Teddy Bear"
                  className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 placeholder-stone-400"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3 h-3 text-stone-450" /> Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 font-bold uppercase tracking-wider"
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
                    <DollarSign className="w-3 h-3 text-stone-450" /> Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 1299.00"
                    className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 placeholder-stone-400 font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-stone-450" /> Detailed Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell customers about the stitch quality, sizing, and organic materials..."
                  className="w-full bg-stone-50 border border-stone-250 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#D9B4B4] text-stone-850 placeholder-stone-400 leading-relaxed"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3 h-3 text-stone-450" /> Product Image
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50">
                  <div className="w-24 h-24 rounded-xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center shrink-0 relative shadow-inner">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-stone-300" />
                    )}
                  </div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Select Image File</p>
                    <p className="text-[9px] text-stone-400 mt-0.5">Supports PNG, JPG, JPEG up to 5MB</p>
                    <label className="mt-3 inline-flex bg-white hover:bg-stone-50 border border-stone-250 hover:border-[#D9B4B4] text-stone-650 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95">
                      Choose File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        required={!editingProduct}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
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
