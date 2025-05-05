import { React, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from '../store/authStore';

import ChefItLogo from "../Images/ChefItLogo.png";
import UserManagement from "../components_admin/user_management";

const AdminPage = () => {
  const { isAdmin, user, logout } = useAuthStore();
  const [activePanel, setActivePanel] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const togglePanel = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };
  
  return (
    <div className="admin-container p-8 max-w-4xl mx-auto justify-center">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <img src={ChefItLogo} alt="ChefIt Logo" className="h-16 mr-4" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center">
          {user && (
            <div className="mr-4 text-gray-700 font-medium">
              {user.firstName.toUpperCase()} {user.lastName} 
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Management</h2>
        <p className="text-gray-600 mb-4">Welcome to the ChefIt administration panel. This area is restricted to authorized personnel only.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div 
            className={`p-4 border rounded-md cursor-pointer transition-all duration-200 ${
              activePanel === 'userManagement' 
                ? 'border-green-500 bg-green-50 shadow-md' 
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => togglePanel('userManagement')}
          >
            <div className="flex items-start">
              <div className={`p-2 mr-3 rounded-lg ${
                activePanel === 'userManagement' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-medium text-lg ${
                  activePanel === 'userManagement' ? 'text-green-700' : 'text-gray-800'
                }`}>
                  User Management
                </h3>
                <p className={`text-sm ${
                  activePanel === 'userManagement' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {activePanel === 'userManagement' && <UserManagement />}
    </div>
  );
};

export default AdminPage;
