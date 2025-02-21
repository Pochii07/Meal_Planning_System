import React, { useState } from "react";
import dayjs from 'dayjs';
import cooking from '../Images/cooking.png'; 
import TextField from "@mui/material/TextField";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import SignUpIMG from '../Images/SignUpIMG.jpg'; 
import { Link } from "react-router-dom";

/**
 *  imports for authentication
*/

import { useAuthStore } from "../store/authStore"; 

{/* TEXT FIELD for no special characters */}
const TextFieldNoNum = ({ label, width = "100%" }) => {
  return (
    <TextField
      required
      label={label}
      variant="outlined"
      fullWidth
      onChange={(e) => {
        const regex = /^[A-Za-z\s]*$/;
        if (!regex.test(e.target.value)) {
          e.target.value = e.target.value.slice(0, -1);
        }
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "gray" },
          "&:hover fieldset": { borderColor: "#008000" },
          "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
        },
        "& .MuiInputLabel-root": { color: "gray" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
      }}
    />
  );
};

const EmailInput = ({ label }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Email validation regex
    const regex =/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$ /gim;
    setError(!regex.test(value) && value.length > 0);
  };

  return (
    <TextField
      required
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

{/* PASSWORD VALIDATION */}
const Password = ({ label, password, setPassword, showPassword, handleShowPassword }) => {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(<><br /><br /></>);

  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Password validation regex
    const regex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?!.*\s).{8,50}$/;

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
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={handleChange}
      error={error}
      helperText={helperText || " "}
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

{/*CONFIRM PW*/}
const ConfirmPassword = ({ password, setPassword, label, showConfirmPassword, handleShowConfirmPassword }) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(<><br /><br /></>);

  const handleChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Check if confirm password matches the password
    if (value !== password) {
      setError(true);
      setHelperText(<>Password do not match<br /><br /></>);
    } else {
      setError(false);
      setHelperText(<><br /><br /></>);
    }
  };

  return (
    
    <TextField
      label={label}
      type={showConfirmPassword ? 'text' : 'password'}
      value={confirmPassword}
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

const SignUp = () => {
  const [sex, setSex] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    setSex(event.target.value);
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Form submitted");
  };
  
  return (
    <div
      className="flex flex-col mt-12"
      style={{
        backgroundImage: `url(${cooking})`,
        backgroundPosition: "93% 17%", 
        backgroundRepeat: "no-repeat", 
        height: "10%", 
        backgroundSize: "10%",
      }}
    >
      <div className="flex justify-center items-center">
        <div className="w-1/2">
          <img src={SignUpIMG} alt="SignUpIMG" style={{ width: "80%", height: "80% " }} />
        </div>  
        
        {/* Form starts here */}
        <form 
          novalidate
          onSubmit={handleSubmit} 
          className="border-collapse border border-transparent w-3/4 md:w-2/5"
        >
          <table>
            <tbody>
              <tr>
                <td className="border border-transparent p-4" colSpan="2">
                  <p className="text-[15px] text-right">
                    Already a member?{" "}
                    <a className="font-semibold hover:text-[#008000]" href="/LogIn">
                      Log In
                    </a>
                  </p>
                  <p className="text-[110px] font-semibold text-left tracking-tighter">
                    Sign Up
                  </p>
                  <p className="text-[15px] text-left text-[#008000] mb-8">
                    Your healthy journey starts here.
                  </p>
                </td>
              </tr>
              <tr>
                <td className="pt-4 px-3 w-1/2">
                  <TextFieldNoNum 
                    label="First Name" 
                  />
                </td>
                <td className="pt-4 px-3 w-1/2">
                  <TextFieldNoNum label="Last Name" />
                </td>
              </tr>
              <tr>
                <td className="p-4 w-1/2">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      required
                      label="Birth Date"
                      width="100%"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "gray" },
                          "&:hover fieldset": { borderColor: "#008000" },
                          "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
                        },
                        "& .MuiInputLabel-root": { color: "gray" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
                      }}
                    />
                  </LocalizationProvider>
                </td>
                <td className="px-3 w-1/2">
                  <Box width="100%">
                    <FormControl required fullWidth>
                      <InputLabel id="demo-simple-select-label">Sex</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={sex}
                        label="Sex"
                        onChange={handleChange}
                      >
                        <MenuItem value={"Male"}>Male</MenuItem>
                        <MenuItem value={"Female"}>Female</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </td>
              </tr>
              <tr>
                <td className="px-4 w-1/2" colSpan={2}>
                  <EmailInput label="Email Address" />
                </td>
              </tr>
              <tr>
                <td className="pt-2 px-4 w-1/2">
                  <Password 
                    required
                    label="Password" 
                    password={password} 
                    setPassword={setPassword} 
                    showPassword={showPassword}
                    handleShowPassword={handleShowPassword}
                  />
                </td>
                <td className="pt-2 px-4 w-1/2">
                  <ConfirmPassword 
                    required
                    password={password} 
                    setPassword={setPassword} 
                    label="Confirm Password" 
                    showConfirmPassword={showConfirmPassword}
                    handleShowConfirmPassword={handleShowConfirmPassword}
                  />
                </td>
              </tr>
              <tr>
                <td className="pt-2 px-4 w-1/2 text-right" colSpan={2}>
                  <Button 
                    type="submit"
                    variant="contained"
                    className="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                    endIcon={<SendIcon />}
                  >
                  <Link to="/GuestProfile">SIGN UP</Link>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
        {/* Form ends here */}
      </div>
    </div>
  );
};

export default SignUp;
