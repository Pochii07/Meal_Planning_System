import { Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle } from "flowbite-react";
import * as React from 'react';
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function NavbarCustom() {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar fluid rounded style={{ backgroundColor: '#FEFEFA' }} class="flex mt-5">
      <NavbarBrand href="/">
        <img src="./src/Images/ChefItLogo.png" className="mr-3 h-6 sm:h-9" alt="ChefIt" />
        <span className="self-center whitespace-nowrap text-xl font-semibold ">ChefIt</span>
      </NavbarBrand>

      <div class="flex md:order-2 items-center rounded-md shadow-xs vertical-align: middle -space-x-1 ml-10 ms-8" role="group">
        {isAuthenticated ? (
          <>
            <span class="px-4 py-2 text-sm font-medium text-[#008000]">
              {user.firstName}
            </span>
            <button 
              onClick={handleLogout}
              class="px-4 py-2 text-sm font-medium text-[#008000] bg-transparent border border-[#008000] rounded-lg hover:bg-[#008000] hover:text-[#FEFEFA] ml-2"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" class="px-4 py-2 text-sm font-medium text-[#008000] bg-transparent border border-[#008000] rounded-s-lg hover:bg-[#008000] hover:text-[#FEFEFA]">
              <Link to="/LogIn">Log In</Link>
            </button>
            <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-[#008000] border border-[#008000] rounded-e-lg hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out">
              <Link to="/SignUp">Sign Up</Link>
            </button>
          </>
        )}
        <NavbarToggle />
      </div>

      <NavbarCollapse>
        <NavbarLink href="#" active>
          Home
        </NavbarLink>
        <NavbarLink href="/" class="hover:text-[#008000]">Home</NavbarLink>
        <NavbarLink href="/form" class="hover:text-[#008000]">Meal Plan</NavbarLink>
        <NavbarLink href="/meal-tracker" class="hover:text-[#008000]">Meal Tracker</NavbarLink>
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
