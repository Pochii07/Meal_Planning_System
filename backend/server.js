const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
dotenv.config()

const patientRoutes = require('./routes/patient_routes')
const recipeRoutes = require('./routes/recipe_routes')
const authRoutes = require('./routes/auth_routes')
const nutritionistPatientRoutes = require('./routes/nutritionist_patient_routes')

// Express app
const FoodPlan = express()

// Middleware
FoodPlan.use(cors({
    origin: [
        'http://localhost:5173',
        'https://chefit-frontend.azurewebsites.net',
        'https://chefit-backend.azurewebsites.net'
    ],
    credentials: true
}));
FoodPlan.use(express.json());
FoodPlan.use(cookieParser());

FoodPlan.use((req, res, next) =>{
    console.log(req.path, req.method)
    next()
}) 

// Routes
FoodPlan.use('/api/patient_routes', patientRoutes)
FoodPlan.use('/api/recipe_routes', recipeRoutes)
FoodPlan.use('/api/auth', authRoutes)
FoodPlan.use('/api/nutritionist/patients',nutritionistPatientRoutes)

// connect to db
mongoose.connect(process.env.MONG_URI)
    .then(() => {
        // Request listener
        FoodPlan.listen(process.env.PORT, () => {
            console.log('connected to db: ', mongoose.connection.host)
            console.log('listening on port: ', process.env.PORT)
        })
    })
    .catch((error) => {
        console.log(error)
    })
