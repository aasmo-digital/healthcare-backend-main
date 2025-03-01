const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller')
const treatmentsController = require('../controllers/treatments.controller')
const conditionsController = require('../controllers/conditions.controller')
const hospitalController = require('../controllers/hospital.controller')
const {authenticate} = require('../middleware/auth')

router.post('/register',userController.register);
router.post('/send-otp',userController.sendOtp);
router.post('/verify-otp',userController.verifyOtp);


router.use(authenticate);
router.get('/get-profile',userController.getOwnProfile);
router.put('/update-profile/:id',userController.updateUser);
//tretments
router.get("/getall-treatments",treatmentsController.getAllTreatments);
//conditions
router.get("/getall-conditions",conditionsController.getAllConditions);
//hospital
router.get("/getall-hospital",hospitalController.getallHospital);
module.exports = router;