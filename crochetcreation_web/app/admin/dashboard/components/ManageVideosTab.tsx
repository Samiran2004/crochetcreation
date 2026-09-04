'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Youtube, 
  Film, 
  Clapperboard, 
  Loader2, 
  ExternalLink,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Video {
  _id: string;
  youtube_url: string;
  title: string;
  video_type: 'long' | 'shorts';
  video_id: string;
  thumbnail_url: string;
  created_at: string;
}

interface ManageVideosTabProps {
  apiUrl: string;
  token: string | null;
}

export default function ManageVideosTab({ apiUrl, token }: ManageVideosTabProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'long' | 'shorts'>('long');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch videos
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/videos/`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      } else {
        setError('Failed to load videos');
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, [apiUrl]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Filter
  const filteredVideos = useMemo(() => {
    if (!search.trim()) return videos;
    return videos.filter(v => 
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.video_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [videos, search]);

  // Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/videos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youtube_url: newUrl,
          title: newTitle,
          video_type: newType
        })
      });
      if (res.ok) {
        setSuccess('Video added successfully!');
        setNewUrl('');
        setNewTitle('');
        setNewType('long');
        setShowAddForm(false);
        fetchVideos();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Failed to add video');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Video
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Video deleted successfully!');
        setVideos(prev => prev.filter(v => v._id !== id));
      } else {
        setError('Failed to delete video');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-base font-black tracking-tight text-slate-900 uppercase">Video Management</h3>
          <p className="text-[10px] text-gray-450 mt-0.5 font-medium">Add and manage YouTube videos for your website gallery.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            showAddForm 
              ? 'bg-slate-900 text-white' 
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
          }`}
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Close Form' : 'Add New Video'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Add Video Form */}
      {showAddForm && (
        <form onSubmit={handleAddVideo} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase">YouTube URL *</label>
              <div className="relative">
                <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Video Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g. Easy Crochet Flower Tutorial"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Video Type *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewType('long')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    newType === 'long' 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Film className="w-4 h-4" /> Long Video
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('shorts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    newType === 'shorts' 
                      ? 'bg-violet-600 text-white border-violet-600' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clapperboard className="w-4 h-4" /> Shorts
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isSubmitting ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 outline-none transition-all"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{videos.length}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Total Videos</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{videos.filter(v => v.video_type === 'long').length}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Long Videos</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">{videos.filter(v => v.video_type === 'shorts').length}</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase">Shorts</p>
          </div>
        </div>
      </div>

      {/* Videos Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm font-medium">
          {videos.length === 0 ? 'No videos added yet. Click "Add New Video" to get started.' : 'No videos match your search.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Thumbnail</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Title</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date Added</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map(video => (
                  <tr key={video._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 relative group">
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-2.5 h-2.5 text-white fill-white ml-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-xs">{video.title}</p>
                      <a 
                        href={video.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Open on YouTube
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ring-1 ${
                        video.video_type === 'shorts' 
                          ? 'bg-violet-50 text-violet-600 ring-violet-200' 
                          : 'bg-blue-50 text-blue-600 ring-blue-200'
                      }`}>
                        {video.video_type === 'shorts' ? (
                          <><Clapperboard className="w-2.5 h-2.5" /> Shorts</>
                        ) : (
                          <><Film className="w-2.5 h-2.5" /> Long Video</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                      {formatDate(video.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(video._id)}
                        disabled={deletingId === video._id}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === video._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
