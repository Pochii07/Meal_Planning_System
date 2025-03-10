import React, { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Button, IconButton, Card, CardMedia, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import BreakfastSample from "../Images/Breakfast-Sample.jpg";
import LunchSample from "../Images/Lunch-Sample.jpg";
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const RecipeCard = ({ name, description, image, ingredients, instructions, nutrition }) => {
  const [isDone, setIsDone] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleMarkDone = () => {
    setIsDone(!isDone);
  };

  return (
    <>
        <Card sx={{ width: 400, height: 450, mt: 4, display: "flex", flexDirection: "column"}}>
        {/* Recipe Image */}
        <CardMedia
          sx={{
            height: 200,
            borderRadius: "10px",
          }}
          image={image}
          title={name}
        />
        <CardContent>
          {/* Recipe Name */}
          <p className="text-[25px] font-bold">{name}</p>

          {/* Recipe Description */}
          <p className="text-[12px] font-semibold">
            <br />
            {description}
          </p>
        </CardContent>
          <CardActions sx={{ justifyContent: "left", mt: "auto" }}>
          {/* View Recipe Button - Opens Dialog */}
          <Button
            variant="outlined"
            sx={{
              color: "#008000",
              borderRadius: "50px",
              border: "2px solid #008000",
              transition: "0.3s",
              "&:hover": {
                backgroundColor: "#DFFFD6",
              },
            }}
            onClick={() => setOpen(true)}
          >
            <p className="text-[12px] font-semibold">VIEW RECIPE</p>
          </Button>

          {/* Mark Done Button */}
          <IconButton
            aria-label="markdone"
            onClick={toggleMarkDone}
            sx={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              backgroundColor: isDone ? "#008000" : "transparent",
              border: "2px solid #008000",
              transition: "0.3s",
              "&:hover": {
                backgroundColor: isDone ? "#006400" : "#DFFFD6",
              },
            }}
          >
            <CheckIcon
              sx={{
                fontSize: "20px",
                fontWeight: "semibold",
                color: isDone ? "white" : "#008000",
              }}
            />
          </IconButton>
        </CardActions>
        <br></br>
      </Card>

      {/* Recipe Dialog*/}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="text-[20px] font-bold">{name}</DialogTitle>
        <DialogContent>
          <CardMedia
            sx={{
              height: 400,
              borderRadius: "10px",
              marginBottom: "16px",
            }}
            image={image}
            title={name}
          />

          <p className="text-[20px] font-bold py-2 pt-4">Ingredients:</p>
          <ul className="text-[14px] pl-3 font-semibold py-2">
            {ingredients.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>

          <p className="text-[20px] font-bold mt-4 pt-4">Instructions:</p>
          <ol className="text-[14px] font-semibold pl-3">
            {instructions.map((step, index) => (
              <li key={index} ><br></br>{index + 1}. {step}</li>
            ))}
            
          </ol>

          <p className="text-[16px] font-bold mt-4">Nutrition Information:</p>
          <p className="text-[14px] font-semibold">{nutrition}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: "#008000" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const NutritionistMealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(null);

    const [selectedPatient, setSelectedPatient] = useState("");
  
    const handleChangePatient = (event) => {
      setSelectedPatient(event.target.value);
    };
  return (
    <div className="flex flex-col mt-12">
      <div className="flex justify-center items-center">
        <p className="text-[80px] font-semibold text-left tracking-tighter">
          MEAL PLAN
        </p>
      </div>

      {/* Date Picker */}
      <div className="mt-4 px-4 flex justify-between items-center">

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select a Date"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            format="MMMM D, YYYY"
          />
        </LocalizationProvider>

        {/* PATIENT PICKER */}
        <Box
            width="40%"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "black", borderWidth: "2px" },
                "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                "&.Mui-focused fieldset": { borderColor: "#008000 !important"},
              },
              "& .MuiInputLabel-root": { color: "black", borderWidth: "2px" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important"},
            }}
          >
            <FormControl required fullWidth>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={selectedPatient}
                onChange={handleChangePatient}
              >
                {/*PATIENTLIST LIST*/}
                <MenuItem value={"Patient 1"}>Patient 1</MenuItem>
                <MenuItem value={"Patient 2"}>Patient 2</MenuItem>
                <MenuItem value={"Patient3"}>Patient 3</MenuItem>
              </Select>
            </FormControl>
          </Box>

        <Button
          variant="outlined"
          sx={{
            color: "#000000",
            borderRadius: "50px",
            border: "2px solid #000000",
            transition: "0.3s",
            height: "50px",
          }}
          /*DOWNLOAD 1 WEEK MEAL PLAN FROM CURRENT DATE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
          onClick={() => setOpen(true)}
        >
          <p className="text-[16px] font-semibold">EXPORT WEEKLY MEAL PLAN</p>
        </Button>
      </div>


      {/* Meal Plan Table */}
      <table>
        <tbody>
          <tr>
            {/*LEFT BUTTON TO CHANGE DAY AND CURRENT MEAL PLANS */}
            <td className="border border-transparent" style={{ verticalAlign: "middle", textAlign: "center" }}>
              <IconButton aria-label="previous-day" size="large">
                <ChevronLeftOutlinedIcon sx={{ fontSize: "50px", fontWeight: "semibold", color: "#008000" }} />
              </IconButton>
            </td>
            <td className="border border-transparent p-4">
              {/* Breakfast Meal Card */}
              <RecipeCard
                name="Tapa and Egg Fried Rice"
                description="A classic Filipino breakfast: tender beef tapa, egg, and fried rice."
                image={BreakfastSample}
                ingredients={[
                  "1 lb. horse meat sliced into thin pieces",
                  "1 head garlic, crushed",
                  "½ cup soy sauce",
                  "¼ teaspoon ground black pepper",
                  "1 teaspoon salt",
                  "2 teaspoons sugar",
                  "¾ cups water",
                  "1 ½ cups lemon-lime soda",
                  "4 tablespoons cooking oil",
                  "4 cups leftover rice",
                  "3 eggs, beaten",
                  "1 onion, minced",
                  "¼ cup green onion, chopped",
                  "1 red bell pepper, minced",
                  "3 tablespoons soy sauce",
                  "2 teaspoons sesame oil",
                  "1 teaspoon salt (optional)",
                ]}
                instructions={[
                  "Start making the tapa by combining garlic, soy sauce, salt, and ground black pepper in a bowl. Stir. Add the meat and mix well. Cover the bowl and refrigerate for at least 3 hours.",
                  "Slice the meat into thinner and smaller pieces as needed. Arrange it in a pan and pour in water and cooking oil. Let boil.",
                  "Add the lemon-lime soda. Continue cooking uncovered until the liquid completely evaporates.",
                  "Fry the tapa in remaining oil for 2 minutes. Remove from the pan and set aside.",
                  "Make the egg fried rice by frying the eggs in the remaining oil.",
                  "Once completely cooked, cut the eggs into smaller pieces using your spatula.",
                  "Add onion, half of the green onions, and bell pepper. Cook for 2 minutes while continuously stirring.",
                  "Put the leftover rice into the pan and then toss until all the ingredients are well distributed.",
                  "Add soy sauce and sesame oil. Continue to stir fry for 3 to 5 minutes. Note: You may add salt if needed.",
                  "Top with remaining green onions. Transfer to a serving plate and serve with the fried tapa. Share and enjoy!",
                ]}
                nutrition="Calories: 798kcal (40%) | Carbohydrates: 66g (22%) | Protein: 34g (68%) | Fat: 44g (68%) | Saturated Fat: 12g (60%) | Polyunsaturated Fat: 6g | Monounsaturated Fat: 21g | Trans Fat: 1g | Cholesterol: 203mg (68%) | Sodium: 4255mg (177%) | Potassium: 733mg (21%) | Fiber: 4g (16%) | Sugar: 16g (18%) | Vitamin A: 2674IU (53%) | Vitamin C: 45mg (55%) | Calcium: 97mg (10%) | Iron: 5mg (28%)"
              />
            </td>
            <td className="border border-transparent p-4">
              {/* LUNCH MEAL CARD*/}
              <RecipeCard
                name="Crispy Katsu Sando"
                description="Easy Japanese sandwich with crispy burger"
                image={LunchSample}
                ingredients={[
                  "1 lb. horse meat sliced into thin pieces",
                  "1 head garlic, crushed",
                  "½ cup soy sauce",
                  "¼ teaspoon ground black pepper",
                  "1 teaspoon salt",
                  "2 teaspoons sugar",
                  "¾ cups water",
                  "1 ½ cups lemon-lime soda",
                  "4 tablespoons cooking oil",
                  "4 cups leftover rice",
                  "3 eggs, beaten",
                  "1 onion, minced",
                  "¼ cup green onion, chopped",
                  "1 red bell pepper, minced",
                  "3 tablespoons soy sauce",
                  "2 teaspoons sesame oil",
                  "1 teaspoon salt (optional)",
                ]}
                instructions={[
                  "Start making the tapa by combining garlic, soy sauce, salt, and ground black pepper in a bowl. Stir. Add the meat and mix well. Cover the bowl and refrigerate for at least 3 hours.",
                  "Slice the meat into thinner and smaller pieces as needed. Arrange it in a pan and pour in water and cooking oil. Let boil.",
                  "Add the lemon-lime soda. Continue cooking uncovered until the liquid completely evaporates.",
                  "Fry the tapa in remaining oil for 2 minutes. Remove from the pan and set aside.",
                  "Make the egg fried rice by frying the eggs in the remaining oil.",
                  "Once completely cooked, cut the eggs into smaller pieces using your spatula.",
                  "Add onion, half of the green onions, and bell pepper. Cook for 2 minutes while continuously stirring.",
                  "Put the leftover rice into the pan and then toss until all the ingredients are well distributed.",
                  "Add soy sauce and sesame oil. Continue to stir fry for 3 to 5 minutes. Note: You may add salt if needed.",
                  "Top with remaining green onions. Transfer to a serving plate and serve with the fried tapa. Share and enjoy!",
                ]}
                nutrition="Calories: 292kcal (15%) | Carbohydrates: 16g (5%) | Protein: 3g (6%) | Fat: 24g (37%) | Saturated Fat: 7g (35%) | Polyunsaturated Fat: 7g | Monounsaturated Fat: 9g | Trans Fat: 0.4g | Cholesterol: 27mg (9%) | Sodium: 508mg (21%) | Potassium: 64mg (2%) | Fiber: 1g (4%) | Sugar: 5g (6%) | Vitamin A: 288IU (6%) | Vitamin C: 6mg (7%) | Calcium: 37mg (4%) | Iron: 1mg (6%)"
              />
            </td>
            <td className="border border-transparent p-4">
              {/* DINNER MEAL CARD*/}
              <RecipeCard
                name="Filipino Style Escabeche"
                description="This appetizing recipe is known for its sweet and sour qualities as a result of a glorious mix of seasonings and other ingredients."
                image={BreakfastSample}
                ingredients={[
                  "6 CDO Crispy burger patties",
                  "3 slices tasty bread cut in half",
                  "1 cup cabbage shredded",
                  "1/4 cup katsu sauce",
                  "3 tablespoons butter",
                  "2 tablespoons cooking oil",
                  "3 tablespoons mayonnaise",
                ]}
                instructions={[
                  "Heat the cooking oil in a pan. Fry both sides of the CDO Crispy burger patties using medium heat until crispy. Set aside",
                  "Grab 2 slices of bread. Spread butter on one side of the first slice of bread and mayonnaise on one side of the second bread slice.",
                  "Lay down the bread slice with butter on a flat surface (butter side up). Top with shredded cabbage and tonkatsu sauce.",
                  "Arrange 2 CDO Crispy Burgers over it and then top with more shredded cabbage and tonkatsu sauce. Finish by topping with the other bread slice (mayo side facing down).",
                  "Arrange Crispy Burger Sando on a serving plate. Serve. Share and enjoy!",
                ]}
                nutrition="Calories: 798kcal (40%) | Carbohydrates: 66g (22%) | Protein: 34g (68%) | Fat: 44g (68%) | Saturated Fat: 12g (60%) | Polyunsaturated Fat: 6g | Monounsaturated Fat: 21g | Trans Fat: 1g | Cholesterol: 203mg (68%) | Sodium: 4255mg (177%) | Potassium: 733mg (21%) | Fiber: 4g (16%) | Sugar: 16g (18%) | Vitamin A: 2674IU (53%) | Vitamin C: 45mg (55%) | Calcium: 97mg (10%) | Iron: 5mg (28%)"
              />
            </td>

            {/*RIGHT BUTTON TO CHANGE DAY AND CURRENT MEAL PLANS */}
            <td className="border border-transparent  " style={{ verticalAlign: "middle", textAlign: "center" }}>
              <IconButton aria-label="next-day" size="large">
                <ChevronRightOutlinedIcon sx={{ fontSize: "50px", fontWeight: "semibold", color: "#008000" }} />
              </IconButton>
            </td>
          </tr>
        </tbody>
      </table>
      
    </div>
  );
};

export default NutritionistMealPlanner;
