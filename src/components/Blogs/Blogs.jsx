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
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Link2,
  User,
  ImagePlus,
  MousePointerClick,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Minus,
  ExternalLink,
  Zap,
  CheckCircle,
  PlusCircle,
  Grip,
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

// ── Preset CTA Templates ─────────────────────────────────
const CTA_PRESETS = [
  { label: "Read More", url: "/blogs", style: "outline", icon: "📖", type: "internal" },
  { label: "Book a Parcel", url: "/book", style: "primary", icon: "📦", type: "internal" },
  { label: "Contact Us", url: "/contact", style: "secondary", icon: "📞", type: "internal" },
  { label: "Track Shipment", url: "/tracking", style: "primary", icon: "🚚", type: "internal" },
  { label: "Get a Quote", url: "/quote", style: "primary", icon: "💰", type: "internal" },
  { label: "View Services", url: "/services", style: "outline", icon: "✨", type: "internal" },
];

const CTA_STYLE_CLASSES = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-900 border border-slate-800",
  outline:
    "bg-white text-emerald-700 border border-emerald-500 hover:bg-emerald-50",
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  gallery: [],
  author: "Admin",
  authorImage: "",
  authorBio: "",
  authorSocial: {
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    website: "",
  },
  category: "General",
  tags: "",
  status: "Draft",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ctaButtons: [],
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

