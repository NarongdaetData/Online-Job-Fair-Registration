const express = require('express');
const {getCompanies,getCompany,createCompany,updateCompany,deleteCompany} = require('../controllers/companies')


// const bookingRouter = require('./bookings');
const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

//Re-route into other resource routers
// router.use('/:companiesId/bookings/', bookingRouter);

// router.route('/vacCenters').get(getVacCenters);
router.route('/').get(getCompanies).post(protect,authorize('admin'),createCompany);
router.route('/:id').get(getCompany).put(protect,authorize('admin'),updateCompany).delete(protect,authorize('admin') ,deleteCompany);
module.exports = router;