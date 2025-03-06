import React, { useState } from "react";
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
  const { resetpassword, isLoading } = useAuthStore();
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, checkPassword] = useState("");
  const [dialogStatus, setShowDialog] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const header = "Reset Password";
  const subHeader = "Enter your new password.";
  const successMessage = "Password changed successfully.";

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
    //   alert("All fields are required!");
    //   return;
    // }

    // if (!passwordRegex.test(password)) {
    //   alert("Password does not meet security requirements!");
    //   return;
    // }

    // if (password !== confirmPassword) {
    //   alert("Passwords do not match!");
    //   return;
    // }

    try {
      const data = await resetpassword(token, password);

      if (!data === false) {
        setShowDialog(true);
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
                    setPassword={setPassword}
                    showConfirmPassword={showConfirmPassword}
                    handleShowConfirmPassword={handleShowConfirmPassword}
                    onChange={(event) => checkPassword(event.target.value)}
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
                    class="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
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
    </div>
  );
};

export default ResetPassword;
