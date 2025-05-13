import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Container,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  LocationOn,
  Phone,
  Email,
  Send
} from '@mui/icons-material';
import emailjs from 'emailjs-com';

// Initialize EmailJS with your user ID
emailjs.init('tBIcRZbwRDerCmIwp');

const TextFieldNormal = ({ label, name, value, onChange, width = "100%", ...props }) => {
    return (
      <TextField
        label={label}
        name={name}
        variant="outlined"
        fullWidth
        onChange={onChange} // Pass through directly
        value={value}
        sx={{
          width: width,
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "gray" },
            "&:hover fieldset": { borderColor: "#008000" },
            "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
          },
          "& .MuiInputLabel-root": { color: "gray" },
          "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
        }}
        {...props}
      />
    );
};

const EmailInput = ({ label, onChange }) => {
  const [email, setEmail] = useState("");
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

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill up all fields!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await emailjs.send(
        'service_yutnv4a', //service id
        'template_olwo00a', //template
        {
          from_name: formData.name,
          from_email: formData.email,
          to_email: formData.email,
          bcc_email: 'qtdgegorio@tip.edu.ph', 
          subject: `${formData.subject}`,
          original_subject: formData.subject,
          message: formData.message,
          reply_to: formData.email,
          date: new Date().toLocaleString()
        }
      );

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Email sending failed:', err);
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.paper', 
      py: 8,
      position: 'relative'
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ 
              p: 4, 
              height: '100%',
              bgcolor: 'background.paper'
            }}>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: '#008000',
                  mb: 4
                }}
              >
                Contact Us
              </Typography>
              
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                Have questions about ChefIt? We're here to help! Send us a message and we'll get back to you within 48 hours.
              </Typography>

              {/* Added nutritionist-dietitian section */}
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#008000',
                  mb: 4,
                  borderLeft: '4px solid #008000',
                  pl: 2,
                  fontStyle: 'italic'
                }}
              >
                Are you a nutritionist-dietitian? You're in the right place. 
                <br/>Send us a message to start your patient management journey and transform 
                your practice with our specialized tools.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <IconButton sx={{ 
                    bgcolor: '#e8f5e9', 
                    color: '#008000',
                    mr: 2
                  }}>
                    <LocationOn />
                  </IconButton>
                  <Box>
                  <p className="font-semibold text-[18px]"> 
                    Technological Institute of the Philippines
                    </p>
                    <h2>
                      938 Aurora Boulevard<br />
                      Cubao, Quezon City
                    </h2>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <IconButton sx={{ 
                    bgcolor: '#e8f5e9', 
                    color: '#008000',
                    mr: 2
                  }}>
                    <Email />
                  </IconButton>
                  <Box>
                    <p className="font-semibold text-[18px]">
                      qykabamadar@tip.edu.ph
                      qpagranada@tip.edu.ph
                      qtdgregorio@tip.edu.ph
                    </p>
                    <h2 >
                      Typically replies within 24 hours
                    </h2>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box sx={{ 
              height: 300, 
              mb: 4,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 3
            }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5310646710686!2d121.05914687588216!3d14.625768976458316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b796aecb8763%3A0xaa026ea7350f82e7!2sTechnological%20Institute%20of%20the%20Philippines%20-%20Quezon%20City!5e0!3m2!1sen!2sph!4v1745437357892!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Our Location"
              />
            </Box>

            <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
              <Typography 
                variant="h4" 
                component="h3" 
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: '#008000',
                  mb: 3
                }}
              >
                Send us a message
              </Typography>

              {submitted ? (
                <Box sx={{ 
                  p: 3, 
                  bgcolor: '#e8f5e9', 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                   <br></br>
                   <p className='font-semibold text-[20px]'>We've received your message!</p>
                    <br></br>
                    <p>
                        Please wait for our response through email within 48 hours. Thank you for reaching out to us. 
                    </p>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2, color: '#008000', borderColor: '#008000' }}
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextFieldNormal
                        fullWidth
                        label="Name"
                        variant="outlined"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <EmailInput
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextFieldNormal
                        fullWidth
                        label="Subject"
                        variant="outlined"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextFieldNormal
                        fullWidth
                        label="Your Message"
                        variant="outlined"
                        multiline
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        startIcon={<Send />}
                        disabled={loading}
                        sx={{
                          bgcolor: '#008000',
                          '&:hover': { bgcolor: '#006400' },
                          py: 1.5,
                          fontSize: '1rem',
                          '&:disabled': { bgcolor: '#cccccc' }
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactUs;