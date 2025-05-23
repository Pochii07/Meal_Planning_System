import React, { useState, useEffect } from "react";
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
import SendIcon from '@mui/icons-material/Send';
import SignUpIMG from '../Images/SignUpIMG.jpg'; 
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore"; 
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

// Custom TextField without numbers
const TextFieldNoNum = ({ label, value, onChange, width = "100%" }) => {
  const handleChange = (e) => {
    const newValue = e.target.value;
    const regex = /^[A-Za-z\s]*$/;
    
    if (regex.test(newValue)) {
      onChange(e); 
    }
  };

  return (
    <TextField
      label={label}
      variant="outlined"
      fullWidth
      onChange={handleChange}
      value={value}
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

const EmailInput = ({ label, value, onChange }) => {
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const regex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
    
    // Email validation regex
    setError(!regex.test(newValue) && newValue.length > 0);
    onChange(e); 
  };

  return (
    <TextField
      label={label}
      variant="outlined"
      fullWidth
      value={value}
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

const Password = ({ label, value, onChange, showPassword, handleShowPassword }) => {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState(" ");

  const handleChange = (e) => {
    const value = e.target.value;
    onChange(e);

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
      value={value}
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
              edge="end"
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const ConfirmPassword = ({ label, password, onChange, showConfirmPassword, handleShowConfirmPassword }) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [helperText, setHelperText] = useState(" ");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    onChange(e);

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
      helperText={error ? "Passwords do not match" : " "}
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
              edge="end"
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
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [sex, setSex] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  const showDialog = (title, message, action = null) => {
    setDialog({
      open: true,
      title,
      message,
      action
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (event) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const emailRegex = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;

    event.preventDefault();

    if (!firstName || !lastName || !birthDate || !sex || !email || !password || !confirmPassword) {
      showDialog('Missing Information', 'All fields are required!');
      return;
    }

    if (!emailRegex.test(email)) {
      showDialog('Invalid Email', 'Please enter a valid email address!');
      return;
    }

    if (!passwordRegex.test(password)) {
    showDialog('Password Requirements', 'Password does not meet the security requirements!');
    return;
    }

    if (password !== confirmPassword) {
      showDialog('Password Mismatch', 'Passwords do not match!');
      return;
    }

    if (birthDate) {
      const today = new Date();
      const birthDateJS = birthDate.toDate(); // Convert Dayjs to JS Date
      let age = today.getFullYear() - birthDateJS.getFullYear();
      const monthDiff = today.getMonth() - birthDateJS.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateJS.getDate())) {
        age--;
      }
      
      if (age < 20) {
        showDialog('Age Restriction', 'You must be at least 20 years old to sign up.');
        return;
      }
    }

    try {
      await signup(firstName, lastName, email, birthDate, sex, password);
      navigate('/verify_login');
    } catch (error) {
      console.error("Signup failed:", error);
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage === "User already exists") {
        showDialog(
          'Account Exists',
          'This email is already registered. Would you like to recover your account?',
          {
            text: 'Recover Account',
            handler: () => navigate('/ForgotPassword')
          }
        );
      } else {
        showDialog('Registration Failed', errorMessage);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Image Section - Hidden on small screens */}
        <div className="hidden md:block md:w-1/2 bg-green-50">
          <img 
            src={SignUpIMG} 
            alt="SignUp" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 relative">
          {/* Form Header */}
          <div className="mb-8">
            <p className="text-right text-sm text-gray-600 mb-2">
              Already a member?{" "}
              <a className="font-semibold text-green-600 hover:text-green-800" href="/LogIn">
                Log In
              </a>
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Sign Up
            </h1>
            <p className="text-green-600 text-lg">
              Your healthy journey starts here.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFieldNoNum 
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}                 
              />
              <TextFieldNoNum 
                label="Last Name"
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker                      
                  label="Birth Date"
                  value={birthDate}
                  onChange={(newValue) => setBirthDate(newValue)}
                  sx={{
                    width: '100%',
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

              <FormControl fullWidth>
                <InputLabel>Sex</InputLabel>
                <Select
                  label="Sex"
                  value={sex}
                  onChange={(event) => setSex(event.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "gray" },
                      "&:hover fieldset": { borderColor: "#008000" },
                      "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
                    },
                    "& .MuiInputLabel-root": { color: "gray" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
                  }}
                >
                  <MenuItem value={"Male"}>Male</MenuItem>
                  <MenuItem value={"Female"}>Female</MenuItem>
                </Select>
              </FormControl>
            </div>

            <EmailInput 
              label="Email Address"
              value={email}
              onChange={(event) => setEmail(event.target.value)} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Password                 
                label="Password" 
                value={password} 
                showPassword={showPassword}
                handleShowPassword={handleShowPassword}
                onChange={(event) => setPassword(event.target.value)} 
              />
              <ConfirmPassword                    
                label="Confirm Password" 
                password={password}
                showConfirmPassword={showConfirmPassword}
                handleShowConfirmPassword={handleShowConfirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)} 
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit"
                disabled={isLoading}
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  backgroundColor: '#008000',
                  '&:hover': { backgroundColor: '#006400' },
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '50px',
                }}
                endIcon={<SendIcon />}
              >
                {isLoading ? "Loading..." : "Sign Up"}                  
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Dialog for messages */}
      <Dialog open={dialog.open} onClose={closeDialog}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {dialog.action && (
            <Button 
              onClick={() => {
                dialog.action.handler();
                closeDialog();
              }}
              style={{ color: '#008000' }}
            >
              {dialog.action.text}
            </Button>
          )}
          <Button 
            onClick={closeDialog} 
            style={{ color: '#008000' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SignUp;