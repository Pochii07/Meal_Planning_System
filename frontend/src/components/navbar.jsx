import React from "react";
import { Navbar, NavbarBrand, NavbarToggle } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ChefItLogo from "../Images/ChefItLogo.png"; 

export function NavbarCustom() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar fluid rounded className="mt-5 bg-transparent !bg-opacity-0">
      <NavbarBrand href="/" className="mr-10">
        <img src={ChefItLogo} className="mr-3 h-6 sm:h-9" alt="ChefIt" />
        <span className="self-center whitespace-nowrap text-xl font-semibold">ChefIt</span>
      </NavbarBrand>
      
      {/* Remove NavbarToggle */}
      
      <div className="flex md:order-2 items-center rounded-md shadow-xs vertical-align: middle -space-x-1 ml-10 ms-8" role="group">
        {isAuthenticated ? (
          <>
            <Link 
              to={user.role === 'nutritionist' ? "/NutritionistProfile" : "/GuestProfile"} 
              className="px-4 py-2 text-sm font-medium text-[#008000] hover:text-green-700 cursor-pointer transition-colors"
            >
              {user.firstName + ' ' + user.lastName}
            </Link>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-r-md rounded-l-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]"
            >
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
              <button className="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-r-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                Sign up
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Replace NavbarCollapse with a regular div */}
      <div className="flex items-center space-x-4 ml-10">
        <Link to="/" className="text-sm font-medium hover:text-[#008000]">Home</Link>
        
        {isAuthenticated ? (
          // Authenticated user links remain the same
          user.role === 'nutritionist' ? (
            // Nutritionist links
            <>
              <Link to="/nutritionist/dashboard" className="text-sm font-medium hover:text-[#008000]">Patients</Link>
              {/* <Link to="/nutritionist/meal-planner" className="text-sm font-medium hover:text-[#008000]">Meal Planner</Link>
              <Link to="/ViewPatients" className="text-sm font-medium hover:text-[#008000]">View Patients</Link> */}
            </>
          ) : (
            // Regular user links
            <>
              <Link to="/form" className="text-sm font-medium hover:text-[#008000]">Meal Plan</Link>
              <Link 
                to={user.role === 'guest' ? "/GuestMealTracker" : "/meal-tracker"} 
                className="text-sm font-medium hover:text-[#008000]">
                Meal Tracker
              </Link>
            </>
          )
        ) : (
          // Non-authenticated user links
          <>
            <Link to="/form" className="text-sm font-medium hover:text-[#008000]">Meal Plan</Link>
            <Link to="/GuestMealTracker" className="text-sm font-medium hover:text-[#008000]">Meal Tracker</Link>
          </>
        )}
        
        <Link to="#" className="text-sm font-medium hover:text-[#008000]">About Us</Link>
        <Link to="#" className="text-sm font-medium hover:text-[#008000]">Contact Us</Link>
      </div>
      
      {/* Add the green horizontal line */}
      <div>
        <hr
          style={{
            background: 'lime',
            color: 'lime',
            borderColor: 'lime',
            height: '3px',
          }}
        />
      </div>
    </Navbar>
  );
}