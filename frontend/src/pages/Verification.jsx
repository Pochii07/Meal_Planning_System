import React, { useState, useRef, useEffect } from "react";
import { Button, CircularProgress } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const verifyLogin = () => {
  const [verificationData, setVerificationData] = useState(null);
  const { verify_login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStatus, setDialogStatus] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // load verification data from sessionStorage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('pendingVerification');
    
    if (!storedData) {
      navigate('/signup'); // redirect if no verification data exists
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedData);
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
      // reset form on successful submission
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleNavigateToLogin = () => {
    sessionStorage.removeItem('pendingVerification');
    setShowDialog(false);
    navigate('/LogIn', { state: { verified: true } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const code = otp.join("");

    try {
      const response = await verify_login(code);
      
      const isValid = response.success;
      setDialogStatus(isValid ? "success" : "error");
      
      if (isValid) {
        sessionStorage.removeItem('pendingVerification');
      } else {
        setError(response.message || "Invalid verification code");
      }
    } catch (e) {
      setDialogStatus("error");
      setError(e.response?.data?.message || "Verification failed");
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
      minHeight: "100vh",
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "12px", // Slightly larger radius
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Softer shadow
        maxWidth: "450px", // Slightly wider
        width: "100%",
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Section */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{ color: "#333", marginBottom: "8px", fontSize: "24px" }}>Account Verification</h1>
            <div style={{ 
              color: "#ED2939", 
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#ED2939" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Do not leave the page!</span>
            </div>
          </div>
  
          {/* Email Info Section */}
          <div style={{ 
            backgroundColor: "#f8f9fa",
            padding: "16px",
            borderRadius: "8px",
            borderLeft: "4px solid #007bff"
          }}>
            <h2 style={{ color: "#333", marginBottom: "8px", fontSize: "16px" }}>Verification Code Sent</h2>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.5" }}>
              We've sent a 6-digit code to <strong>{verificationData.email}</strong>. 
              Please check your inbox and spam folder.
            </p>
            <p style={{ 
              color: "#666", 
              fontSize: "13px", 
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#666" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Expires: {new Date(verificationData.expiresAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
  
          {/* OTP Input Section */}
          <div>
            <label style={{
              display: "block",
              color: "#555",
              fontSize: "14px",
              marginBottom: "8px"
            }}>
              Enter 6-digit verification code
            </label>
            <div style={{ 
              display: "flex", 
              gap: "10px",
              justifyContent: "center",
              marginBottom: "8px"
            }}>
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
                    width: "44px",
                    height: "44px",
                    textAlign: "center",
                    fontSize: "20px",
                    borderRadius: "6px",
                    border: error ? "1px solid #dc3545" : "1px solid #ddd",
                    outline: "none",
                    transition: "all 0.2s",
                    backgroundColor: error ? "#fff5f5" : "#fff"
                  }}
                />
              ))}
            </div>
            {error && (
              <p style={{ 
                color: "#dc3545",
                fontSize: "13px",
                textAlign: "center",
                marginTop: "8px"
              }}>
                {error}
              </p>
            )}
          </div>
  
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || otp.some((digit) => digit === "")}
            variant="contained"
            color={otp.every((digit) => digit !== "") ? "primary" : "inherit"}
            sx={{
              padding: "12px",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: otp.every((digit) => digit !== "") ? "#0069d9" : "#ccc"
              }
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Verifying...
              </>
            ) : (
              "Verify Account"
            )}
          </Button>
        </form>
      </div>
      
      {/* Success/Error Dialog - Enhanced */}
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
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "320px",
              maxWidth: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: dialogStatus === "success" ? "#28a745" : "#dc3545"
            }}>
              {dialogStatus === "success" ? "✓" : "✗"}
            </div>
            <h3 style={{ 
              color: dialogStatus === "success" ? "#28a745" : "#dc3545",
              marginBottom: "8px"
            }}>
              {dialogStatus === "success" ? "Verification Complete!" : "Verification Failed"}
            </h3>
            <p style={{ 
              color: "#555",
              marginBottom: "24px",
              fontSize: "15px"
            }}>
              {dialogStatus === "success" 
                ? "Your account has been successfully verified." 
                : "The verification code was incorrect. Please try again."}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={dialogStatus === "success" ? handleNavigateToLogin : handleCloseDialog}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  backgroundColor: dialogStatus === "success" ? "#28a745" : "#dc3545",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  minWidth: "120px",
                  transition: "all 0.2s",
                  "&:hover": {
                    opacity: 0.9
                  }
                }}
              >
                {dialogStatus === "success" ? "Continue" : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default verifyLogin;
