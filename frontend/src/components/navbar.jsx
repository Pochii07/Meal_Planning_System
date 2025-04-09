import React from "react";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarLink } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ChefItLogo from "../Images/ChefItLogo.png"; 

export function NavbarCustom() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar fluid rounded style={{ backgroundColor: '#FEFEFA' }} class="flex mt-5">
      <NavbarBrand href="/" className="mr-10">
        <img src={ChefItLogo} className="mr-3 h-6 sm:h-9" alt="ChefIt" />
        <span className="self-center whitespace-nowrap text-xl font-semibold ">ChefIt</span>
      </NavbarBrand>

      <div class="flex md:order-2 items-center rounded-md shadow-xs vertical-align: middle -space-x-1 ml-10 ms-8" role="group">
        {isAuthenticated ? (
          <>
            <Link 
              to="/profile" 
              className="px-4 py-2 text-sm font-medium text-[#008000] hover:text-green-700 cursor-pointer transition-colors"
            >
              {user.firstName + ' ' + user.lastName}
            </Link>
            <button 
              onClick={handleLogout}
              class="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-r-md rounded-l-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/SignUp">
              <button class="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-l-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                Sign up
              </button>
            </Link>
            <Link to="/LogIn">
              <button class="px-4 py-2 text-sm font-medium text-[#008000] border border-[#008000] rounded-r-md transition duration-300 ease-in-out hover:bg-[#008000] hover:text-[#FEFEFA]">
                Log in
              </button>
            </Link>
          </>
        )}
      </div>

      <NavbarCollapse>
        {/* Home link is common for all */}
        <NavbarLink href="/" class="hover:text-[#008000]">Home</NavbarLink>
        
        {isAuthenticated ? (
          // Authenticated user links
          user.role === 'nutritionist' ? (
            // Nutritionist links
            <NavbarLink href="/nutritionist/dashboard" class="hover:text-[#008000]">Patients</NavbarLink>
          ) : (
            // Regular user or guest links
            <>
              <NavbarLink href="/form" class="hover:text-[#008000]">Meal Plan</NavbarLink>
              <NavbarLink 
                href={user.role === 'guest' ? "/GuestMealTracker" : "/meal-tracker"} 
                class="hover:text-[#008000]">
                Meal Tracker
              </NavbarLink>
            </>
          )
        ) : (
          // Non-authenticated user links
          <>
            <NavbarLink href="/form" class="hover:text-[#008000]">Meal Plan</NavbarLink>
            <NavbarLink href="/GuestMealTracker" class="hover:text-[#008000]">Meal Tracker</NavbarLink>
          </>
        )}
        
        <NavbarLink href="#" class="hover:text-[#008000]">About Us</NavbarLink>
        <NavbarLink href="#" class="hover:text-[#008000]">Contact Us</NavbarLink>
      </NavbarCollapse>
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
