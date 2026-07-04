'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Wand2, 
  IndianRupee, 
  Folder, 
  FileText, 
  Ruler, 
  Package, 
  Loader2, 
  Image as ImageIcon 
} from 'lucide-react';

interface ProductCreatePayload {
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
  stock_quantity?: number;
  stock_count?: number;
  delivery_time?: string;
  has_sizes?: boolean;
  width?: number;
  height?: number;
  sku?: string;
}

interface AddProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductDrawer({ isOpen, onClose, onSuccess }: AddProductDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TOYS');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('15');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [sku, setSku] = useState('');
  
  // Image Upload State
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // API Config
  const API_URL = (() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8000';
    }
    return 'https://crochetcreation.onrender.com';
  })();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Sync drawer open animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setDrawerOpen(true), 50);
      return () => clearTimeout(timer);
    } else {
      setDrawerOpen(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setDrawerOpen(false);
    setTimeout(onClose, 300);
  };

  // Generate Unique SKU
  const handleGenerateSKU = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSku(`SKU-CR-${result}`);
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validImageFiles = files.filter(file => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) return;

    // Set first image as main if not already set
    if (!mainImageFile) {
      const main = validImageFiles[0];
      setMainImageFile(main);
      setMainImagePreview(URL.createObjectURL(main));
      
      // The rest go to gallery
      if (validImageFiles.length > 1) {
        const rest = validImageFiles.slice(1);
        setGalleryFiles(prev => [...prev, ...rest]);
        setGalleryPreviews(prev => [...prev, ...rest.map(f => URL.createObjectURL(f))]);
      }
    } else {
      // Add all to gallery
      setGalleryFiles(prev => [...prev, ...validImageFiles]);
      setGalleryPreviews(prev => [...prev, ...validImageFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeMainImage = () => {
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(null);
    setMainImagePreview('');

    // Promote first gallery image to main if exists
    if (galleryFiles.length > 0) {
      const nextMain = galleryFiles[0];
      setMainImageFile(nextMain);
      setMainImagePreview(galleryPreviews[0]);
      
      setGalleryFiles(prev => prev.slice(1));
      setGalleryPreviews(prev => prev.slice(1));
    }
  };

  const removeGalleryImage = (index: number) => {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload to Cloudinary using Unsigned Preset
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Cloudinary's default unsigned preset

    const res = await fetch(`https://api.cloudinary.com/v1_1/dkd4extjx/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed for ${file.name}`);
    }

    const data = await res.json();
    return data.secure_url;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mainImageFile) {
      setError("Main image is required.");
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      // 1. Upload Images to Cloudinary
      let mainImageUrl = '';
      const galleryUrls: string[] = [];

      try {
        mainImageUrl = await uploadToCloudinary(mainImageFile);
        
        for (const file of galleryFiles) {
          const url = await uploadToCloudinary(file);
          galleryUrls.push(url);
        }
      } catch (uploadErr: any) {
        console.error("Cloudinary upload failed:", uploadErr);
        throw new Error("Failed to upload images to Cloudinary. Please try again.");
      } finally {
        setIsUploadingImages(false);
      }

      // 2. Prepare payload
      const priceVal = parseFloat(sellingPrice || originalPrice || '0');
      const origPriceVal = originalPrice ? parseFloat(originalPrice) : undefined;
      const sellPriceVal = sellingPrice ? parseFloat(sellingPrice) : undefined;
      const stockVal = parseInt(stockQuantity) || 0;
      const widthVal = width ? parseInt(width) : undefined;
      const heightVal = height ? parseInt(height) : undefined;

      const payload: ProductCreatePayload = {
        title,
        description,
        price: priceVal,
        originalPrice: origPriceVal,
        sellingPrice: sellPriceVal,
        category,
        image_url: mainImageUrl,
        image_urls: [mainImageUrl, ...galleryUrls],
        stock_quantity: stockVal,
        stock_count: stockVal,
        in_stock: stockVal > 0,
        width: widthVal,
        height: heightVal,
        sku: sku || undefined
      };

      // 3. Send Request to FastAPI
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create catalog product.");
      }

      // Success cleanup & refresh
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      ></div>

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div 
          className={`w-screen max-w-lg bg-white shadow-2xl flex flex-col divide-y divide-gray-150 transform transition-transform duration-300 ease-in-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Add New Product</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                Create a new handcrafted catalog item
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 text-left pb-24">
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {/* Cloudinary Drag & Drop Zone */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-450" /> Product Images (Cloudinary)
              </label>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-dashed border-2 rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  dragActive 
                    ? 'border-slate-900 bg-slate-50' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <Upload className="w-8 h-8 text-slate-450 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-700">
                  Drag & drop files here, or{' '}
                  <label htmlFor="image-upload" className="text-slate-900 underline hover:text-black cursor-pointer font-extrabold">
                    browse files
                  </label>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG. First image will be marked as main.
                </p>
              </div>

              {/* Upload Previews */}
              {(mainImagePreview || galleryPreviews.length > 0) && (
                <div className="space-y-3 pt-2">
                  {mainImagePreview && (
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Main Cover Image</p>
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                        <img src={mainImagePreview} alt="Main Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeMainImage}
                          className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-650 text-white rounded-full p-1 transition-colors shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {galleryPreviews.length > 0 && (
                    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Gallery Images ({galleryPreviews.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {galleryPreviews.map((preview, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-250 shadow-sm bg-white">
                            <img src={preview} alt={`Gallery Preview ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-0.5 right-0.5 bg-slate-900/85 hover:bg-rose-650 text-white rounded-full p-0.5 transition-colors shadow"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Basic Info: Product Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-450" /> Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baby Bunny Amigurumi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-800 placeholder-slate-400 font-semibold transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-slate-450" /> Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3 py-2.5 rounded-xl text-xs focus:outline-none text-slate-800 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  <option value="TOYS">Toys / Amigurumi</option>
                  <option value="HOME">Home Decor</option>
                  <option value="BAGS">Bags & Purses</option>
                  <option value="GARMENTS">Garments</option>
                  <option value="ACCESSORIES">Accessories</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-450" /> Description
              </label>
              <textarea
                rows={4}
                placeholder="Write a captivating description of this crochet creation, including material quality, time spent crafting, etc..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-800 placeholder-slate-400 font-semibold transition-all duration-200 resize-none"
              />
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-450" /> Selling Price * (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Selling Price"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-850 placeholder-slate-400 font-bold transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-450" /> Original Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="MRP / Original Price"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-850 placeholder-slate-400 font-bold transition-all duration-200"
                />
              </div>
            </div>

            {/* Inventory & Size dimensions */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-450" /> Initial Stock
                </label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-850 font-bold transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-450" /> Width (px)
                </label>
                <input
                  type="number"
                  placeholder="Width px"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-850 font-bold transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-slate-450" /> Height (px)
                </label>
                <input
                  type="number"
                  placeholder="Height px"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-850 font-bold transition-all duration-200"
                />
              </div>
            </div>

            {/* Auto SKU Generation */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-450" /> SKU Code (Auto-generates if empty)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="SKU-CR-XXXXXX"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-900 focus:bg-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none text-slate-800 placeholder-slate-400 font-mono font-bold transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider px-4 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200/60 active:scale-95 shrink-0"
                >
                  <Wand2 className="w-4 h-4" /> Auto-Generate
                </button>
              </div>
            </div>

          </form>

          {/* Sticky Drawer Footer Actions */}
          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-150 px-6 py-4.5 flex items-center justify-end gap-3 z-10 shadow-lg">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-5 py-2.5 border border-slate-250 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploadingImages ? 'Uploading Images...' : 'Saving Product...'}
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
