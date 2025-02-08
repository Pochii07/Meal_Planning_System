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
import LogInIMG from '../Images/LogInIMG.jpg'; 


const EmailInput = ({ label }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Email validation regex
    const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
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
  const [helperText, setHelperText] = useState(" ");

  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (value.length === 0) {
      setError(true);
      setHelperText("Password is required");
    } else if (value.length < 6) {
      setError(true);
      setHelperText("Password must be at least 8 characters");
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


const LogIn = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
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
        <table className="border-collapse border border-transparent  w-3/4 md:w-2/5">
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
                <EmailInput label="Email Address" />
              </td>
            </tr>
            <tr>
              <td className="pt-2 px-4 w-1/2">
                <Password 
                  required
                  label="Password" 
                  password={password} // Pass the password state
                  setPassword={setPassword} 
                  showPassword={showPassword}
                  handleShowPassword={handleShowPassword}
                />
              </td>
            </tr>
            <tr>
               {/*LINK TO FORGOT PASSWORD*/}
                  <a className="mt-9 mx-5 font-medium hover:text-[#008000]" href="/LogIn">
                    Forgot Password? 
                  </a>
            </tr>
            <tr>
              {/*LINK LOG IN BUTTON*/}
              <td className="pt-2 px-4 w-1/2 text-right" colSpan={2}>
                    <Button variant="contained" class="px-8 py-4 text-xl font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                    endIcon={<SendIcon />}
                    >
                  LOG IN
                  </Button>

              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogIn;
