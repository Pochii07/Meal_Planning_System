import React from "react";
import { NavbarCustom } from "../components/navbar";  
import BlurText from "../components/BlurText";
import Masonry from '../components/Masonry'
import cooking from '../Images/cooking.png'; 
import spin from '../Images/spin.jpeg'; 

const data = [
  { id: 1, image: 'https://cdn.loveandlemons.com/wp-content/uploads/2019/02/meal-prep-ideas.jpg', height: 600  },
  { id: 2, image: 'https://media.self.com/photos/5a316fd183ab3f54feacf768/4:3/w_2560%2Cc_limit/Roasted-pork.jpg', height: 450 },
  { id: 3, image: 'https://healthyfitnessmeals.com/wp-content/uploads/2021/02/Honey-garlic-chicken-meal-prep-9-819x1024.jpg', height: 500},
  { id: 4, image: 'https://images.bauerhosting.com/celebrity/sites/2/2023/04/healthy-dinner-ideas.png?ar=16%3A9&fit=crop&crop=top&auto=format&w=1440&q=80', height: 350 },
  { id: 5, image: 'https://ichef.bbci.co.uk/food/ic/food_16x9_832/recipes/spicy_salmon_bite_rice_16300_16x9.jpg', height: 400 },
  { id: 6, image: 'https://cdn.loveandlemons.com/wp-content/uploads/2019/02/vegan-meal-prep.jpg', height: 600 },
  { id: 7, image: 'https://hips.hearstapps.com/hmg-prod/images/harvest-bowls-index-66b3f14d6d5d4.jpg?crop=0.502xw:1.00xh;0,0&resize=640:*', height: 380 },
  { id: 8, image: 'https://images.squarespace-cdn.com/content/v1/62a3f7c48809f0384d1ba5a1/45b65799-0674-470e-8992-5ac9a61e020a/IMG_3384.jpg', height: 300 },
  { id: 9, image: 'https://freshmealplan.com/cdn/shop/files/95-DSC06765.png?v=1723498585', height: 400 },
  { id: 10, image: 'https://www.recipetineats.com/tachyon/2015/06/Chinese-Chicken-Salad_0a.jpg', height: 700 }
];

const handleAnimationComplete = () => {
  console.log('Animation completed!');
};

const RotatingCircle = ({ imageSrc }) => {
  return (
    <div
      className="absolute top-5/11 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-62 h-62 rounded-full overflow-hidden animate-spin z-[-1]"
      style={{
        animation: "spin 5s linear infinite",
      }}
    >
      <img
        src={spin}
        alt="Rotating Circle"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

const LandingPage = () => {
  return (
    <div
      className="flex flex-col mt-12"
      style={{
        backgroundImage: `url(${cooking})`,
        backgroundPosition: "93% -10%", 
        backgroundRepeat: "no-repeat", 
        height: "100%", 
        backgroundSize: "26%",
      }}
      
    >
    <RotatingCircle imageSrc={cooking} />

      <BlurText
        text="COOK YOUR WAY"
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
      <BlurText
        text="TO HEALTH"
        delay={150}
        animateBy="words"
        direction="top"
        onAnimationComplete={handleAnimationComplete}
        className="-mt-12 -ms-3 font-bold -mb-8 text-[180px] md:self-end"
        style={{
          fontSize: "clamp(2rem, 5vw, 6rem)",
          lineHeight: "1.2",
        }}
      />
      <div className="padding-">
        <Masonry data={data} />
      </div>
    </div>
  );
};

export default LandingPage;
