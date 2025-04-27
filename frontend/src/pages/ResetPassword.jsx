import React, { useEffect, useState } from "react";
import cooking from "../Images/cooking.png";
import TextField from "@mui/material/TextField";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";

import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams } from "react-router-dom";

const Password = ({
  label,
  password,
  setPassword,
  showPassword,
  handleShowPassword,
}) => {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(" ");

  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length < 8) {
      setError(true);
      setHelperText("Password must be at least 8 characters long");
    } else if (!/[a-z]/.test(value)) {
      setError(true);
      setHelperText("Password must have at least one lowercase letter");
    } else if (!/[A-Z]/.test(value)) {
      setError(true);
      setHelperText("Password must have at least one uppercase letter");
    } else if (!/[0-9]/.test(value)) {
      setError(true);
      setHelperText("Password must have at least one digit");
    } else if (!/[\W_]/.test(value)) {
      setError(true);
      setHelperText("Password must have at least one special character");
    } else {
      setError(false);
      setHelperText(" ");
    }
  };

  return (
    <TextField
      label={label}
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: error ? "red" : "gray" },
          "&:hover fieldset": { borderColor: error ? "red" : "#008000" },
          "&.Mui-focused fieldset": {
            borderColor: error ? "red" : "#008000 !important",
          },
        },
        "& .MuiInputLabel-root": { color: "gray" },
        "& .MuiInputLabel-root.Mui-focused": {
          color: error ? "red" : "#008000 !important",
        },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleShowPassword}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const ConfirmPassword = ({
  label,
  password,
  onChange,
  showConfirmPassword,
  handleShowConfirmPassword,
}) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(
    <>
      <br />
      <br />
    </>
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    onChange(e);

    // Check if confirm password matches the password
    if (value !== password) {
      setError(true);
      setHelperText(
        <>
          Password do not match
          <br />
          <br />
        </>
      );
    } else {
      setError(false);
      setHelperText(
        <>
          <br />
          <br />
        </>
      );
    }
  };

  return (
    <TextField
      label={label}
      type={showConfirmPassword ? "text" : "password"}
      value={confirmPassword}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: error ? "red" : "gray" },
          "&:hover fieldset": { borderColor: error ? "red" : "#008000" },
          "&.Mui-focused fieldset": {
            borderColor: error ? "red" : "#008000 !important",
          },
        },
        "& .MuiInputLabel-root": { color: "gray" },
        "& .MuiInputLabel-root.Mui-focused": {
          color: error ? "red" : "#008000 !important",
        },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleShowConfirmPassword}
            >
              {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const ResetPassword = () => {
  const { resetpassword, isLoading, checkPasswordResetToken } = useAuthStore();
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStatus, setDialogStatus] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const header = "Reset Password";
  const subHeader = "Enter your new password.";

  useEffect(() => {
    const validateToken = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }
        
        // add token validation API call
        const isValid = await checkPasswordResetToken(token);
        if (!isValid) {
          setTokenError("Invalid or expired password reset link");
          setTimeout(() => navigate('/login'), 10000);
        }
        setTokenValid(true);
      } catch (error) {
        setTokenError(error.message || "Invalid reset link. Please request a new password reset link.");
        console.error("Token validation failed:", error.message || error);
        setTimeout(() => navigate('/login'), 3000);  // Reduced from 10s to 3s
      }
    };
    validateToken();
  }, [token, navigate])

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (event) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    event.preventDefault();

    // if (!password || !confirmPassword) {
    //   setDialogStatus("error");
    //   setDialogMessage("Please fill in both password fields.");
    //   setShowDialog(true);
    //   return;
    // }

    // if (!passwordRegex.test(password)) {
    //   setDialogStatus("error");
    //   setDialogMessage("Password does not meet security requirements. It needs at least 8 characters, one uppercase, one lowercase, one number, and one special character.");
    //   setShowDialog(true);
    //   return;
    // }

    // if (password !== confirmPassword) {
    //   setDialogStatus("error");
    //   setDialogMessage("Passwords do not match.");
    //   setShowDialog(true);
    //   return;
    // }

    try {
      const data = await resetpassword(token, password);

      setDialogStatus("success");
      setDialogMessage("Password reset successful!");
      setShowDialog(true);
      // navigate away after success
      setTimeout(() => navigate('/login'), 10000); // Example delay
    } catch (error) {
      console.error("Password reset failed:", error);
      setDialogStatus("error");
      setDialogMessage("Failed to reset password. Please try again.");
      setShowDialog(true);
    }
  };

  if (!tokenValid) {
    return (
      <div className="flex justify-center items-center">
        <div className="text-center p-8">
          {tokenError ? (
            <>
            <h1 className="text-red-500 text-2xl mb-4">{tokenError}</h1>
            <p className="text-gray-600">Redirecting to login page...</p>
            </>
          ) : (
            <p className="text-gray-600">Validating reset link...</p>
          )}
        </div>
      </div>
    )
  }

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
        <form noValidate onSubmit={handleSubmit} class="w-2/4">
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
                <td className="pt-2 px-4 w-1/2">
                  <Password
                    label="Password"
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    handleShowPassword={handleShowPassword}
                  />
                </td>
              </tr>
              <tr>
                <td className="pt-2 px-4 w-1/2">
                  <ConfirmPassword
                    label="Confirm Password"
                    password={password}
                    showConfirmPassword={showConfirmPassword}
                    handleShowConfirmPassword={handleShowConfirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </td>
              </tr>
              <tr></tr>
              <tr>
                {/*link to log-in button*/}
                <td className="pt-2 px-4 w-1/2 text-right" colSpan={2}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="contained"
                    className="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                    style={{ minWidth: "160px" }}
                    endIcon={<SendIcon />}
                  >
                    {isLoading ? "Loading..." : "Change Password"}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
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
              maxWidth: "90%", // Added for better responsiveness
            }}
          >
            <h3 style={{ color: dialogStatus === "success" ? "green" : "red", marginTop: 0 }}> {/* Added marginTop */}
              {dialogStatus === "success" ? "🎉 Success!" : "❌ Error"}
            </h3>
            <p style={{ wordWrap: "break-word" }}>{dialogMessage}</p> {/* Use dynamic message and allow wrapping */}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {/* Keep the "Back" button for errors */}
              {dialogStatus === "error" && (
                <button
                  onClick={() => {
                    setShowDialog(false); // Just close the dialog
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545", // Red color for error button
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
              )}
              {/* Change button text and action for success */}
              {dialogStatus === "success" && (
                <button
                  onClick={() => {
                    setShowDialog(false);
                    navigate("/login"); // Navigate to login page on success
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745", // Green color for success button
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

export default ResetPassword;
