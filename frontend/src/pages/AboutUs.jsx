import React from 'react';
import { Box, Container } from '@mui/material';
import BlurText from '../components/BlurText';

const handleAnimationComplete = () => {
  console.log('Animation completed!');
};

const AboutUs = () => {
  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      p: 2,
      bgcolor: 'background.default'
    }}>
      <Container maxWidth={false} sx={{
        position: 'relative',
        width: { xs: '100%', lg: '1440px' },
        height: { xs: 'auto', lg: '1024px' },
        bgcolor: 'white',
        overflow: 'hidden',
        p: 0
      }}>
        <Box sx={{
          position: 'relative',
          width: { xs: '100%', lg: '1440px' },
          height: { xs: 'auto', lg: '1024px' },
          mx: 'auto'
        }}>
          <Box sx={{
            position: { xs: 'static', lg: 'absolute' },
            width: { xs: '100%', lg: '1106px' },
            height: { xs: '500px', lg: '649px' },
            left: { lg: '80px' },
            top: { lg: '50px' },
            bgcolor: 'grey.300',
            mb: { xs: 4, lg: 0 }
          }} />

          <Box sx={{
            position: { xs: 'static', lg: 'absolute' },
            width: { xs: '100%', lg: '320px' },
            left: { lg: '170px' },
            top: { lg: '250px' },
            mb: { xs: 4, lg: 0 }
          }}>

            <BlurText
                text="About Us"
                delay={150}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="mt-12 font-bold -mb-9 text-[105px] md:self-start"
                style={{
                fontSize: "clamp(2rem, 5vw, 6rem)",
                lineHeight: "1.2",
                }}
            />
            
          </Box>

          <Box sx={{
            position: { xs: 'static', lg: 'absolute' },
            width: { xs: '100%', lg: '481px' },
            left: { lg: '650px' },
            top: { lg: '200px' },
            color: 'text.primary',
            fontSize: '1rem',
            fontWeight: 'medium',
            p: { xs: 2, lg: 0 }
          }}>
            ChefIt is a thesis project created by a group of 4th-year Computer Science students with a shared goal: to make nutrition planning easier and more effective for professionals. Designed as a smart assistant for nutritionists, ChefIt helps manage patient information and generate personalized meal plans based on individual needs.
            <br/><br/>
            Our system, "Meal Planning and Consumption Recommender System Using K-Means Clustering and Random Forest Classifier," uses machine learning to analyze dietary data and suggest meals that match each patient's health goals. With ChefIt, we aim to support nutritionists in delivering better, data-driven care—while saving time and effort.
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutUs;