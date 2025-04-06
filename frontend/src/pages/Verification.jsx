import React, { useState, useRef, useEffect } from "react";
import { Button } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const verifyLogin = () => {
  const [verificationData, setVerificationData] = useState(null);
  const { verify_login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStatus, setDialogStatus] = useState("");
  const inputRefs = useRef([]);

  // Load verification data from sessionStorage on mount
  useEffect(() => {
    console.log('Checking sessionStorage on mount...');
    const storedData = sessionStorage.getItem('pendingVerification');
    console.log('Raw stored data:', storedData);
    
    if (!storedData) {
      navigate('/signup'); // Redirect if no verification data exists
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedData);
      console.log('Parsed verification data:', parsedData);
      setVerificationData(parsedData);
    } catch (e) {
      console.error('Failed to parse stored data:', e);
      sessionStorage.removeItem('pendingVerification');
      navigate('/signup');
    }

    inputRefs.current[0]?.focus();
  }, [navigate]);

  const handleChange = (index, e) => {
    const value = e.target.value;

    // allow numbers or empty string
    if (/^$|^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // move focus to next input if value entered
      if (value !== "" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      // if current field is empty, move to previous field
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // clear current field whether it has value or not
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain");
    const pastedDigits = pasteData.replace(/\D/g, "").slice(0, 6).split("");

    if (pastedDigits.length === 6) {
      setOtp(pastedDigits);
      inputRefs.current[5]?.focus();
    } else {
      const newOtp = [...otp];
      pastedDigits.forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);
      const nextFocusIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };
 
  const handleCloseDialog = () => {
    setShowDialog(false);
    if (dialogStatus === "success") {
      // Reset form on successful submission
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleNavigateToLogin = () => {
    sessionStorage.removeItem('pendingVerification');
    setShowDialog(false);
    navigate('/login.jsx');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const code = otp.join("");

    try {
      const response = await verify_login(code);
      
      const isValid = response.success;
      setDialogStatus(isValid ? "success" : "error");
      
      if (isValid) {
        sessionStorage.removeItem('pendingVerification'); // Clear on success
      }
    } catch (e) {
      setDialogStatus("error");
    }
    setShowDialog(true);
  };

  // If no verification data yet, show loading
  if (!verificationData) {
    return <div>Loading verification data...</div>;
  }

  return (
    <div style={{ 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "relative"
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        maxWidth: "400px",
        width: "100%",
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1 style={{ color: "#333", marginBottom: "10px" }}>Account Verification</h1>
          <h1 style={{ color: "#ED2939", marginBottom: "10px", textAlign: 'center' }}>Do not leave the page!</h1>
          
          <h2 style={{ color: "#333"}}>Email Setup</h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            We have sent a verification code to <br/>{verificationData.email} 
          </p>
          
          <h2 style={{ color: "#333"}}>1. Go to your inbox</h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            Can't find the verification code? Check your spam folder.
          </p>
          
          <h2 style={{ color: "#333"}}>2. Enter the verification code</h2>
          <p style={{ color: "#555", fontSize: "14px" }}>
            The code will be valid until <br/>
            {new Date(verificationData.expiresAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
          
          {/* OTP Input Fields (keep your existing implementation) */}
          <div style={{ display: "flex", gap: "10px" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                ref={(el) => (inputRefs.current[index] = el)}
                style={{
                  width: "40px",
                  height: "40px",
                  textAlign: "center",
                  fontSize: "20px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            ))}
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || otp.some((digit) => digit === "")}
            variant="contained"
            color={otp.every((digit) => digit !== "") ? "primary" : "inherit"}
            sx={{
              padding: "10px 20px",
              borderRadius: "4px",
              backgroundColor: otp.every((digit) => digit !== "") ? "#007bff" : "#ccc",
              color: "white",
            }}
          >
            {isLoading ? "Loading..." : "Submit"}
          </Button>
        </form>
      </div>
      
      {/* Dialog Box (keep your existing implementation) */}
      {showDialog && (
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
            <h3 style={{ color: dialogStatus === "success" ? "green" : "red" }}>
              {dialogStatus === "success" ? "🎉 Success!" : "❌ Error"}
            </h3>
            <p>
              {dialogStatus === "success"
                ? "OTP verification successful!"
                : "Invalid OTP. Please try again."}
            </p>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {dialogStatus === "error" && (
                <button
                  onClick={handleCloseDialog}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Try Again
                </button>
              )}
              {dialogStatus === "success" && (
                <button
                  onClick={handleNavigateToLogin}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default verifyLogin;
