import React, { useState } from "react";
import { Navbar, NavbarBrand } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ChefItLogo from "../Images/ChefItLogo.png"; 
import { FaBars, FaTimes } from "react-icons/fa";

export function NavbarCustom() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-[#f5fffa]">
      <Navbar fluid rounded className="mt-5 !bg-[#f5fffa] max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          <NavbarBrand href="/" className="mr-10">
            <img src={ChefItLogo} className="mr-3 h-6 sm:h-9" alt="ChefIt" />
            <span className="self-center whitespace-nowrap text-xl font-semibold">ChefIt</span>
          </NavbarBrand>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-sm font-medium hover:text-[#008000]">Home</Link>
              
              {isAuthenticated ? (
                user.role === 'nutritionist' ? (
                  <Link to="/nutritionist/dashboard" className="text-sm font-medium hover:text-[#008000]">Patients</Link>
                ) : (
                  <>
                    <Link to={user.role === 'guest' ? "/patient-access" : "/patient-access"} className="text-sm font-medium hover:text-[#008000]">Meal Tracker</Link>
                    <Link to="/AboutUs" className="text-sm font-medium hover:text-[#008000]">About Us</Link>
                    <Link to="/ContactUs" className="text-sm font-medium hover:text-[#008000]">Contact Us</Link>
                  </>
                )
              ) : (
                <>
                  <Link to="/patient-access" className="text-sm font-medium hover:text-[#008000]">Meal Tracker</Link>
                </>
              )}
              
              <Link to="/AboutUs" className="text-sm font-medium hover:text-[#008000]">About Us</Link>
              <Link to="/ContactUs" className="text-sm font-medium hover:text-[#008000]">Contact Us</Link>
            </div>

            <div className="flex items-center rounded-md shadow-xs -space-x-1 ml-6" role="group">
              {isAuthenticated ? (
                <>
                  <Link to={user.role === 'nutritionist' ? "#" : "#"} className="px-4 py-2 text-sm font-medium text-[#008000] hover:text-green-700 cursor-pointer transition-colors">
                    {user.firstName + ' ' + user.lastName}
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/LogIn">
                    <button className="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-l-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                      Log in
                    </button>
                  </Link>
                  <Link to="/SignUp">
                    <button className="px-4 py-2 ml-1 text-sm font-medium text-[#008000] border border-[#008000] rounded-r-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                      Sign up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Home</Link>
              {isAuthenticated ? (
                user.role === 'nutritionist' ? (
                  <Link to="/nutritionist/dashboard" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Patients</Link>
                ) : (
                  <>
                    <Link to="/form" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Meal Plan</Link>
                    <Link to={user.role === 'guest' ? "/GuestMealTracker" : "/meal-tracker"} className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Meal Tracker</Link>
                  </>
                )
              ) : (
                <>
                  <Link to="/form" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Meal Plan</Link>
                  <Link to="/GuestMealTracker" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Meal Tracker</Link>
                </>
              )}
              <Link to="/AboutUs" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>About Us</Link>
              <Link to="/ContactUs" className="block px-3 py-2 text-base font-medium hover:text-[#008000]" onClick={() => setIsOpen(false)}>Contact Us</Link>
            </div>

            <div className="pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-2">
                  <Link to={user.role === 'nutritionist' ? "#" : "#"} className="block px-3 py-2 text-base font-medium text-[#008000] hover:text-green-700" onClick={() => setIsOpen(false)}>
                    {user.firstName + ' ' + user.lastName}
                  </Link>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full px-3 py-2 text-base font-medium text-[#008000] border border-[#008000] rounded-md hover:bg-[#008000] hover:text-[#FEFEFA]">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/LogIn" className="block px-3 py-2 text-base font-medium text-center text-[#008000] border border-[#008000] rounded-md hover:bg-[#008000] hover:text-[#FEFEFA]" onClick={() => setIsOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/SignUp" className="block px-3 py-2 text-base font-medium text-center text-[#008000] border border-[#008000] rounded-md hover:bg-[#008000] hover:text-[#FEFEFA]" onClick={() => setIsOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Navbar>
      
      {/* Green horizontal line */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-t-2 border-[#008000]" />
      </div>
    </div>
  );
}