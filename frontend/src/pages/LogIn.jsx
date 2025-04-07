import React, { useState, useEffect } from "react";
import cooking from '../Images/cooking.png'; 
import TextField from "@mui/material/TextField";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import LogInIMG from '../Images/LogInIMG.jpg'; 

import { useAuthStore } from "../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";

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

const Password = ({ label, password, setPassword, showPassword, handleShowPassword }) => {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(" ");

  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (!value) {
      setError(true);
      setHelperText("Password is required");
    } else {
      setError(false);
      setHelperText(" ");
    } 
  };

  return (
    <TextField
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: error ? "red" : "gray" },
          "&:hover fieldset": { borderColor: error ? "red" : "#008000" },
          "&.Mui-focused fieldset": { borderColor: error ? "red" : "#008000 !important" },
        },
        "& .MuiInputLabel-root": { color: "gray" },
        "& .MuiInputLabel-root.Mui-focused": { color: error ? "red" : "#008000 !important" },
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

export function LogIn() {
  const { login, checkAuth , isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("All fields are required!");
      return;
    }

    try {
      const { 
        success, 
        requiresVerification, 
        verificationToken, 
        email: userEmail,
        expiresAt
      } = await login(email, password);
      
      if (requiresVerification) {
        sessionStorage.setItem('pendingVerification', JSON.stringify({
            email: userEmail,
            token: verificationToken,
            expiresAt: expiresAt
        }));
        
        navigate('/verify_login', { 
            state: { 
                email: userEmail,
                fromLogin: true 
            } 
        });
        return;
      }

      if (success) {
          await checkAuth(); // verify auth state is synchronized
          navigate('/', { replace: true }); // replace history entry
      }
    } catch (error) {
        console.error("Login failed:", error);
        setError(error.message || "Login failed. Please try again.");
        sessionStorage.removeItem('pendingVerification');
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
      <div className="w-1/2">
        <img src={LogInIMG} alt="LogInIMG" style={{ width: "80%", height: "80% " }} />
        </div> 
        <form 
          noValidate
          onSubmit={handleSubmit}
          class="w-2/4"
        >
          <table className="border-collapse border border-transparent  w-1/4 md:w-4/5">
            <tbody>
              <tr>
                <td className="border border-transparent p-4" colSpan="2">
                  <p className="text-[110px] font-semibold text-left tracking-tighter">
                    Log In
                  </p>
                  <p className="text-[15px] text-left text-[#008000] mb-8">
                    Get back on track!
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
              {/* link to forgot password */}
                <a className="mt-9 mx-5 font-medium hover:text-[#008000]" href="/ForgotPassword">
                  Forgot Password? 
                </a>
              </tr>
              <tr>
              {/*link to log-in button*/}
                <td className="pt-2 px-4 w-1/2 text-right" colSpan={2}>
                  <Button
                    type="submit"
                    disabled={isLoading} 
                    variant="contained" 
                    class="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                    style={{ minWidth: '160px' }}
                    endIcon={<SendIcon />}
                  >
                    {isLoading ? "Loading..." : "LOG IN"}      
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

export default LogIn;