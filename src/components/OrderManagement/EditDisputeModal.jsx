'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, AlertCircle, Send, Loader2, Weight, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const disputeCategories = [
  { value: 'weight_discrepancy', label: 'Weight Discrepancy' },
  { value: 'missing_parcel', label: 'Missing Parcel' },
  { value: 'damaged_parcel', label: 'Damaged Parcel' },
  { value: 'incorrect_order', label: 'Incorrect Order Details' },
  { value: 'other', label: 'Other Operational Issue' },
];

const EditDisputeModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [weight, setWeight] = useState('');
  const [disputeType, setDisputeType] = useState('weight_discrepancy');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setWeight(order.weight || '');
      setDisputeType('weight_discrepancy');
      setDescription(
        `Actual weight recorded at warehouse: ${order.weight || '0'} kg. Declared weight requires adjustment.`
      );
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!weight || parseFloat(weight) <= 0) {
      toast.error('Please enter a valid weight value');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/edit-dispute`,
        {
          orderId: order._id,
          weight: weight.toString(),
          type: disputeType,
          description: description.trim(),
        }
      );

      if (response.data.success) {
        toast.success(
          `Weight updated to ${weight} kg and dispute notification sent to ${order.firstName || 'customer'}.`
        );
        if (onSuccess) onSuccess(response.data.order);
        onClose();
      }
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update weight and raise dispute'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] my-auto"
        >
          {/* Header (Fixed) */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl">
                <Scale size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight leading-tight">
                  Update Weight & File Dispute
                </h3>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">Invoice:</span>
                  <span className="font-mono text-[11px] text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                    {order.invoiceNo}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body (Scrollable if height constrained) */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
            {/* Order Specs Grid */}
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-0.5 text-[11px]">Customer Name</span>
                <span className="text-slate-900 font-semibold truncate block">
                  {order.firstName} {order.lastName}
                </span>
                <span className="text-slate-500 text-[10px] block mt-0.5">{order.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5 text-[11px]">Declared Weight</span>
                <span className="text-slate-900 font-semibold block">
                  {order.weight || '0'} kg
                </span>
              </div>
            </div>

            {/* Revised Weight Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Actual Measured Weight (KG) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Weight size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    setDescription(
                      `Actual measured weight: ${e.target.value} kg vs declared: ${order.weight || '0'} kg for invoice ${order.invoiceNo}.`
                    );
                  }}
                  placeholder="e.g. 3.50"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white"
                />
              </div>
            </div>

            {/* Dispute Category Select */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Dispute Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all bg-white font-medium"
              >
                {disputeCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description / Customer Note */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Dispute Summary & Client Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed explanation for the customer..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-none bg-white font-normal"
              />
            </div>

            {/* System Info Banner */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
              <ShieldAlert size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                Saving will mark this shipment as <strong className="font-semibold text-slate-900">Disputed</strong> and dispatch a real-time notification to <strong className="font-semibold text-slate-900">{order.firstName || 'the user'}</strong>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Submit & Notify User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditDisputeModal;
