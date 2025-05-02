import React, { useState, useEffect } from "react";
import cooking from '../Images/cooking.png'; 
import TextField from "@mui/material/TextField";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import LogInIMG from '../Images/LogInIMG.jpg'; 
import { bouncy } from 'ldrs';

import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

bouncy.register();

const fetchData = async () => {
  const token = localStorage.getItem('token');  // Get token from localStorage

  if (!token) {
    console.log('No token, please login first.');
    return;
  }

  const response = await fetch('http://localhost:4000/api/nutritionist/patients/meal', {
    method: 'GET',  // or 'PATCH', 'POST', etc.
    headers: {
      'Authorization': `Bearer ${token}`,  // Attach token here
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log(data); 
};

const loginUser = async (email, password) => {
  console.log('Sending Token:', localStorage.getItem('token'));
  const response = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('token', data.token); 
    localStorage.setItem('user', JSON.stringify(data.user));

    navigate('/'); 
  } else {
    alert(data.message); 
  }
};

const EmailInput = ({ label, onChange, value }) => {
  const [email, setEmail] = useState(value || '');
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    onChange(e);

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
  const { login, checkAuth , isLoading, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  const phrases = [
    'Loading your next culinary adventure...',
    'Preparing something delicious...',
    'Mixing flavors and creativity...',
    'Cooking up a tasty experience...',
    'Serving you something special...',
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Dialog state changed:", dialog);
  }, [dialog]);

  const showDialog = (title, message, action) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!email || !password) {
      showDialog('Missing Information', 'All fields are required!');
      return;
    }
  
    try {
      const result = await login(email, password);
      
      if (result?.requiresVerification) {
        sessionStorage.setItem('pendingVerification', JSON.stringify({ 
          email: result.email, 
          token: result.verificationToken, 
          expiresAt: result.expiresAt 
        }));
  
        navigate('/verify_login', { state: { email: result.email, fromLogin: true } });
        return;
      }

      if (result?.success) {
        await checkAuth();
        navigate('/', { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
  
      if (errorMessage.includes('Incorrect password')) {
        showDialog('Incorrect Password', 'Wrong password. Would you like to recover your account?', {
          text: 'Recover Account',
          handler: () => navigate('/forgotPassword')
        });
      } else {
        showDialog('Login Failed', errorMessage);
      }
  
      sessionStorage.removeItem('pendingVerification');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center bg-white">
        <l-bouncy size="90" speed="1.75" color="black"></l-bouncy>
        <div className="text-4xl font-bold leading-10 bg-gradient-to-r from-[#008000] via-emerald-500 to-lime-400 bg-clip-text text-transparent">
          {phrases[phraseIndex]}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 md:flex-row md:px-16">
      <div className="hidden md:flex w-full md:w-1/2 justify-center">
        <img src={LogInIMG} alt="LogInIMG" className="w-4/5 h-auto" />
      </div> 

      <form 
        noValidate
        onSubmit={handleSubmit}
        className="w-full md:w-2/4 lg:w-1/3"
      >
        <div className="mb-8">
          <p className="text-[110px] sm:text-6xl md:text-7xl font-semibold tracking-tighter text-left">
            Log In
          </p>
          <p className="text-[15px] sm:text-base text-left text-[#008000] mb-4 mt-4">
            Get back on track!
          </p>
        </div>

        <div className="mb-4">
          <EmailInput 
            label="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="mb-2">
          <Password 
            label="Password" 
            password={password}
            setPassword={setPassword} 
            showPassword={showPassword}
            handleShowPassword={handleShowPassword}
          />
        </div>

        <div className="mb-6">
          <a className="text-sm font-medium hover:text-[#008000]" href="/ForgotPassword">
            Forgot Password? 
          </a>
        </div>

        <div className="text-right">
          <Button
            type="submit"
            disabled={isLoading}
            variant="contained"
            endIcon={<SendIcon />}
            sx={{
              backgroundColor: '#008000',
              '&:hover': {
                backgroundColor: '#006400',
              },
              borderRadius: '20px',
              px: 4,
              py: 2,
              fontSize: '1.25rem',
              fontWeight: 500,
              color: '#FEFEFA',
              minWidth: '160px',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {isLoading ? "Loading..." : "LOG IN"}
          </Button>
        </div>
      </form>

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

export default LogIn;