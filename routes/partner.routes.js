const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partner.controller')
const treatmentsController = require('../controllers/treatments.controller')
const conditionsController = require('../controllers/conditions.controller')
const hospitalController = require('../controllers/hospital.controller')
const doctorController = require('../controllers/doctor.controller')
const cityController = require('../controllers/city.controller')
const bookAppController = require('../controllers/bookApp.controller')
const addAccountDetailsController = require('../controllers/addAccountDetails.controller')
const bannerController = require('../controllers/banner.controller')
const searchCrontroller = require('../controllers/searchAPI.controller')
const {authenticate,isPartner} = require('../middleware/auth')

router.post('/register',partnerController.register);
router.post('/send-otp',partnerController.sendOtp);
router.post('/verify-otp',partnerController.verifyOtp);
router.get("/getall-city",cityController.getAllCities);

router.use(authenticate,isPartner);
router.get('/get-profile',partnerController.getOwnProfile);
router.put('/update-profile/:id',partnerController.updatePartner);

router.get("/referred-users", partnerController.getReferredPartners);
//tretments
router.get("/getall-treatments",treatmentsController.getAllTreatments);
router.get("/getbyid-treatments/:id", treatmentsController.getTreatmentsById);
//conditions
router.get("/getall-conditions",conditionsController.getAllConditions);
router.get("/getbyid-conditions/:id", conditionsController.getConditionsById);

//hospital
router.get("/getall-hospital",hospitalController.getallHospitalUser);
router.get("/getbyid-hospital/:id", hospitalController.getbyIdHospital);
router.get("/hospitals-doctors/by-condition/:conditionId", hospitalController.getHospitalsByCondition);
//doctor
router.get("/getall-doctor",doctorController.getAllDoctors);
router.get("/getbyid-doctor/:id", doctorController.getDoctorsById);

//doctos add and remove whishlist
router.post("/add-whishlist-doctor/:doctorId",doctorController.addToWishlist);
router.post("/remove-whishlist-doctor/:doctorId", doctorController.removeFromWishlist);

//book appoitment
router.post('/book-app',bookAppController.createApp);
router.get('/getown-book-app',bookAppController.getOwnBookApps);
//add accoutn details
router.post('/add-account-details',addAccountDetailsController.addAccountDetails);
//banner
router.get("/getall-banner",bannerController.getAllBanner);
router.get("/getbyid-banner/:id", bannerController.getbyIdBanner);
// search hospital docotors users
router.get("/search",searchCrontroller.search);


module.exports = router;