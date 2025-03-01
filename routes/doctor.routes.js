const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller')
const DoctorController = require('../controllers/doctor.controller')
const  {uploadSingle} = require('../multer/multer')
const {authenticate,isDoctor} = require('../middleware/auth')

router.post("/register",uploadSingle,DoctorController.addDoctors);
router.post("/login",DoctorController.loginDoctor);
router.use(authenticate, isDoctor);

router.get("/getown-profile",DoctorController.getDoctorsOwnProfile);

module.exports = router;