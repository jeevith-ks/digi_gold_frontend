// app/jewels/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAlert } from '@/context/AlertContext';

// Icons Component
const Icons = {
  Diamond: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  Upload: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Admin: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  Close: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Trash: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Image: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Gold: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Weight: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  Price: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Menu: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Home: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Gallery: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Alert: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
};

// Sample jewel data
const initialJewels = [
  {
    id: 1,
    name: "Diamond Necklace",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=250&h=350&fit=crop",
    price: "$12,500",
    weight: "25g",
    karat: "18K Gold",
    category: "Necklace",
    description: "Elegant diamond necklace with white gold setting"
  },
  {
    id: 2,
    name: "Ruby Ring",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=250&h=350&fit=crop",
    price: "$8,200",
    weight: "8g",
    karat: "22K Gold",
    category: "Ring",
    description: "Stunning ruby ring with diamond accents"
  },
  {
    id: 3,
    name: "Pearl Earrings",
    image: "https://images.unsplash.com/photo-1594576722512-582d5577dc56?w=250&h=350&fit=crop",
    price: "$3,400",
    weight: "12g",
    karat: "14K Gold",
    category: "Earrings",
    description: "Classic pearl drop earrings"
  },
  {
    id: 4,
    name: "Sapphire Bracelet",
    image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=250&h=350&fit=crop",
    price: "$15,800",
    weight: "35g",
    karat: "18K Gold",
    category: "Bracelet",
    description: "Exquisite sapphire tennis bracelet"
  },
  {
    id: 5,
    name: "Emerald Pendant",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=250&h=350&fit=crop",
    price: "$6,900",
    weight: "15g",
    karat: "24K Gold",
    category: "Pendant",
    description: "Beautiful emerald pendant with chain"
  },
  {
    id: 6,
    name: "Gold Bangle",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=250&h=350&fit=crop",
    price: "$4,500",
    weight: "22g",
    karat: "22K Gold",
    category: "Bangle",
    description: "Traditional gold bangle with engravings"
  }
];

// Admin Login Component
const AdminLogin = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    // Simple password check - in real app, use proper authentication
    if (password === 'admin123') {
      onLogin();
      onClose();
    } else {
      setError('Incorrect password. Try: admin123');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.Admin />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <Icons.Close />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter admin password"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Demo password: <span className="font-mono">admin123</span>
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
};

