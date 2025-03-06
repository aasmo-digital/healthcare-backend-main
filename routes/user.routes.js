const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller')
const treatmentsController = require('../controllers/treatments.controller')
const conditionsController = require('../controllers/conditions.controller')
const hospitalController = require('../controllers/hospital.controller')
const doctorController = require('../controllers/doctor.controller')
const cityController = require('../controllers/city.controller')
const bookAppController = require('../controllers/bookApp.controller')
const addAccountDetailsController = require('../controllers/addAccountDetails.controller')
const {authenticate} = require('../middleware/auth')

router.post('/register',userController.register);
router.post('/send-otp',userController.sendOtp);
router.post('/verify-otp',userController.verifyOtp);
router.get("/getall-city",cityController.getAllCities);

router.use(authenticate);
router.get('/get-profile',userController.getOwnProfile);
router.put('/update-profile/:id',userController.updateUser);
//tretments
router.get("/getall-treatments",treatmentsController.getAllTreatments);
router.get("/getbyid-treatments/:id", treatmentsController.getTreatmentsById);
//conditions
router.get("/getall-conditions",conditionsController.getAllConditions);
router.get("/getbyid-conditions/:id", conditionsController.getConditionsById);
//hospital
router.get("/getall-hospital",hospitalController.getallHospitalUser);
router.get("/getbyid-hospital/:id", hospitalController.getbyIdHospital);
//doctor
router.get("/getall-doctor",doctorController.getAllDoctors);
router.get("/getbyid-doctor/:id", doctorController.getDoctorsById);
//book appoitment
router.post('/book-app',bookAppController.createApp);
router.get('/getown-book-app',bookAppController.getOwnBookApps);
//add accoutn details
router.post('/add-account-details',addAccountDetailsController.addAccountDetails);

module.exports = router;