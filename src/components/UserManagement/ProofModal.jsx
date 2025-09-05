"use client";

import { motion } from "framer-motion";

const ProofModal = ({ isOpen, onClose, user, onApprove, onReject }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Blur background */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose} // close on background click
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">KYC Documents</h2>

        <div className="space-y-3">
          {user.aadharProof && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.aadharProof}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              Aadhaar Proof
            </a>
          )}
          {user.panProof && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.panProof}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              Pan Proof
            </a>
          )}
          {user.gstProof && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.gstProof}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              GST Proof
            </a>
          )}
          {user.iecProof && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.iecProof}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              IEC Proof
            </a>
          )}
        </div>

        {/* {user.kycStatus === "pending" && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                onApprove(user.id);
                onClose();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => {
                onReject(user.id);
                onClose();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )} */}
      </motion.div>
    </div>
  );
};

export default ProofModal;
