import React, { useState } from 'react';

const ManageRoles = ({ setActiveSection }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Placeholder data - will be replaced with actual API calls later
  const mockUsers = [
    { id: 1, username: 'john_doe', role: 'nutritionist', email: 'john@example.com' },
    { id: 2, username: 'jane_smith', role: 'admin', email: 'jane@example.com' },
  ];

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    setError('');
    try {
      // Placeholder for API call
      console.log(`Changing role for user ${userId} to ${newRole}`);
      setSuccess('Role updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage User Roles</h2>
        <button 
            onClick={() => setActiveSection(null)}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
        >
            ← Back
        </button>
      </div>
      <p className="text-gray-600 mb-6">Modify current registered users in the system.</p>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username/Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={loading}
                  >
                    <option value="admin">Admin</option>
                    <option value="nutritionist">Nutritionist</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRoles;