import React, { useState } from "react";
import cooking from '../Images/cooking.png'; 
import TextField from "@mui/material/TextField";
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';

import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const EmailInput = ({ label, onChange }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    onChange(e)

    const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
    setError(!regex.test(value) && value.length > 0);
  };

  return (
    <TextField
      label={label}
      variant="outlined"
      fullWidth
      value={email}
      onChange={handleChange}
      error={error}
      helperText={error ? "Invalid email format" : " "}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: error ? "red" : "gray" },
          "&:hover fieldset": { borderColor: error ? "red" : "#008000" },
          "&.Mui-focused fieldset": { borderColor: error ? "red" : "#008000 !important" },
        },
        "& .MuiInputLabel-root": { color: "gray" },
        "& .MuiInputLabel-root.Mui-focused": { color: error ? "red" : "#008000 !important" },
      }}
    />
  );
};

const ForgotPassword = () => {
  const { forgotpassword, isLoading, } = useAuthStore();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const header = "Forgot Password"
  const subHeader = "Enter your email and we'll send you a link to get back into your account."
  const successMessage = "Your request has been received for the email address you provided. We've sent a password reset link to your inbox."

  const handleSubmit = async (event) => {
    const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
    event.preventDefault();

    if (!regex.test(email)) {
      alert("Please enter valid email address.");
      return;
    }

    try {
      const data = await forgotpassword(email);
  
      if (data) {
        setShowSuccessDialog(true);
      } else {
        // dialog for try again
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div
      className="flex flex-col mt-12"
      style={{
        backgroundImage: `url(${cooking})`,
        backgroundPosition: "88% 20%", 
        backgroundRepeat: "no-repeat", 
        height: "10%", 
        backgroundSize: "10%",
      }}
    >
      <div className="flex justify-center items-center">
        <form 
          noValidate
          onSubmit={handleSubmit}
          className="w-2/4"
        >
          <table className="border-collapse border border-transparent  w-1/4 md:w-4/5">
            <tbody>
              <tr>
                <td className="border border-transparent p-4" colSpan="2">
                  <p className="text-[60px] font-semibold text-left tracking-tighter">
                    {header}
                  </p>
                  <p className="text-[15px] text-left text-[#008000] mb-8">
                    {subHeader}
                  </p>
                </td>
              </tr>
              <tr>
                <td className="px-4 w-1/2" colSpan={2}>
                  <EmailInput 
                    label="Email Address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <a className="mt-9 mx-5 font-medium hover:text-[#008000]" href="/LogIn">
                  Back to Log In
                </a>
              </tr>
              <tr>
                <td className="pt-2 px-4 w-1/2 text-right" colSpan={2}>
                  <Button
                    type="submit"
                    disabled={isLoading} 
                    variant="contained" 
                    className="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                    style={{ minWidth: '160px' }}
                    endIcon={<SendIcon />}
                  >
                    {isLoading ? "Loading..." : "Send login link"}      
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
      
      {showSuccessDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "300px",
            }}
          >
            <p>
              {successMessage}
            </p>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  // navigate("/");
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ForgotPassword;
