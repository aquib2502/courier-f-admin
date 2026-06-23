"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  BarChart2,
  Filter,
  Calendar,
  Tag,
  ImageIcon,
  Save,
  ArrowUpRight,
  AlertTriangle,
  Upload,
  Images,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Helpers ──────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_STYLES = {
  Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Draft: "bg-amber-50 text-amber-600 border-amber-200",
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  gallery: [],
  author: "Admin",
  category: "General",
  tags: "",
  status: "Draft",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

// ── Sub-components ────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const InputField = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

// ── Image Upload Zone ─────────────────────────────────────
const ImageUploadZone = ({ label, hint, multiple = false, onUploaded, existingUrls = [] }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState(existingUrls);

  // Sync if parent resets form
  useEffect(() => {
    setPreviews(existingUrls);
  }, [existingUrls.join(",")]);

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (multiple) {
        Array.from(files).forEach((f) => formData.append("gallery", f));
      } else {
        formData.append("featuredImage", files[0]);
      }

      const res = await axios.post(`${API_BASE}/api/blogs/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data?.data;
      if (multiple) {
        const newUrls = [...previews, ...(data.gallery || [])];
        setPreviews(newUrls);
        onUploaded(newUrls);
      } else {
        const url = data.featuredImage || "";
        setPreviews(url ? [url] : []);
        onUploaded(url);
      }
      toast.success("Image(s) uploaded successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [previews, multiple, onUploaded]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    const updated = previews.filter((_, i) => i !== idx);
    setPreviews(updated);
    if (multiple) {
      onUploaded(updated);
    } else {
      onUploaded("");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"}
          ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-500">
            <Loader2 size={22} className="animate-spin" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              {multiple ? <Images size={18} /> : <ImageIcon size={18} />}
            </div>
            <p className="text-sm font-medium text-slate-600">
              {multiple ? "Drop images here or click to browse" : "Drop an image or click to browse"}
            </p>
            <p className="text-xs">
              {multiple ? "JPG, PNG, WebP · max 5 MB each · up to 10 images" : "JPG, PNG, WebP · max 5 MB"}
            </p>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className={`grid gap-3 ${multiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}>
          {previews.map((url, idx) => (
            <div key={url + idx} className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-video">
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={12} />
              </button>
              {!multiple && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="text-white text-[10px] truncate">{url.split("/").pop()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Delete Confirmation Modal ─────────────────────────────
const DeleteModal = ({ blog, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete article?</h3>
      <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
        <span className="font-semibold text-slate-700">&ldquo;{blog.title}&rdquo;</span> will be
        permanently removed. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Keep it
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  </div>
);

// ── Blog Form (Create / Edit) ─────────────────────────────
const BlogForm = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initial || {}),
    tags: Array.isArray(initial?.tags) ? initial.tags.join(", ") : (initial?.tags || ""),
    seoKeywords: Array.isArray(initial?.seoKeywords) ? initial.seoKeywords.join(", ") : (initial?.seoKeywords || ""),
    gallery: initial?.gallery || [],
  }));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("content");
  const isEdit = !!initial?._id;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.warning("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === "string"
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : form.tags,
        seoKeywords: typeof form.seoKeywords === "string"
          ? form.seoKeywords.split(",").map((t) => t.trim()).filter(Boolean)
          : form.seoKeywords,
        gallery: form.gallery || [],
      };

      if (isEdit) {
        await axios.put(`${API_BASE}/api/blogs/${initial._id}`, payload);
        toast.success("Article updated.");
      } else {
        await axios.post(`${API_BASE}/api/blogs/`, payload);
        toast.success("Article created.");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const tagsValue = Array.isArray(form.tags) ? form.tags.join(", ") : form.tags;
  const keywordsValue = Array.isArray(form.seoKeywords) ? form.seoKeywords.join(", ") : form.seoKeywords;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit article" : "New article"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? `Editing: ${initial.title}` : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-7">
          {[
            { key: "content", label: "Content" },
            { key: "media", label: "Media" },
            { key: "seo", label: "SEO & Meta" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {/* ── CONTENT TAB ── */}
          {tab === "content" && (
            <>
              <InputField label="Title" required>
                <input
                  type="text"
                  placeholder="Article headline…"
                  value={form.title}
                  onChange={set("title")}
                  className={inputCls}
                />
              </InputField>

              <InputField label="Excerpt" hint="Short summary shown in listings (max 500 chars)">
                <textarea
                  rows={2}
                  placeholder="Brief description of the article…"
                  value={form.excerpt}
                  onChange={set("excerpt")}
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
              </InputField>

              <InputField label="Content (HTML supported)" required>
                <textarea
                  rows={12}
                  placeholder="Write your article content here. HTML tags are supported."
                  value={form.content}
                  onChange={set("content")}
                  className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                />
              </InputField>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Author">
                  <input
                    type="text"
                    value={form.author}
                    onChange={set("author")}
                    className={inputCls}
                  />
                </InputField>
                <InputField label="Category">
                  <input
                    type="text"
                    placeholder="e.g. Logistics"
                    value={form.category}
                    onChange={set("category")}
                    className={inputCls}
                  />
                </InputField>
              </div>

              <InputField label="Tags" hint="Comma-separated — e.g. shipping, logistics, tracking">
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={tagsValue}
                    onChange={set("tags")}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </InputField>

              <InputField label="Status">
                <select
                  value={form.status}
                  onChange={set("status")}
                  className={inputCls}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </InputField>
            </>
          )}

          {/* ── MEDIA TAB ── */}
          {tab === "media" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                  <Upload size={12} />
                  Images are uploaded to your own server and served as static files — great for SEO.
                </p>
              </div>

              <ImageUploadZone
                label="Featured Image"
                hint="This is the cover image shown in listings and at the top of the article."
                multiple={false}
                existingUrls={form.featuredImage ? [form.featuredImage] : []}
                onUploaded={(url) => setForm((f) => ({ ...f, featuredImage: url }))}
              />

              <div className="border-t border-slate-100 pt-5">
                <ImageUploadZone
                  label="Gallery Images"
                  hint="Additional images displayed in a grid inside the article. Up to 10 images."
                  multiple={true}
                  existingUrls={form.gallery || []}
                  onUploaded={(urls) => setForm((f) => ({ ...f, gallery: urls }))}
                />
              </div>
            </>
          )}

          {/* ── SEO TAB ── */}
          {tab === "seo" && (
            <>
              <InputField label="SEO Title" hint="Defaults to article title if blank">
                <input
                  type="text"
                  placeholder="Optimised page title…"
                  value={form.seoTitle}
                  onChange={set("seoTitle")}
                  className={inputCls}
                />
              </InputField>

              <InputField label="SEO Description" hint="Shown in search engine results">
                <textarea
                  rows={3}
                  placeholder="Meta description for search engines…"
                  value={form.seoDescription}
                  onChange={set("seoDescription")}
                  className={`${inputCls} resize-none`}
                />
              </InputField>

              <InputField label="SEO Keywords" hint="Comma-separated keywords">
                <input
                  type="text"
                  placeholder="keyword1, keyword2"
                  value={keywordsValue}
                  onChange={set("seoKeywords")}
                  className={inputCls}
                />
              </InputField>

              {(form.seoTitle || form.title) && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Search preview
                  </p>
                  <p className="text-blue-700 text-sm font-medium truncate">
                    {form.seoTitle || form.title}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">
                    thetraceexpress.com/blogs/{(form.title || "").toLowerCase().replace(/\s+/g, "-")}
                  </p>
                  {form.seoDescription && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{form.seoDescription}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {form.status === "Published" ? "Will be live immediately." : "Saved as draft."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {saving ? "Saving…" : isEdit ? "Save changes" : "Publish article"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Admin Component ───────────────────────────────────
const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formBlog, setFormBlog] = useState(null);
  const [viewBlog, setViewBlog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const LIMIT = 10;

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, views: 0 });

  const fetchBlogs = async (p = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (status) params.set("status", status);
      const res = await axios.get(`${API_BASE}/api/blogs/admin?${params}`);
      const d = res.data;
      setBlogs(d.data || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
      setPage(p);
    } catch {
      toast.error("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [allRes, pubRes] = await Promise.all([
        axios.get(`${API_BASE}/api/blogs/admin?limit=1000`),
        axios.get(`${API_BASE}/api/blogs/admin?limit=1000&status=Published`),
      ]);
      const all = allRes.data?.data || [];
      const pub = pubRes.data?.data || [];
      setStats({
        total: allRes.data?.total || 0,
        published: pubRes.data?.total || 0,
        draft: (allRes.data?.total || 0) - (pubRes.data?.total || 0),
        views: all.reduce((s, b) => s + (b.views || 0), 0),
      });
    } catch {}
  };

  useEffect(() => {
    fetchBlogs();
    fetchStats();
  }, []);

  const handleSaved = () => {
    setFormBlog(null);
    fetchBlogs(1);
    fetchStats();
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/blogs/admin/${id}`);
      setFormBlog(res.data?.data);
    } catch {
      toast.error("Failed to load article.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/blogs/${deleteTarget._id}`);
      toast.success("Article deleted.");
      setDeleteTarget(null);
      fetchBlogs(page);
      fetchStats();
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const displayed = search
    ? blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.category?.toLowerCase().includes(search.toLowerCase())
      )
    : blogs;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your editorial content</p>
        </div>
        <button
          onClick={() => setFormBlog({})}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Articles" value={stats.total} color="bg-blue-500" />
        <StatCard icon={Globe} label="Published" value={stats.published} color="bg-emerald-500" />
        <StatCard icon={Filter} label="Drafts" value={stats.draft} color="bg-amber-500" />
        <StatCard icon={BarChart2} label="Total Views" value={stats.views.toLocaleString("en-IN")} color="bg-violet-500" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchBlogs(1, e.target.value);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 size={28} className="animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading articles…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center">
            <FileText size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Article</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Views</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayed.map((b) => (
                    <tr key={b._id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {b.featuredImage ? (
                            <img src={b.featuredImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <FileText size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1">{b.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              By {b.author}
                              {b.gallery?.length > 0 && (
                                <span className="flex items-center gap-0.5 text-blue-400">
                                  <Images size={10} /> {b.gallery.length}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{b.category || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-500"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{(b.views || 0).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(b.publishedAt || b.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.status === "Published" && (
                            <a href={`/blogs/${b.slug}`} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="View live">
                              <ArrowUpRight size={14} />
                            </a>
                          )}
                          <button onClick={() => setViewBlog(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors" title="Quick view">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleEdit(b._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayed.map((b) => (
                <div key={b._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {b.featuredImage ? (
                      <img src={b.featuredImage} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{b.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                        <span className="text-xs text-slate-400">{b.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => handleEdit(b._id)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Edit</button>
                    <button onClick={() => setDeleteTarget(b)} className="flex-1 py-2 text-xs font-semibold rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">Page {page} of {pages} — {total} articles</p>
            <div className="flex gap-2">
              <button onClick={() => fetchBlogs(page - 1)} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => fetchBlogs(page + 1)} disabled={page === pages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {viewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewBlog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto">
            {viewBlog.featuredImage && (
              <img src={viewBlog.featuredImage} alt={viewBlog.title} className="w-full h-48 object-cover rounded-t-2xl" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border mb-2 ${STATUS_STYLES[viewBlog.status]}`}>{viewBlog.status}</span>
                  <h3 className="text-xl font-bold text-slate-800">{viewBlog.title}</h3>
                </div>
                <button onClick={() => setViewBlog(null)} className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"><X size={16} /></button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(viewBlog.publishedAt || viewBlog.createdAt)}</span>
                <span>By {viewBlog.author}</span>
                <span>{viewBlog.category}</span>
                <span>{viewBlog.views || 0} views</span>
                {viewBlog.gallery?.length > 0 && <span className="flex items-center gap-1 text-blue-500"><Images size={12} />{viewBlog.gallery.length} gallery images</span>}
              </div>

              {viewBlog.excerpt && <p className="text-slate-500 text-sm mb-5">{viewBlog.excerpt}</p>}

              {/* Gallery preview in modal */}
              {viewBlog.gallery?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Gallery</p>
                  <div className="grid grid-cols-4 gap-2">
                    {viewBlog.gallery.slice(0, 8).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}

              {viewBlog.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewBlog.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">{t}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                <button onClick={() => { handleEdit(viewBlog._id); setViewBlog(null); }}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  Edit article
                </button>
                {viewBlog.status === "Published" && (
                  <a href={`/blogs/${viewBlog.slug}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowUpRight size={14} /> View live
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteModal blog={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}

      {/* Create / Edit Form Drawer */}
      {formBlog !== null && (
        <BlogForm
          initial={formBlog?._id ? formBlog : null}
          onClose={() => setFormBlog(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default BlogManagement;