// ── CTA Button Preview ─────────────────────────────────────
const CTAButtonPreview = ({ btn, onRemove }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 group">
    <div className="flex-shrink-0">
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${CTA_STYLE_CLASSES[btn.style] || CTA_STYLE_CLASSES.primary}`}
      >
        {btn.icon && <span>{btn.icon}</span>}
        {btn.label}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 truncate">{btn.url}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] font-medium text-slate-400 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
          {btn.style}
        </span>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {btn.position === "end" ? "End of post" : "Inline"}
        </span>
        {btn.type === "external" && (
          <ExternalLink size={10} className="text-slate-400" />
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      title="Remove"
    >
      <X size={13} />
    </button>
  </div>
);

// ── Image Upload Zone ─────────────────────────────────────
const ImageUploadZone = ({
  label,
  hint,
  multiple = false,
  onUploaded,
  existingUrls = [],
  uploadField,
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState(existingUrls);

  useEffect(() => {
    setPreviews(existingUrls);
  }, [existingUrls.join(",")]);

  const fieldName = uploadField || (multiple ? "gallery" : "featuredImage");

  const handleFiles = useCallback(
    async (files) => {
      if (!files?.length) return;
      setUploading(true);
      try {
        const formData = new FormData();
        if (multiple) {
          Array.from(files).forEach((f) => formData.append(fieldName, f));
        } else {
          formData.append(fieldName, files[0]);
        }

        const res = await axios.post(`${API_BASE}/api/blogs/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const data = res.data?.data;
        if (multiple) {
          const newUrls = [...previews, ...(data[fieldName] || [])];
          setPreviews(newUrls);
          onUploaded(newUrls);
        } else {
          const url = data[fieldName] || "";
          setPreviews(url ? [url] : []);
          onUploaded(url);
        }
        toast.success("Image(s) uploaded successfully.");
      } catch (err) {
        toast.error(err?.response?.data?.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [previews, multiple, onUploaded, fieldName]
  );

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

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
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
              {multiple
                ? "Drop images here or click to browse"
                : "Drop an image or click to browse"}
            </p>
            <p className="text-xs">
              {multiple
                ? "JPG, PNG, WebP · max 5 MB each · up to 10 images"
                : "JPG, PNG, WebP · max 5 MB"}
            </p>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      {previews.length > 0 && (
        <div
          className={`grid gap-3 ${multiple ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}
        >
          {previews.map((url, idx) => (
            <div
              key={url + idx}
              className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-video"
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={12} />
              </button>
              {!multiple && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="text-white text-[10px] truncate">
                    {url.split("/").pop()}
                  </p>
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

// ── Content Toolbar ───────────────────────────────────────
const TOOLBAR_BUTTONS = [
  { icon: Bold, title: "Bold", wrap: ["<strong>", "</strong>"] },
  { icon: Italic, title: "Italic", wrap: ["<em>", "</em>"] },
  { icon: Heading2, title: "Heading 2", wrap: ["<h2>", "</h2>"] },
  { icon: Heading3, title: "Heading 3", wrap: ["<h3>", "</h3>"] },
  { icon: List, title: "Bullet List", snippet: "\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>\n" },
  { icon: Quote, title: "Blockquote", wrap: ["<blockquote>", "</blockquote>"] },
  { icon: Minus, title: "Divider", snippet: "\n<hr />\n" },
  { icon: Link2, title: "Link", wrap: ['<a href="https://...">', "</a>"] },
];

const ContentToolbar = ({ textareaRef, onContentChange, content }) => {
  const insertAtCursor = (wrap, snippet) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);

    let inserted;
    if (snippet) {
      inserted = snippet;
    } else if (wrap) {
      inserted = selected
        ? `${wrap[0]}${selected}${wrap[1]}`
        : `${wrap[0]}text here${wrap[1]}`;
    }

    const newContent = content.slice(0, start) + inserted + content.slice(end);
    onContentChange(newContent);

    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + inserted.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-t-lg border-b-0">
      {TOOLBAR_BUTTONS.map(({ icon: Icon, title, wrap, snippet }) => (
        <button
          key={title}
          type="button"
          title={title}
          onClick={() => insertAtCursor(wrap, snippet)}
          className="w-8 h-8 flex items-center justify-center rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
};

// ── Blog Form (Create / Edit) ─────────────────────────────
const BlogForm = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initial || {}),
    tags: Array.isArray(initial?.tags)
      ? initial.tags.join(", ")
      : initial?.tags || "",
    seoKeywords: Array.isArray(initial?.seoKeywords)
      ? initial.seoKeywords.join(", ")
      : initial?.seoKeywords || "",
    gallery: initial?.gallery || [],
    ctaButtons: initial?.ctaButtons || [],
  }));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("content");
  const [insertingImage, setInsertingImage] = useState(false);
  const contentRef = useRef(null);
  const contentImageInputRef = useRef(null);
  const isEdit = !!initial?._id;

  // CTA builder state
  const [ctaForm, setCtaForm] = useState({
    label: "",
    url: "",
    style: "primary",
    icon: "",
    type: "internal",
    position: "end",
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSocial = (field) => (e) =>
    setForm((f) => ({
      ...f,
      authorSocial: { ...f.authorSocial, [field]: e.target.value },
    }));

  // Insert image at cursor
  const insertContentImage = async (file) => {
    if (!file) return;
    setInsertingImage(true);
    try {
      const formData = new FormData();
      formData.append("contentImage", file);
      const res = await axios.post(`${API_BASE}/api/blogs/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.contentImage;
      if (!url) throw new Error("No URL returned");

      const snippet = `\n<figure>\n  <img src="${url}" alt="" />\n  <figcaption>Add a caption…</figcaption>\n</figure>\n`;
      const textarea = contentRef.current;

      setForm((f) => {
        const start = textarea?.selectionStart ?? f.content.length;
        const end = textarea?.selectionEnd ?? f.content.length;
        const newContent =
          f.content.slice(0, start) + snippet + f.content.slice(end);

        if (textarea) {
          requestAnimationFrame(() => {
            textarea.focus();
            const pos = start + snippet.length;
            textarea.setSelectionRange(pos, pos);
          });
        }
        return { ...f, content: newContent };
      });

      toast.success("Image inserted into content.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload image.");
    } finally {
      setInsertingImage(false);
    }
  };

  // Insert inline CTA into content at cursor
  const insertInlineCTA = (btn) => {
    const textarea = contentRef.current;
    const snippet = `\n<div class="cta-inline" data-style="${btn.style}">\n  <a href="${btn.url}"${btn.type === "external" ? ' target="_blank" rel="noopener noreferrer"' : ""}>${btn.icon ? btn.icon + " " : ""}${btn.label}</a>\n</div>\n`;

    setForm((f) => {
      const start = textarea?.selectionStart ?? f.content.length;
      const end = textarea?.selectionEnd ?? f.content.length;
      const newContent =
        f.content.slice(0, start) + snippet + f.content.slice(end);
      if (textarea) {
        requestAnimationFrame(() => {
          textarea.focus();
          const pos = start + snippet.length;
          textarea.setSelectionRange(pos, pos);
        });
      }
      return { ...f, content: newContent };
    });
    toast.success(`Inline CTA "${btn.label}" inserted at cursor.`);
  };

  // Add preset CTA
  const addPreset = (preset) => {
    setForm((f) => ({
      ...f,
      ctaButtons: [
        ...f.ctaButtons,
        { ...preset, position: "end" },
      ],
    }));
    toast.success(`"${preset.label}" button added!`);
  };

  // Add custom CTA
  const addCustomCTA = () => {
    if (!ctaForm.label.trim() || !ctaForm.url.trim()) {
      toast.warning("Button label and URL are required.");
      return;
    }
    setForm((f) => ({
      ...f,
      ctaButtons: [...f.ctaButtons, { ...ctaForm }],
    }));
    setCtaForm({
      label: "",
      url: "",
      style: "primary",
      icon: "",
      type: "internal",
      position: "end",
    });
    toast.success("Custom CTA button added!");
  };

  const removeCTA = (idx) => {
    setForm((f) => ({
      ...f,
      ctaButtons: f.ctaButtons.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.warning("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags:
          typeof form.tags === "string"
            ? form.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : form.tags,
        seoKeywords:
          typeof form.seoKeywords === "string"
            ? form.seoKeywords
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : form.seoKeywords,
        gallery: form.gallery || [],
        ctaButtons: form.ctaButtons || [],
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
  const keywordsValue = Array.isArray(form.seoKeywords)
    ? form.seoKeywords.join(", ")
    : form.seoKeywords;

  const TABS = [
    { key: "content", label: "✍️ Content" },
    { key: "cta", label: "🎯 CTAs", badge: form.ctaButtons?.length || 0 },
    { key: "media", label: "🖼️ Media" },
    { key: "author", label: "👤 Author" },
    { key: "seo", label: "🔍 SEO" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit article" : "New article"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit
                ? `Editing: ${initial.title}`
                : "Fill in the details below — no coding required!"}
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
        <div className="flex border-b border-slate-100 px-4 overflow-x-auto">
          {TABS.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 px-3 mr-1 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                tab === key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* ── CONTENT TAB ── */}
          {tab === "content" && (
            <>
              {/* Writing tip banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                <Zap size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">Quick tips</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Use the toolbar to format text (bold, headings, lists) without typing any code. The preview will show exactly how it looks.
                  </p>
                </div>
              </div>

              <InputField label="Article Title" required hint="This is the headline readers see first — make it clear and engaging.">
                <input
                  type="text"
                  placeholder="e.g. How to Ship Parcels Across India in 24 Hours"
                  value={form.title}
                  onChange={set("title")}
                  className={inputCls}
                />
              </InputField>

              <InputField
                label="Short Intro (Excerpt)"
                hint="A 1–2 sentence summary shown on the blog listing page. Keep it under 500 characters."
              >
                <textarea
                  rows={2}
                  placeholder="e.g. Discover the fastest, most reliable way to send parcels…"
                  value={form.excerpt}
                  onChange={set("excerpt")}
                  maxLength={500}
                  className={`${inputCls} resize-none`}
                />
              </InputField>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Article Body <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400">
                  Write your full article here. Use the toolbar to add formatting. You can also insert images directly into the text.
                </p>

                {/* Toolbar */}
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <ContentToolbar
                    textareaRef={contentRef}
                    content={form.content}
                    onContentChange={(val) =>
                      setForm((f) => ({ ...f, content: val }))
                    }
                  />

                  {/* Insert image button row */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                    <input
                      ref={contentImageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        insertContentImage(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => contentImageInputRef.current?.click()}
                      disabled={insertingImage}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent transition-all disabled:opacity-60"
                    >
                      {insertingImage ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <ImagePlus size={12} />
                      )}
                      {insertingImage ? "Uploading…" : "Insert Image"}
                    </button>
                    <span className="text-slate-300 text-xs">|</span>
                    <span className="text-xs text-slate-400">
                      Click buttons above to format text
                    </span>
                  </div>

                  <textarea
                    ref={contentRef}
                    rows={14}
                    placeholder="Start writing your article here…&#10;&#10;Tip: Select some text, then click Bold or Italic above to format it."
                    value={form.content}
                    onChange={set("content")}
                    className="w-full px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-y font-mono text-xs leading-relaxed border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Category" hint="e.g. Logistics, News, Tips">
                  <input
                    type="text"
                    placeholder="e.g. Logistics"
                    value={form.category}
                    onChange={set("category")}
                    className={inputCls}
                  />
                </InputField>

                <InputField label="Tags" hint="Separate with commas">
                  <div className="relative">
                    <Tag
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="shipping, tracking…"
                      value={tagsValue}
                      onChange={set("tags")}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </InputField>
              </div>

              {/* Status — visual radio cards */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Publishing Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "Draft",
                      label: "Save as Draft",
                      desc: "Only visible to admins",
                      emoji: "🗒️",
                    },
                    {
                      value: "Published",
                      label: "Publish Now",
                      desc: "Immediately visible to everyone",
                      emoji: "🚀",
                    },
                  ].map(({ value, label, desc, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: value }))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        form.status === value
                          ? value === "Published"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{emoji}</span>
                        {form.status === value && (
                          <CheckCircle
                            size={15}
                            className={
                              value === "Published"
                                ? "text-emerald-500"
                                : "text-blue-500"
                            }
                          />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CTA BUTTONS TAB ── */}
          {tab === "cta" && (
            <>
              {/* Info banner */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
                <MousePointerClick size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-violet-800">
                    Call-to-Action Buttons
                  </p>
                  <p className="text-xs text-violet-600 mt-1 leading-relaxed">
                    Add clickable buttons to encourage readers to take action — like booking a parcel or contacting you. They appear as a styled section at the <strong>end of the article</strong>.
                  </p>
                </div>
              </div>

              {/* Quick-add presets */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  ⚡ Quick-Add Preset Buttons
                </p>
                <p className="text-xs text-slate-400">
                  Click any button below to instantly add it to your article:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CTA_PRESETS.map((preset) => {
                    const alreadyAdded = form.ctaButtons.some(
                      (b) => b.label === preset.label && b.url === preset.url
                    );
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => !alreadyAdded && addPreset(preset)}
                        disabled={alreadyAdded}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                          alreadyAdded
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700"
                        }`}
                      >
                        <span className="text-xl">{preset.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{preset.label}</p>
                          <p className="text-xs text-slate-400">{preset.url}</p>
                        </div>
                        {alreadyAdded ? (
                          <CheckCircle size={14} className="ml-auto text-emerald-500 flex-shrink-0" />
                        ) : (
                          <PlusCircle size={14} className="ml-auto text-slate-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                {/* Custom CTA builder */}
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  🛠️ Create a Custom Button
                </p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Button Label *</label>
                      <input
                        type="text"
                        placeholder="e.g. Learn More"
                        value={ctaForm.label}
                        onChange={(e) =>
                          setCtaForm((c) => ({ ...c, label: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Icon (emoji)</label>
                      <input
                        type="text"
                        placeholder="e.g. 🎯"
                        value={ctaForm.icon}
                        onChange={(e) =>
                          setCtaForm((c) => ({ ...c, icon: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">URL / Link *</label>
                    <input
                      type="text"
                      placeholder="e.g. /contact or https://example.com"
                      value={ctaForm.url}
                      onChange={(e) =>
                        setCtaForm((c) => ({
                          ...c,
                          url: e.target.value,
                          type: e.target.value.startsWith("http")
                            ? "external"
                            : "internal",
                        }))
                      }
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Button Style</label>
                      <select
                        value={ctaForm.style}
                        onChange={(e) =>
                          setCtaForm((c) => ({ ...c, style: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="primary">🟢 Primary (Green filled)</option>
                        <option value="secondary">⬛ Secondary (Dark filled)</option>
                        <option value="outline">⬜ Outline (Bordered)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Position</label>
                      <select
                        value={ctaForm.position}
                        onChange={(e) =>
                          setCtaForm((c) => ({ ...c, position: e.target.value }))
                        }
                        className={inputCls}
                      >
                        <option value="end">📍 End of article</option>
                        <option value="inline">📌 Inline (in content)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  {ctaForm.label && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-400 mb-2">Preview:</p>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${CTA_STYLE_CLASSES[ctaForm.style] || CTA_STYLE_CLASSES.primary}`}
                      >
                        {ctaForm.icon && <span>{ctaForm.icon}</span>}
                        {ctaForm.label}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={addCustomCTA}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusCircle size={14} />
                      Add Button
                    </button>
                    {ctaForm.position === "inline" && ctaForm.label && ctaForm.url && (
                      <button
                        type="button"
                        onClick={() => {
                          insertInlineCTA(ctaForm);
                          setTab("content");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        <MousePointerClick size={14} />
                        Insert into Content
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Added buttons list */}
              {form.ctaButtons?.length > 0 && (
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Grip size={14} className="text-slate-400" />
                    Added Buttons ({form.ctaButtons.length})
                  </p>
                  {form.ctaButtons.map((btn, idx) => (
                    <CTAButtonPreview
                      key={idx}
                      btn={btn}
                      onRemove={() => removeCTA(idx)}
                    />
                  ))}
                </div>
              )}

              {form.ctaButtons?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MousePointerClick size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No buttons added yet.</p>
                  <p className="text-xs mt-1">Use the presets above or build a custom one.</p>
                </div>
              )}
            </>
          )}

          {/* ── MEDIA TAB ── */}
          {tab === "media" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                  <Upload size={12} />
                  Images are uploaded to your own server and served as static
                  files — great for SEO.
                </p>
              </div>

              <ImageUploadZone
                label="Featured Image"
                hint="This is the cover image shown in listings and at the top of the article."
                multiple={false}
                existingUrls={form.featuredImage ? [form.featuredImage] : []}
                onUploaded={(url) =>
                  setForm((f) => ({ ...f, featuredImage: url }))
                }
              />

              <div className="border-t border-slate-100 pt-5">
                <ImageUploadZone
                  label="Gallery Images"
                  hint="Additional images displayed in a grid inside the article. Up to 10 images."
                  multiple={true}
                  existingUrls={form.gallery || []}
                  onUploaded={(urls) =>
                    setForm((f) => ({ ...f, gallery: urls }))
                  }
                />
              </div>
            </>
          )}

          {/* ── AUTHOR TAB ── */}
          {tab === "author" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                  <User size={12} />
                  Shown in an author card at the end of the published article.
                </p>
              </div>

              <InputField label="Author Name">
                <input
                  type="text"
                  placeholder="e.g. Kuldeep Karki"
                  value={form.author}
                  onChange={set("author")}
                  className={inputCls}
                />
              </InputField>

              <ImageUploadZone
                label="Author Photo"
                hint="A square headshot works best."
                multiple={false}
                existingUrls={form.authorImage ? [form.authorImage] : []}
                onUploaded={(url) =>
                  setForm((f) => ({ ...f, authorImage: url }))
                }
                uploadField="authorImage"
              />

              <InputField
                label="Short Bio"
                hint="2–3 sentences about the author and their expertise."
              >
                <textarea
                  rows={3}
                  placeholder="e.g. Digital Marketing Manager at Trace Express, specialising in logistics…"
                  value={form.authorBio}
                  onChange={set("authorBio")}
                  className={`${inputCls} resize-none`}
                />
              </InputField>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="LinkedIn URL">
                  <div className="relative">
                    <Linkedin
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/…"
                      value={form.authorSocial?.linkedin || ""}
                      onChange={setSocial("linkedin")}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </InputField>
                <InputField label="Twitter / X URL">
                  <div className="relative">
                    <Twitter
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      placeholder="https://x.com/…"
                      value={form.authorSocial?.twitter || ""}
                      onChange={setSocial("twitter")}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </InputField>
                <InputField label="Instagram URL">
                  <div className="relative">
                    <Instagram
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      placeholder="https://instagram.com/…"
                      value={form.authorSocial?.instagram || ""}
                      onChange={setSocial("instagram")}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </InputField>
                <InputField label="Facebook URL">
                  <div className="relative">
                    <Facebook
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      placeholder="https://facebook.com/…"
                      value={form.authorSocial?.facebook || ""}
                      onChange={setSocial("facebook")}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </InputField>
              </div>

              <InputField label="Website URL">
                <div className="relative">
                  <Link2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={form.authorSocial?.website || ""}
                    onChange={setSocial("website")}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </InputField>
            </>
          )}

          {/* ── SEO TAB ── */}
          {tab === "seo" && (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-2">
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <Globe size={12} />
                  SEO fields help search engines (like Google) understand and rank your article. They&apos;re optional but recommended.
                </p>
              </div>

              <InputField
                label="SEO Title"
                hint="The page title shown in Google search results. Defaults to article title if blank."
              >
                <input
                  type="text"
                  placeholder="Optimised page title…"
                  value={form.seoTitle}
                  onChange={set("seoTitle")}
                  className={inputCls}
                />
              </InputField>

              <InputField
                label="SEO Description"
                hint="A short description (150–160 chars) shown under your title in Google results."
              >
                <textarea
                  rows={3}
                  placeholder="Meta description for search engines…"
                  value={form.seoDescription}
                  onChange={set("seoDescription")}
                  className={`${inputCls} resize-none`}
                />
              </InputField>

              <InputField
                label="SEO Keywords"
                hint="Comma-separated keywords relevant to this article."
              >
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
                    Google search preview
                  </p>
                  <p className="text-blue-700 text-sm font-medium truncate">
                    {form.seoTitle || form.title}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">
                    thetraceexpress.com/blogs/
                    {(form.title || "").toLowerCase().replace(/\s+/g, "-")}
                  </p>
                  {form.seoDescription && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                      {form.seoDescription}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {form.status === "Published"
              ? "🚀 Will be live immediately."
              : "🗒️ Saved as draft."}
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

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0,
  });

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
          <p className="text-sm text-slate-400 mt-1">
            Manage your editorial content
          </p>
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
        <StatCard
          icon={FileText}
          label="Total Articles"
          value={stats.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={Globe}
          label="Published"
          value={stats.published}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Filter}
          label="Drafts"
          value={stats.draft}
          color="bg-amber-500"
        />
        <StatCard
          icon={BarChart2}
          label="Total Views"
          value={stats.views.toLocaleString("en-IN")}
          color="bg-violet-500"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
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
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Article
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Category
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      CTAs
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Views
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayed.map((b) => (
                    <tr
                      key={b._id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {b.featuredImage ? (
                            <img
                              src={b.featuredImage}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <FileText size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1">
                              {b.title}
                            </p>
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
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {b.category || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-500"}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {b.ctaButtons?.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100">
                            <MousePointerClick size={10} />
                            {b.ctaButtons.length}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {(b.views || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(b.publishedAt || b.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.status === "Published" && (
                            <a
                              href={`/blogs/${b.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title="View live"
                            >
                              <ArrowUpRight size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => setViewBlog(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                            title="Quick view"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(b._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
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
                      <img
                        src={b.featuredImage}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
                        {b.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[b.status]}`}
                        >
                          {b.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {b.category}
                        </span>
                        {b.ctaButtons?.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100">
                            <MousePointerClick size={9} />
                            {b.ctaButtons.length} CTAs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleEdit(b._id)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">
              Page {page} of {pages} — {total} articles
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchBlogs(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => fetchBlogs(page + 1)}
                disabled={page === pages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {viewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewBlog(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto">
            {viewBlog.featuredImage && (
              <img
                src={viewBlog.featuredImage}
                alt={viewBlog.title}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border mb-2 ${STATUS_STYLES[viewBlog.status]}`}
                  >
                    {viewBlog.status}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">
                    {viewBlog.title}
                  </h3>
                </div>
                <button
                  onClick={() => setViewBlog(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(viewBlog.publishedAt || viewBlog.createdAt)}
                </span>
                <span>By {viewBlog.author}</span>
                <span>{viewBlog.category}</span>
                <span>{viewBlog.views || 0} views</span>
                {viewBlog.gallery?.length > 0 && (
                  <span className="flex items-center gap-1 text-blue-500">
                    <Images size={12} />
                    {viewBlog.gallery.length} gallery images
                  </span>
                )}
                {viewBlog.ctaButtons?.length > 0 && (
                  <span className="flex items-center gap-1 text-violet-500">
                    <MousePointerClick size={12} />
                    {viewBlog.ctaButtons.length} CTA button
                    {viewBlog.ctaButtons.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {viewBlog.excerpt && (
                <p className="text-slate-500 text-sm mb-5">{viewBlog.excerpt}</p>
              )}

              {/* CTA preview in modal */}
              {viewBlog.ctaButtons?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    CTA Buttons
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewBlog.ctaButtons.map((btn, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${CTA_STYLE_CLASSES[btn.style] || CTA_STYLE_CLASSES.primary}`}
                      >
                        {btn.icon && <span>{btn.icon}</span>}
                        {btn.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery preview in modal */}
              {viewBlog.gallery?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Gallery
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {viewBlog.gallery.slice(0, 8).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {viewBlog.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewBlog.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
                <button
                  onClick={() => {
                    handleEdit(viewBlog._id);
                    setViewBlog(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Edit article
                </button>
                {viewBlog.status === "Published" && (
                  <a
                    href={`/blogs/${viewBlog.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                  >
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
        <DeleteModal
          blog={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
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