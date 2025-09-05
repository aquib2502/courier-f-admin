"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

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
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-50"
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
          User Details
        </h2>

        {/* User Info */}
        <div className="space-y-3">
          <p>
            <span className="font-medium text-slate-600">Full Name:</span>{" "}
            {user.fullname}
          </p>
          <p>
            <span className="font-medium text-slate-600">Email:</span>{" "}
            {user.email}
          </p>
          <p>
            <span className="font-medium text-slate-600">Phone:</span>{" "}
            {user.phone}
          </p>
          <p>
            <span className="font-medium text-slate-600">Role:</span>{" "}
            {user.role}
          </p>
          <p>
            <span className="font-medium text-slate-600">Aadhar Number:</span>{" "}
            {user.aadharNumber || "—"}
          </p>
          <p>
            <span className="font-medium text-slate-600">PAN Number:</span>{" "}
            {user.panNumber || "—"}
          </p>
          <p>
            <span className="font-medium text-slate-600">Join Date:</span>{" "}
            <span>
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
          </p>
          <p>
            <span className="font-medium text-slate-600">KYC Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-md text-sm ${
                user.kycStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : user.kycStatus === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {user.kycStatus}
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetailsModal;
