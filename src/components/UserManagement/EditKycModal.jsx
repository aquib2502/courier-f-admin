"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const EditKYCModal = ({ isOpen, onClose, user, onUpdateKYC }) => {
  const [newStatus, setNewStatus] = useState(user?.kycStatus || "pending");
  const [rejectReason, setRejectReason] = useState(user?.kycRejectReason || "");

  if (!isOpen || !user) return null;

  const handleSave = () => {
    const payload = { kycStatus: newStatus };

    // Include reason only if rejected
    if (newStatus === "rejected") {
      payload.kycRejectReason = rejectReason.trim();
    }

    onUpdateKYC(user._id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-50"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">
          Edit KYC Status
        </h2>

        {/* Status Dropdown */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">
            KYC Status
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Reject Reason (only when rejected) */}
        {newStatus === "rejected" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for rejection"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring focus:ring-red-200"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={newStatus === "rejected" && !rejectReason.trim()}
            className={`px-4 py-2 rounded-lg text-white ${
              newStatus === "rejected" && !rejectReason.trim()
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditKYCModal;
