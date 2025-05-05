import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const AddUsersSection = ({ selectedRole, setSelectedRole, username, setUsername, email, setEmail, firstName, setFirstName, lastName, setLastName, sex, setSex, password, setPassword, confirmPassword, setConfirmPassword, loading, error, setError, success, setSuccess, handleSubmit, setActiveSection}) => (
  <div className="bg-white p-6 rounded-lg w-full">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">Add New User</h2>
      <button 
        onClick={() => setActiveSection(null)}
        className="px-3 py-1 text-gray-600 hover:text-gray-800"
      >
        ← Back
      </button>
    </div>
    <p className="text-gray-600 mb-6">Add new users to the system and set their roles.</p>
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

    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      {/* Row 1: Email and Role - Aligned */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex flex-col w-full md:w-48">
           <label htmlFor="role" className="text-sm text-gray-600 pb-2.5 mb-1">Assign Role</label>
           <select
             id="role"
             name="role"
             value={selectedRole}
             onChange={(e) => setSelectedRole(e.target.value)}
             className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
           >
             <option value="admin">Admin</option>
             <option value="nutritionist">Nutritionist</option>
           </select>
        </div>
        <div className="flex flex-col w-full md:w-1/2">
          <label htmlFor={selectedRole === 'admin' ? 'username' : 'email'} className="text-sm text-gray-600 mb-1">
            {selectedRole === 'admin' ? 'Username' : 'Email'}
          </label>
          <input
            type={selectedRole === 'admin' ? 'text' : 'email'}
            id={selectedRole === 'admin' ? 'username' : 'email'}
            name={selectedRole === 'admin' ? 'username' : 'email'}
            value={selectedRole === 'admin' ? username : email}
            placeholder={selectedRole === 'admin' ? 'Enter admin username' : 'user@example.com'}
            className="border rounded px-3 py-1.5 text-sm w-64 placeholder-gray-400"
            onChange={(e) => selectedRole === 'admin' ? setUsername(e.target.value) : setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      {/* Conditional fields for Nutritionist */}
      {selectedRole === 'nutritionist' && (
        <>
          {/* Row for First Name, Last Name */}
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="flex flex-col w-full md:w-1/3">
              <label htmlFor="firstName" className="text-sm text-gray-600 mb-1">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
                required
              />
            </div>
            <div className="flex flex-col w-full md:w-1/3">
              <label htmlFor="lastName" className="text-sm text-gray-600 mb-1">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
                required
              />
            </div>
            <div className="flex flex-col w-full md:w-1/5">
              <label htmlFor="sex" className="text-sm text-gray-600 pb-2.5 mb-1">Sex</label>
              <select
                id="sex"
                name="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </>
      )}
      {/* Row 2: Passwords */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex flex-col w-full md:w-1/2">
          <label htmlFor="password" className="text-sm text-gray-600 mb-1">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter password"
            className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col w-full md:w-1/2">
          <label htmlFor="confirmPassword" className="text-sm text-gray-600 mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm password"
            className="border rounded px-3 py-1.5 text-sm w-full placeholder-gray-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>
      {/* Row 3: Button - Right Aligned */}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={loading}
          className={`${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-1.5 rounded transition text-sm`}
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  </div>
);
const UserManagement = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  
  const [activeSection, setActiveSection] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const adminSignup = useAuthStore(state => state.adminSignup);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
  
    // validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
  
    try {
      if (selectedRole === 'admin') {
        await adminSignup(username, password, selectedRole);
      } else if (selectedRole === 'nutritionist') {
        console.log('Sex value:', sex);
        await adminSignup(email, password, selectedRole, firstName, lastName, sex);
      } else {
        setError('Invalid role selected');
        setLoading(false);
        return
      }
      
      setSuccess(`${selectedRole === 'admin' ? 'Admin created successfully!' : 'Nutritionist created successfully! Verification code is sent to email.'} `);
      setTimeout(() => {
        setSuccess('');
      }, 5000);

      // reset form fields
      setUsername('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setSex('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const MainPanel = () => (
    <>
      <h2 className="text-xl font-semibold mb-4">User Management Panel</h2>
      <p className="text-gray-600 mb-4">Manage accounts for admin and nutritionists</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setActiveSection('addUsers')}
        >
          <h3 className="font-medium text-lg">Add Users</h3>
          <p className="text-gray-500">Create new user accounts</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      {activeSection === 'addUsers' ? (
        <AddUsersSection
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          username={username}
          setUsername={setUsername} 
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          sex={sex}
          setSex={setSex}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          handleSubmit={handleSubmit}
          setActiveSection={setActiveSection}
          loading={loading}
          error={error}
          setError={setError} 
          success={success}
          setSuccess={setSuccess}
        /> 
      ) : activeSection === 'manageRoles' ? (
        <ManageRoles 
          setActiveSection={setActiveSection} 
        />
      ) : (
        <MainPanel />
      )}
    </div>
  );
};

export default UserManagement;