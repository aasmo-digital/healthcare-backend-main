const express = require('express');
const router = express.Router();
const cityController = require('../controllers/city.controller')
const adminController = require('../controllers/admin.controller')
const userController = require('../controllers/user.controller')
const treatmentsController = require('../controllers/treatments.controller')
const conditionsController = require('../controllers/conditions.controller')
const hospitalController = require('../controllers/hospital.controller')
const DoctorController = require('../controllers/doctor.controller')
const  {uploadSingle,uploadMultiple} = require('../multer/multer')
const {authenticate,isAdmin} = require('../middleware/auth')

router.post("/register", adminController.register);
router.post("/login", adminController.login);
router.use(authenticate, isAdmin);

router.post('/add-user',userController.register);
router.put('/update-user/:id',userController.updateUser);
router.get("/getall-user",userController.getallUser);
router.get("/getbyid-user/:id",userController.getbyIdUser);
router.delete("/delete-user/:id",userController.deleteUser);


router.post("/add-city",cityController.addCity);
router.get("/getall-city",cityController.getAllCities);
router.get("/getbyid-city/:id", cityController.getCityById);
router.put("/update-city/:id", cityController.updateCity);
router.delete("/delete-city/:id", cityController.deleteCity);


router.post("/add-treatments",uploadSingle,treatmentsController.addTreatments);
router.get("/getall-treatments",treatmentsController.getAllTreatments);
router.get("/getbyid-treatments/:id", treatmentsController.getTreatmentsById);
router.put("/update-treatments/:id", uploadSingle,treatmentsController.updateTreatments);
router.delete("/delete-treatments/:id", treatmentsController.deleteTreatments);

router.post("/add-conditions",uploadSingle,conditionsController.addConditions);
router.get("/getall-conditions",conditionsController.getAllConditions);
router.get("/getbyid-conditions/:id", conditionsController.getConditionsById);
router.put("/update-conditions/:id", uploadSingle,conditionsController.updateConditions);
router.delete("/delete-conditions/:id", conditionsController.deleteConditions);


router.post("/add-hospital",uploadMultiple,hospitalController.addHospital);
router.get("/getall-hospital",hospitalController.getallHospital);
router.get("/getbyid-hospital/:id", hospitalController.getbyIdHospital);
router.put("/update-hospital/:id", uploadMultiple,hospitalController.updateHospital);
router.delete("/delete-hospital/:id", hospitalController.deleteHospital);



router.post("/add-doctor",uploadSingle,DoctorController.addDoctors);
router.get("/getall-doctor",DoctorController.getAllDoctors);
router.get("/getbyid-doctor/:id", DoctorController.getDoctorsById);
router.put("/update-doctor/:id", uploadSingle,DoctorController.updateDoctors);
router.delete("/delete-doctor/:id", DoctorController.deleteDoctors);
module.exports = router;