import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import defaultFemaleIMG from "../Images/defaultFemaleIMG.jpg";
import UploadPhotoIMG from "../Images/UploadPhotoIMG.png";
import EditIMG from "../Images/EditIMG.png";
import AddIMG from "../Images/AddIMG.png";
import Button from '@mui/material/Button';
import { Link } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Box from '@mui/material/Box';
import cooking from '../Images/cooking.png'; 
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from "@mui/material/Chip";
import TableReact from "../components/table";

const UploadIcon = styled(Avatar)(({ theme }) => ({
  width: 50,
  height: 50,
  border: `2px solid ${theme.palette.background.paper}`,
  cursor: "pointer",
}));

const ViewPatients = () => {
  const [profilePic, setProfilePic] = useState(defaultFemaleIMG);
  const [dietRestrictions, setDietRestrictions] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState("");
  const [selectedActivityLevel, setSelectedActivityLevel] = useState("");

  const handelChangeActivityLevel = (event) => {
    setSelectedActivityLevel(event.target.value);
  };

  const handleChangeDiet = (event) => {
    setSelectedDiet(event.target.value);
  };

  const addDietRestriction = () => {
    if (selectedDiet && !dietRestrictions.includes(selectedDiet)) {
      setDietRestrictions([...dietRestrictions, selectedDiet]);
      setSelectedDiet("");
    }
  };

  const removeDietRestriction = (diet) => {
    setDietRestrictions(dietRestrictions.filter((item) => item !== diet));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  return (
    <div
      className="flex flex-col "
      style={{
        backgroundPosition: "100% 70%", 
        backgroundRepeat: "no-repeat",             
        backgroundSize: "35%",
      }}
    >
      <div className="flex flex-col mt-12 justify-center items-center">
        <table className="table-fixed border-collapse border-transparent w-[1500px]">
          <tbody>
            <tr>
              <td className="border border-transparent p-4 min-w-[700px]" colSpan="2">
                <Stack direction={"row"} spacing={2}>
                <TextField
                  required
                  id="search-field"
                  sx={{
                    width: '80%',
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "black", borderWidth: "2px" },
                      "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                      "&.Mui-focused fieldset": { borderColor: "#008000 !important", borderWidth: "2px" },
                    },
                    "& .MuiOutlinedInput-input": { fontSize: "1.2rem", fontWeight: "semibold" }
                  }}
                  
                />
                {/*SEARCH BUTTON */}  

                <Button
                  variant="outlined"
                  sx={{
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    border: "2px solid #008000",
                    backgroundColor: "#008000",
                    transition: "0.3s",
                    height: "60px",
                    width: "150px"
                  }}>
                  <p className="text-[16px] font-semibold">SEARCH</p>
                </Button>

                </Stack>

              {/* PATIENTS TABLE */}
              <TableReact />
              {/*SEARCH BUTTON */}  

              <Button
                  variant="outlined"
                  sx={{
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    border: "2px solid #008000",
                    backgroundColor: "#008000",
                    transition: "0.3s",
                    height: "60px",
                    width: "150px",
                    justifycontent: "right"
                  }}>
                  <p className="text-[16px] font-semibold">ADD PATIENT</p>
                </Button>

              </td>
              

              <td className="border border-transparent p-4 w-[500px] text-right" colSpan="2">
                                <Stack direction="row" spacing={3}>
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-photo"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      <label htmlFor="upload-photo">
                        <UploadIcon alt="Update Photo" src={UploadPhotoIMG} />
                      </label>
                    }
                  >
                    <Avatar
                      alt="User Photo"
                      src={profilePic}
                      sx={{ width: 180, height: 180, border: "5px solid green" }}
                    />
                  </Badge>
                  <Stack direction="column" spacing={-3}>
                    <Stack direction="row" spacing={2}>
                      <p className="text-[70px] text-left font-bold inline-block leading-tight pt-7 ">
                        John {/* Replace with default name */}
                      </p>
                      <IconButton aria-label="Edit" style={{ marginTop: 30, marginLeft: 5 }}>
                        <img src={EditIMG} alt="Edit" style={{ width: 40, height: 40 }} />
                      </IconButton>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <p className="text-[40px] text-left font-semibold inline-block leading-normal">
                        Doe {/* Replace with default name */}
                      </p>
                      <IconButton aria-label="Edit" style={{ marginTop: 10, marginLeft: 4 }}>
                        <img src={EditIMG} alt="Edit" style={{ width: 25, height: 25 }} />
                      </IconButton>
                    </Stack>
                    
                  </Stack>
                </Stack>
                <hr className="flex-grow border-t-4 mt-8 border-black" />

                <Stack direction={"row"} spacing={16}>
                <p className="font-semibold  pt-4">WEIGHT: </p>
                <p className="font-semibold pt-4">HEIGHT: </p>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                  <Stack direction="row" alignItems="center">
                    {/* WEIGHT */}
                    <TextField
                      required
                      id="weight-input"
                      sx={{
                        width: '9ch',
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "black", borderWidth: "2px" },
                          "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                          "&.Mui-focused fieldset": { borderColor: "#008000 !important", borderWidth: "2px" },
                        },
                        "& .MuiOutlinedInput-input": { fontSize: "1.2rem", fontWeight: "semibold" }
                      }}
                      inputProps={{ maxLength: 6 }}
                      onChange={(e) => {
                        const regex = /^\d{0,3}(\.\d{0,2})?$/;
                        if (!regex.test(e.target.value)) {
                          e.target.value = e.target.value.slice(0, -1);
                        }
                      }}
                    />
                    <span style={{ fontSize: "1.5rem", fontWeight: "bold", marginLeft: "5px" }}>kg</span>
                  </Stack>

                  {/* HEIGHT */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Stack direction="row" alignItems="center">
                      {/* CM */}
                      <TextField
                        required
                        id="height-cm-input"
                        sx={{
                          width: '7ch',
                          marginLeft: '50px',
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "black", borderWidth: "2px" },
                            "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                            "&.Mui-focused fieldset": { borderColor: "#008000 !important", borderWidth: "2px" },
                          },
                          "& .MuiOutlinedInput-input": { fontSize: "1.2rem", fontWeight: "semibold" }
                        }}
                        inputProps={{ maxLength: 1 }}
                        onChange={(e) => {
                          const regex = /^[1-9]?$/;
                          if (!regex.test(e.target.value)) {
                            e.target.value = e.target.value.slice(0, -1);
                          }
                        }}
                      />
                      <span style={{ fontSize: "1.5rem", fontWeight: "bold", marginLeft: "5px" }}>cm</span>
                    </Stack>

                  </Stack>
                </Stack>

                {/* COLUMN 2 DIETARY RESTRICTIONS */}
                <Stack direction={"column"} sx={{ marginBottom: "20px"}}>
                  
                  <span style={{ fontSize: "20px", fontWeight: "bold", alignContent: "right", paddingTop: "10px", marginRight: "230px"}}>DIETARY RESTRICTIONS</span>
                  <Stack direction={"row"}>
                    <Box
                      width="70%"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "black", borderWidth: "2px" },
                          "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                          "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
                        },
                        "& .MuiInputLabel-root": { color: "black", borderWidth: "2px" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
                      }}
                    >
                      <FormControl required fullWidth>
                        <Select
                          labelId="demo-simple-select-label"
                          id="demo-simple-select"
                          value={selectedDiet}
                          onChange={handleChangeDiet}
                        >
                          {/* DIETARY RESTRICTIONS LIST */}
                          <MenuItem value={"Gluten-Free"}>Gluten-Free</MenuItem>
                          <MenuItem value={"Dairy-Free"}>Dairy-Free</MenuItem>
                          <MenuItem value={"Nut-Free"}>Nut-Free</MenuItem>
                          <MenuItem value={"Vegetarian"}>Vegetarian</MenuItem>
                          <MenuItem value={"Vegan"}>Vegan</MenuItem>
                          <MenuItem value={"Halal"}>Halal</MenuItem>
                          <MenuItem value={"Low Sugar"}>Low Sugar</MenuItem>
                          <MenuItem value={"Low Sodium"}>Low Sodium</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <IconButton aria-label="Add" style={{ marginLeft: 5 }} onClick={addDietRestriction}>
                      <img src={AddIMG} alt="Add" style={{ width: 40, height: 40 }} />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" spacing={1} mt={2} rowGap={1} flexWrap="wrap">
                    {dietRestrictions.map((diet) => (
                      <Chip
                        key={diet}
                        label={diet}
                        color="#3D8C40"
                        padding="4"
                        onDelete={() => removeDietRestriction(diet)}
                        sx={{ backgroundColor: "#3D8C40", color: "white" }}
                      />
                    ))}
                  </Stack>

                  {/* ACTIVITY LEVEL */}
                  <Stack direction={"column"}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", marginRight: "310px", paddingTop: "10px"}}>ACTIVITY LEVEL</span>
                    <Stack direction={"row"}>
                      <Box
                        width="32%"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "black", borderWidth: "2px" },
                            "&:hover fieldset": { borderColor: "#008000", borderWidth: "2px" },
                            "&.Mui-focused fieldset": { borderColor: "#008000 !important" },
                          },
                          "& .MuiInputLabel-root": { color: "black", borderWidth: "2px" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "#008000 !important" },
                        }}
                      >
                        <FormControl required fullWidth>
                          <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={selectedActivityLevel}
                            onChange={handelChangeActivityLevel}
                          >
                            {/* ACTIVITY LEVEL LIST */}
                            <MenuItem value={"1"}>1</MenuItem>
                            <MenuItem value={"2"}>2</MenuItem>
                            <MenuItem value={"3"}>3</MenuItem>
                            <MenuItem value={"4"}>4</MenuItem>
                            <MenuItem value={"5"}>5</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                        
                    </Stack>

                    {/* BMI */}
                  <Box component="section" sx={{ p: 1, border: '4px dashed green', marginTop: '20px' }}>
                    <Stack direction={"row"} padding={2}>
                      <Stack direction={"column"}>
                        <span style={{ fontSize: "13px", fontWeight: "bold", marginLeft: "5px" }}>BODY MASS INDEX</span>
                        <span style={{ fontSize: "40px", fontWeight: "bold", marginLeft: "5px" }}>22.1</span>
                      </Stack>
                      <span style={{ fontSize: "40px", fontWeight: "bold", fontStyle: "italic", marginLeft: "22px", alignSelf: "center" }}>
                        NORMAL
                      </span>
                    </Stack>
                  </Box>
                  </Stack>
                </Stack>

                <Button
                  variant="contained"
                  className="mr-10 px-8 py-4 text-lg font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                >
                  <Link to="/NutritionistMealPlanner">VIEW MEAL PLAN</Link>
                </Button>
                <Button
                  variant="contained"
                  className="px-8 py-4 text-lg font-medium text-white bg-[#008000] border border-[#008000] rounded-full hover:bg-[#006400] hover:text-[#FEFEFA] transition duration-300 ease-in-out"
                >
                  <Link to="/ViewPatients">SAVE CHANGES</Link>
                </Button>
              </td>
            </tr>
            <tr >

            </tr>
            <tr>
              <Stack direction={"row"} spacing={16}>

              </Stack>            
            </tr>
            <tr>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewPatients;