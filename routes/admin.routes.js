const express = require('express');
const router = express.Router();
const cityController = require('../controllers/city.controller')
const adminController = require('../controllers/admin.controller')
const userController = require('../controllers/user.controller')
const partnerController = require('../controllers/partner.controller')
const treatmentsController = require('../controllers/treatments.controller')
const conditionsController = require('../controllers/conditions.controller')
const hospitalController = require('../controllers/hospital.controller')
const DoctorController = require('../controllers/doctor.controller')
const bookAppController = require('../controllers/bookApp.controller')
const addAccountDetailsController = require('../controllers/addAccountDetails.controller')
const bannerController = require('../controllers/banner.controller')
// const  {uploadSingle,uploadMultiple} = require('../multer/multer')
const  {uploadSingle,uploadMultiple} = require('../utils/s3Images')
const {authenticate,isAdmin} = require('../middleware/auth')

router.post("/register", adminController.register);
router.post("/login", adminController.login);
router.use(authenticate, isAdmin);
//users
router.post('/add-user',userController.register);
router.put('/update-user/:id',userController.updateUser);
router.get("/getall-user",userController.getallUser);
router.get("/getbyid-user/:id",userController.getbyIdUser);
router.delete("/delete-user/:id",userController.deleteUser);

//city
router.post("/add-city",cityController.addCity);
router.get("/getall-city",cityController.getAllCities);
router.get("/getbyid-city/:id", cityController.getCityById);
router.put("/update-city/:id", cityController.updateCity);
router.delete("/delete-city/:id", cityController.deleteCity);

//treatments
router.post("/add-treatments",uploadSingle,treatmentsController.addTreatments);
router.get("/getall-treatments",treatmentsController.getAllTreatments);
router.get("/getbyid-treatments/:id", treatmentsController.getTreatmentsById);
router.put("/update-treatments/:id", uploadSingle,treatmentsController.updateTreatments);
router.delete("/delete-treatments/:id", treatmentsController.deleteTreatments);
//conditions
router.post("/add-conditions",uploadSingle,conditionsController.addConditions);
router.get("/getall-conditions",conditionsController.getAllConditions);
router.get("/getbyid-conditions/:id", conditionsController.getConditionsById);
router.put("/update-conditions/:id", uploadSingle,conditionsController.updateConditions);
router.delete("/delete-conditions/:id", conditionsController.deleteConditions);

//hospitals
router.post("/add-hospital",uploadMultiple,hospitalController.addHospital);
router.get("/getall-hospital",hospitalController.getallHospital);
router.get("/getbyid-hospital/:id", hospitalController.getbyIdHospital);
router.put("/update-hospital/:id", uploadMultiple,hospitalController.updateHospital);
router.delete("/delete-hospital/:id", hospitalController.deleteHospital);


//doctors
router.post("/add-doctor",uploadMultiple,DoctorController.addDoctors);
router.get("/getall-doctor",DoctorController.getAllDoctors);
router.get("/getbyid-doctor/:id", DoctorController.getDoctorsById);
router.put("/update-doctor/:id", uploadMultiple,DoctorController.updateDoctors);
router.delete("/delete-doctor/:id", DoctorController.deleteDoctors);

//doctor refferal hospital
router.get("/getall-doctor-refer",DoctorController.getAllRefferals);


//book APP
router.get('/getall-book-app',bookAppController.getAllBookApps);
router.get('/getbyid-book-app/:id',bookAppController.getBookAppById);

//account details
router.get('/getall-accountDetails',addAccountDetailsController.getAllAccountDetails);
//comission
router.post("/add-comission",addAccountDetailsController.addCommission);
router.put("/update-comission",addAccountDetailsController.updateCommission);

router.post("/add-banner",uploadSingle,bannerController.create);
router.get("/getall-banner",bannerController.getAllBanner);
router.get("/getbyid-banner/:id", bannerController.getbyIdBanner);
router.put("/update-banner/:id", uploadSingle,bannerController.updateTreatments);
router.delete("/delete-banner/:id", bannerController.deleteBanner);

//partners
router.post('/add-partner',partnerController.register);
router.put('/update-partner/:id',partnerController.updatePartner);
router.get("/getall-partner",partnerController.getallPartner);
router.get("/getbyid-partner/:id",partnerController.getbyIdPartner);
router.delete("/delete-partner/:id",partnerController.deletePartner);

module.exports = router;