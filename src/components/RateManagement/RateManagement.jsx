'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Edit, Trash2, Plus, Package, Globe, Weight, 
  Save, X, Search, Filter, IndianRupee, ChevronDown, ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const RateManagement = () => {
  const [rates, setRates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('');
  const [expandedCountries, setExpandedCountries] = useState(new Set());
  const [rateForm, setRateForm] = useState({
    weight: '',
    dest_country: '',
    package: '',
    rate: ''
  });

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/rates`;
  const COUNTRIES_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/rates/countries`;

  // Package types based on country
  const packagesByCountry = {
    'United States': ['Super Saver', 'Direct', 'USPS Special', 'First Class', 'Premium', 'Express', 'Premium Self', 'QuickExpress'],
    'United Kingdom': ['Direct', 'First Class', 'Premium', 'QuickExpress'],
    'Canada': ['Direct', 'First Class', 'Premium', 'Special', 'QuickExpress'],
    'Australia': ['Direct', 'QuickExpress'],
    'European Union': ['Direct', 'Direct Yun', 'Premium DPD', 'Worldwide', 'QuickExpress'],
  };

  // Get available packages for selected country
  const getAvailablePackages = (country) => {
    return packagesByCountry[country] || [];
  };

  // ================== FETCH RATES ==================
  const fetchRates = async () => {
    try {
      const { data } = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRates(data);
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================== FETCH COUNTRIES ==================
  const fetchCountries = async () => {
    try {
      const { data } = await axios.get(COUNTRIES_API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCountries(data);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchCountries();
  }, []);

  // ================== GROUPING ==================
  const groupedRates = () => {
    const filtered = rates.filter(rate => {
      const matchesSearch = 
        rate.dest_country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.package.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.weight.toString().includes(searchTerm);

      const matchesPackage = !filterPackage || rate.package === filterPackage;

      return matchesSearch && matchesPackage;
    });

    return filtered.reduce((grouped, rate) => {
      if (!grouped[rate.dest_country]) grouped[rate.dest_country] = [];
      grouped[rate.dest_country].push(rate);
      return grouped;
    }, {});
  };

  const getUniquePackageTypes = () => {
    return [...new Set(rates.map(rate => rate.package))].sort();
  };

  const toggleCountry = (country) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) newExpanded.delete(country);
    else newExpanded.add(country);
    setExpandedCountries(newExpanded);
  };

  const getCountryStats = (countryRates) => {
    const packages = [...new Set(countryRates.map(rate => rate.package))];
    const minRate = Math.min(...countryRates.map(rate => rate.rate));
    const maxRate = Math.max(...countryRates.map(rate => rate.rate));
    const weightRange = {
      min: Math.min(...countryRates.map(rate => rate.weight)),
      max: Math.max(...countryRates.map(rate => rate.weight)),
    };
    return { packages, minRate, maxRate, weightRange, count: countryRates.length };
  };

  const getPackageColor = (packageType) => {
    const colors = {
      // United States packages
      'Super Saver': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Direct': 'bg-blue-100 text-blue-800 border-blue-200',
      'USPS Special': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'First Class': 'bg-purple-100 text-purple-800 border-purple-200',
      'Premium': 'bg-pink-100 text-pink-800 border-pink-200',
      'Express': 'bg-red-100 text-red-800 border-red-200',
      'Premium Self': 'bg-orange-100 text-orange-800 border-orange-200',
      
      // Canada packages
      'Special': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      
      // European Union packages
      'Direct Yun': 'bg-teal-100 text-teal-800 border-teal-200',
      'Premium DPD': 'bg-violet-100 text-violet-800 border-violet-200',
      'Worldwide': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      
      // Legacy packages
      'Cheaper': 'bg-green-100 text-green-800 border-green-200',
      'UPS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'DHL': 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colors[packageType] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // ================== CREATE / UPDATE ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rateData = {
      weight: parseFloat(rateForm.weight),
      dest_country: rateForm.dest_country.trim(),
      package: rateForm.package.trim(),
      rate: parseInt(rateForm.rate),
    };

    try {
      if (editingRate) {
        // Update API
        const { data } = await axios.put(`${API_URL}/${editingRate._id}`, rateData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setRates(prev => prev.map(rate => rate._id === editingRate._id ? data : rate));
      } else {
        // Create API
        const { data } = await axios.post(API_URL, rateData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setRates(prev => [...prev, data]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save rate:', error.response?.data || error.message);
    }
  };

  // ================== DELETE ==================
  const handleDelete = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      await axios.delete(`${API_URL}/${rateId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setRates(prev => prev.filter(rate => rate._id !== rateId));
      toast.success("Rate deleted successfully");
    } catch (error) {
      console.error('Failed to delete rate:', error.response?.data || error.message);
    }
  };

  // ================== EDIT ==================
  const handleEdit = (rate) => {
    setEditingRate(rate);
    setRateForm({
      weight: rate.weight.toString(),
      dest_country: rate.dest_country,
      package: rate.package,
      rate: rate.rate.toString(),
    });
    setShowRateForm(true);
  };

  const resetForm = () => {
    setRateForm({
      weight: '',
      dest_country: '',
      package: '',
      rate: '',
    });
    setEditingRate(null);
    setShowRateForm(false);
  };

  // Handle country change and reset package selection
  const handleCountryChange = (country) => {
    setRateForm(prev => ({ 
      ...prev, 
      dest_country: country,
      package: '' // Reset package when country changes
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Loading Rates...</h1>
      </div>
    );
  }

  const grouped = groupedRates();
  const totalRates = Object.values(grouped).flat().length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <ToastContainer />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipping Rate Management</h1>
          <p className="text-slate-600 mt-1">{Object.keys(grouped).length} countries • {totalRates} rates</p>
        </div>
        <button 
          onClick={() => setShowRateForm(!showRateForm)}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add New Rate</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search countries, packages, or weights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          
          <div className="relative">
            <Package size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="">All Packages</option>
              {getUniquePackageTypes().map(packageType => (
                <option key={packageType} value={packageType}>{packageType}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-slate-600">
              <Filter size={16} className="mr-2" />
              <span className="text-sm">{totalRates} rates found</span>
            </div>
            <button
              onClick={() => setExpandedCountries(new Set(Object.keys(grouped)))}
              className="text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Expand All
            </button>
          </div>
        </div>
      </div>

      {/* Rate Form */}
      <AnimatePresence>
        {showRateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingRate ? 'Edit Shipping Rate' : 'Create New Shipping Rate'}
              </h3>
              <button 
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={rateForm.weight}
                    onChange={(e) => setRateForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="0.500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={rateForm.rate}
                    onChange={(e) => setRateForm(prev => ({ ...prev, rate: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="2400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination Country
                  </label>
                  <select
                    value={rateForm.dest_country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Package Type
                  </label>
                  <select
                    value={rateForm.package}
                    onChange={(e) => setRateForm(prev => ({ ...prev, package: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
                    disabled={!rateForm.dest_country}
                    required
                  >
                    <option value="">
                      {rateForm.dest_country ? 'Select Package Type' : 'Select Country First'}
                    </option>
                    {rateForm.dest_country && getAvailablePackages(rateForm.dest_country).map(pkg => (
                      <option key={pkg} value={pkg}>
                        {pkg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{editingRate ? 'Update Rate' : 'Create Rate'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped Rates */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([country, countryRates]) => {
          const stats = getCountryStats(countryRates);
          const isExpanded = expandedCountries.has(country);
          
          return (
            <motion.div
              key={country}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Country Header */}
              <div 
                className="p-6 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleCountry(country)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <Globe size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{country}</h3>
                      <p className="text-slate-600 text-sm">
                        {stats.count} rates • {stats.packages.join(', ')} packages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Weight Range</p>
                      <p className="font-medium">{stats.weightRange.min}kg - {stats.weightRange.max}kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Rate Range</p>
                      <p className="font-medium">₹{stats.minRate} - ₹{stats.maxRate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Country Rates */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="divide-y divide-slate-100">
                      {countryRates
                        .sort((a, b) => a.weight - b.weight)
                        .map((rate, index) => (
                          <motion.div
                            key={rate._id}
                            className="p-4 hover:bg-slate-50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                  <Weight size={16} className="text-slate-600" />
                                  <span className="font-medium text-slate-800">{rate.weight} kg</span>
                                </div>
                                
                                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPackageColor(rate.package)}`}>
                                  {rate.package}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <IndianRupee size={18} className="text-green-600" />
                                  <span className="text-xl font-bold text-slate-800">{rate.rate}</span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(rate);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Rate"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(rate._id);
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Rate"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Settings size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 mb-2">
            {searchTerm || filterPackage 
              ? 'No rates match your search criteria' 
              : 'No shipping rates configured yet'
            }
          </p>
          {!searchTerm && !filterPackage && (
            <button
              onClick={() => setShowRateForm(true)}
              className="mt-4 bg-slate-800 text-white px-6 py-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Create First Rate
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RateManagement;