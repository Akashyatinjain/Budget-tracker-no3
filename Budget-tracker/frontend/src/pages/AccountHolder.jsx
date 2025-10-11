import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaBell, 
  FaShieldAlt,
  FaPalette, 
  FaDownload, 
  FaCreditCard, 
  FaRobot, 
  FaShareAlt, 
  FaCamera, 
  FaSave, 
  FaTimes,
  FaArrowLeft 
} from 'react-icons/fa';
import { MdCurrencyExchange, MdAnalytics } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const AccountHolderPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'John Dice',
    email: 'john.dice@example.com',
    phone: '+1 (555) 123-4567',
    currency: 'USD',
    membership: 'Premium',
    joinDate: 'January 2024'
  });

  const [preferences, setPreferences] = useState({
    budgetAlerts: true,
    subscriptionReminders: true,
    monthlyReports: true,
    expenseCategorization: true,
    darkMode: true
  });

  const [formData, setFormData] = useState({ ...userData });

  useEffect(() => {
    // Fetch user data from API
    const fetchUserData = async () => {
      // Simulated API call
      const userInfo = {
        name: 'John Dice',
        email: 'john.dice@example.com',
        phone: '+1 (555) 123-4567',
        currency: 'USD',
        membership: 'Premium',
        joinDate: 'January 2024'
      };
      setUserData(userInfo);
      setFormData(userInfo);
    };
    
    fetchUserData();
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashBoard'); // Adjust the path based on your routing
  };

  const handleSave = async () => {
    try {
      // Simulate API call to update user data
      console.log('Saving user data:', formData);
      setUserData(formData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (preference, value) => {
    setPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
  };

  const exportData = (format) => {
    console.log(`Exporting data in ${format} format`);
    // Implement export functionality
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser className="text-sm" /> },
    { id: 'preferences', label: 'Preferences', icon: <FaPalette className="text-sm" /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell className="text-sm" /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt className="text-sm" /> },
    { id: 'export', label: 'Data Export', icon: <FaDownload className="text-sm" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 mb-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <FaArrowLeft className="text-sm" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Manage your profile, preferences, and account security</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              {/* User Profile Summary */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FaUser className="text-2xl text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{userData.name}</h3>
                <p className="text-gray-400 text-sm">{userData.membership} Member</p>
                <p className="text-gray-500 text-xs mt-1">Joined {userData.joinDate}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <FaSave />
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <FaTimes />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-300 mb-2">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{userData.name}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{userData.email}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white">{userData.phone}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-300 mb-2">Preferred Currency</label>
                        {isEditing ? (
                          <select
                            value={formData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="INR">INR - Indian Rupee</option>
                          </select>
                        ) : (
                          <div className="bg-gray-700 rounded-lg px-4 py-3 text-white flex items-center gap-2">
                            <MdCurrencyExchange />
                            {userData.currency}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-750 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FaBell className="text-purple-400" />
                        Alert Preferences
                      </h3>
                      <div className="space-y-4">
                        {[
                          { id: 'budgetAlerts', label: 'Budget Limit Alerts', description: 'Get notified when spending reaches 80% of your budget' },
                          { id: 'subscriptionReminders', label: 'Subscription Renewals', description: 'Remind me before recurring payments are due' },
                          { id: 'monthlyReports', label: 'Monthly Reports', description: 'Send monthly expense summary reports' }
                        ].map(pref => (
                          <div key={pref.id} className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors">
                            <div>
                              <div className="text-white font-medium">{pref.label}</div>
                              <div className="text-gray-400 text-sm">{pref.description}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preferences[pref.id]}
                                onChange={(e) => handlePreferenceChange(pref.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-750 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FaRobot className="text-purple-400" />
                        AI Features
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors">
                          <div>
                            <div className="text-white font-medium">Smart Expense Categorization</div>
                            <div className="text-gray-400 text-sm">Automatically categorize expenses using AI</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.expenseCategorization}
                              onChange={(e) => handlePreferenceChange('expenseCategorization', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Export Tab */}
              {activeTab === 'export' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-6">Data Export</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                      { format: 'PDF', icon: <FaDownload />, color: 'from-red-500 to-pink-600' },
                      { format: 'Excel', icon: <MdAnalytics />, color: 'from-green-500 to-emerald-600' },
                      { format: 'CSV', icon: <FaDownload />, color: 'from-blue-500 to-cyan-600' }
                    ].map((item) => (
                      <div key={item.format} className="bg-gray-750 rounded-xl p-6 text-center border border-gray-700 hover:border-purple-500 transition-colors">
                        <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                          <div className="text-2xl text-white">{item.icon}</div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{item.format} Export</h3>
                        <p className="text-gray-400 text-sm mb-4">Download your data in {item.format} format</p>
                        <button
                          onClick={() => exportData(item.format)}
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                        >
                          Export {item.format}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-750 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Export Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3">
                        <div className="text-white">Include transaction history</div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <div className="text-white">Include budget data</div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
                      </div>
                      <div className="flex items-center justify-between p-3">
                        <div className="text-white">Include subscription details</div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add other tabs similarly... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHolderPage;