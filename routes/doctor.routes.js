const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller')
const DoctorController = require('../controllers/doctor.controller')
const addAccountDetailsController = require('../controllers/addAccountDetails.controller')
const  {uploadSingle} = require('../multer/multer')
const {authenticate,isDoctor} = require('../middleware/auth')

router.post("/register",uploadSingle,DoctorController.addDoctors);
router.post("/login",DoctorController.loginDoctor);
router.use(authenticate, isDoctor);

router.get("/getown-profile",DoctorController.getDoctorsOwnProfile);
//add accoutn details
router.post('/add-account-details',addAccountDetailsController.addAccountDetails);
module.exports = router;