// Image Upload Component
const ImageUploadModal = ({ onClose, onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [jewelDetails, setJewelDetails] = useState({
    name: '',
    price: '',
    weight: '',
    karat: '18K Gold',
    category: 'Necklace',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [sizeErrors, setSizeErrors] = useState([]);
  const fileInputRef = useRef(null);
  const { showAlert } = useAlert();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const errors = [];
    const validFiles = [];

    files.forEach((file, index) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        if (img.width !== 250 || img.height !== 350) {
          errors.push({
            name: file.name,
            width: img.width,
            height: img.height
          });
        } else {
          validFiles.push(file);
        }

        // Check if this is the last image
        if (index === files.length - 1) {
          setSizeErrors(errors);
          if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
          }
        }

        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showAlert('Please select at least one image', "warning");
      return;
    }

    if (!jewelDetails.name || !jewelDetails.price || !jewelDetails.weight) {
      showAlert('Please fill in all required fields', "warning");
      return;
    }

    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      const newJewels = selectedFiles.map((file, index) => {
        const objectUrl = URL.createObjectURL(file);
        return {
          id: Date.now() + index,
          name: jewelDetails.name + (selectedFiles.length > 1 ? ` ${index + 1}` : ''),
          image: objectUrl,
          price: jewelDetails.price,
          weight: jewelDetails.weight,
          karat: jewelDetails.karat,
          category: jewelDetails.category,
          description: jewelDetails.description
        };
      });

      onUpload(newJewels);
      setUploading(false);
      onClose();

      showAlert(`Successfully uploaded ${selectedFiles.length} jewel${selectedFiles.length > 1 ? 's' : ''}!`, "success");
    }, 1500);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.Upload />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Upload New Jewel</h2>
              <p className="text-sm text-gray-600">Image size must be 250×350 pixels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <Icons.Close />
          </button>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <Icons.Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag & drop images or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">
              Required size: <span className="font-bold">250px × 350px</span>
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Select Images
            </button>
          </div>

          {/* Size Errors */}
          {sizeErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icons.Alert className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">Incorrect Image Sizes</h4>
                  <p className="text-sm text-red-600 mt-1">
                    The following images do not match the required size (250×350 pixels):
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sizeErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        • {error.name} - {error.width}×{error.height}px
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">
                Selected Images ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Icons.Close className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jewel Details Form */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Jewel Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jewel Name *
                </label>
                <input
                  type="text"
                  value={jewelDetails.name}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Diamond Ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="text"
                  value={jewelDetails.price}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., $5,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight *
                </label>
                <input
                  type="text"
                  value={jewelDetails.weight}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 15g"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Karat Type
                </label>
                <select
                  value={jewelDetails.karat}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, karat: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="14K Gold">14K Gold</option>
                  <option value="18K Gold">18K Gold</option>
                  <option value="22K Gold">22K Gold</option>
                  <option value="24K Gold">24K Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Sterling Silver">Sterling Silver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={jewelDetails.category}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Necklace">Necklace</option>
                  <option value="Ring">Ring</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Bracelet">Bracelet</option>
                  <option value="Pendant">Pendant</option>
                  <option value="Bangle">Bangle</option>
                  <option value="Brooch">Brooch</option>
                  <option value="Anklet">Anklet</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={jewelDetails.description}
                  onChange={(e) => setJewelDetails(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Describe the jewel..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Icons.Upload />
                  Upload Jewel{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Jewel Card Component
const JewelCard = ({ jewel, onDelete, isAdmin }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Jewel Image */}
      <div className="relative aspect-[250/350] overflow-hidden">
        <img
          src={jewel.image}
          alt={jewel.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        {isAdmin && (
          <button
            onClick={() => onDelete(jewel.id)}
            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
          >
            <Icons.Trash className="h-4 w-4" />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {jewel.category}
          </span>
        </div>
      </div>

      {/* Jewel Details */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{jewel.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{jewel.description}</p>

        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.Price className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-bold text-green-600">{jewel.price}</p>
            </div>
          </div>

          {/* Weight */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.Weight className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium text-gray-800">{jewel.weight}</p>
            </div>
          </div>

          {/* Karat */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.Gold className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Karat Type</p>
              <p className="font-medium text-gray-800">{jewel.karat}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navbar Component
const Navbar = ({ isAdmin, onLogout, onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Icons.Diamond className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-800 hidden sm:block">LuxeJewels</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="/" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg font-medium">
              Home
            </a>
            <a href="/jewels" className="text-purple-600 bg-purple-50 px-3 py-2 rounded-lg font-medium">
              Gallery
            </a>
            <a href="/contact" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg font-medium">
              Contact
            </a>

            {/* Admin Button */}
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Admin Mode
                </span>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <Icons.Admin />
                Admin Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Icons.Menu />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3">
          <div className="space-y-2">
            <a href="/" className="block text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg font-medium">
              Home
            </a>
            <a href="/jewels" className="block text-purple-600 bg-purple-50 px-3 py-2 rounded-lg font-medium">
              Gallery
            </a>
            <a href="/contact" className="block text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg font-medium">
              Contact
            </a>

            {isAdmin ? (
              <div className="pt-2 space-y-2">
                <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                  Admin Mode Active
                </div>
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout Admin
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <Icons.Admin />
                Admin Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Main Component
export default function JewelsGalleryPage() {
  const [jewels, setJewels] = useState(initialJewels);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  // Filter jewels by category
  const categories = ['All', 'Necklace', 'Ring', 'Earrings', 'Bracelet', 'Pendant', 'Bangle'];

  const filteredJewels = jewels.filter(jewel =>
    categoryFilter === 'All' || jewel.category === categoryFilter
  );

  // Sort jewels
  const sortedJewels = [...filteredJewels].sort((a, b) => {
    if (sortBy === 'price-low') {
      return parseFloat(a.price.replace(/[^0-9.-]+/g, "")) - parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
    }
    if (sortBy === 'price-high') {
      return parseFloat(b.price.replace(/[^0-9.-]+/g, "")) - parseFloat(a.price.replace(/[^0-9.-]+/g, ""));
    }
    if (sortBy === 'weight') {
      return parseFloat(a.weight) - parseFloat(b.weight);
    }
    return 0;
  });

  // Handle jewel upload
  const handleJewelUpload = (newJewels) => {
    setJewels(prev => [...newJewels, ...prev]);
  };

  // Handle jewel deletion
  const handleJewelDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this jewel?')) {
      setJewels(prev => prev.filter(jewel => jewel.id !== id));
    }
  };

  // Inline Styles
  const pageStyles = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    .aspect-\\[250\\/350\\] {
      aspect-ratio: 250 / 350;
    }
    
    /* Smooth transitions */
    * {
      transition: all 0.3s ease;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 5px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 5px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #68408f 100%);
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <Navbar
        isAdmin={isAdmin}
        onLogout={() => setIsAdmin(false)}
        onLoginClick={() => setShowAdminLogin(true)}
      />

      <main className="min-h-screen pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-purple-800 via-purple-700 to-pink-700 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Luxurious Jewel Collection
            </h1>
            <p className="text-lg md:text-xl text-purple-100 max-w-3xl mx-auto mb-8">
              Discover our exquisite collection of handcrafted jewels. Each piece is meticulously designed with precision and passion.
            </p>

            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
              >
                <Icons.Upload />
                Upload New Jewel
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border-b border-gray-200 py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Jewel Gallery
                  <span className="text-sm text-gray-500 ml-2">({jewels.length} items)</span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setCategoryFilter(category)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${categoryFilter === category
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="default">Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="weight">Weight</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jewel Gallery */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {sortedJewels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedJewels.map(jewel => (
                <JewelCard
                  key={jewel.id}
                  jewel={jewel}
                  onDelete={handleJewelDelete}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex p-6 bg-gray-100 rounded-full mb-6">
                <Icons.Diamond className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Jewels Found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                No jewels match your selected filters. Try changing the category or check back later.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setSortBy('default');
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Admin Info Banner */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Icons.Admin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Admin Mode Active</h3>
                    <p className="text-green-100">
                      You can upload new jewels and delete existing ones. Remember image size must be 250×350 pixels.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-white text-green-700 rounded-lg font-bold hover:bg-gray-100 transition whitespace-nowrap"
                >
                  <Icons.Upload className="inline mr-2" />
                  Upload New
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Size Guide */}
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Image Size Guide</h3>
                <p className="text-blue-100 mb-3">
                  For best display quality, all jewel images should be exactly 250 pixels wide and 350 pixels tall.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icons.Check className="h-5 w-5 text-green-300" />
                    <span>Perfect for gallery display</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.Check className="h-5 w-5 text-green-300" />
                    <span>Maintains aspect ratio</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">250 × 350</div>
                  <div className="text-sm text-blue-100">Width × Height (pixels)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Icons.Diamond className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl">LuxeJewels</h3>
                <p className="text-gray-400 text-sm">Premium Jewelry Collection</p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © {new Date().getFullYear()} LuxeJewels. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Demo Admin Password: <span className="font-mono">admin123</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin
          onLogin={() => setIsAdmin(true)}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ImageUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleJewelUpload}
        />
      )}
    </>
  );
}