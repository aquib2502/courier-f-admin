'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const LoginForm = () => {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // clear old error
    console.log('Submitting credentials:', credentials);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, credentials);
      const { token } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        setMessage('Login successful! Redirecting...');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/BgVideo.mp4" type="video/mp4" />
      </video>

      {/* Login Form with Smooth Fade-in Delay */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }} // Smooth delay added
        className="relative z-10 flex items-center justify-center min-h-screen p-4"
      >
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">TTE Admin</h1>
            <p className="text-slate-600">Courier Management System</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 border border-green-300">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, username: e.target.value }))
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 text-white py-3 px-4 rounded-xl hover:bg-slate-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
