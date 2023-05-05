const Booking = require('../models/Booking');
const Company = require('../models/Company');
const { route } = require('../routes/auth');

const json2csvParser = require('json2csv');
const fs = require('fs');

//desc      Get all bookings
//@route    GET /api/v1/bookings
//@access   Public
exports.getBookings = async (req, res, next) => {
    let query;
    let companyId = req.params.companyId;

    //General users can see only their bookings!
    if (req.user.role !== 'admin') {
        if (companyId)
            query = Booking.find({ user: req.user.id, company: companyId }).populate({
                path: 'company',
                select: 'name address website description tel'
            });
        else
            query = Booking.find({ user: req.user.id }).populate({
                path: 'company',
                select: 'name address website description tel'
            });
    } else { //If you are an admin, you can see all!
        if (companyId)
            query = Booking.find({ company: companyId }).populate({
                path: 'company',
                select: 'name address website description tel'
            });
        else
            query = Booking.find().populate({
                path: 'company',
                select: 'name address website description tel'
            });

    }

    try {
        const bookings = await query;
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
};

//desc      Export all bookings as CSV
//@route    GET /api/v1/bookings/export
//@access   Private (admin only)
exports.exportBookings = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized to perform this action' });
    }

    try {
        const bookings = await Booking.find().populate({
            path: 'company',
            select: 'name',
        }).populate({
            path: 'user',
            select: 'name'
        });

        const fields = ['id', 'bookingDate', 'user.name', 'company.name'];
        const opts = { fields };
        const csv = json2csvParser.parse(bookings);

        res.setHeader('Content-disposition', 'attachment; filename=bookings.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csv);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to export bookings' });
    }
};


//desc      Get single booking
//@route    GET /api/v1/bookings/:id
//@access   Public
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'company',
            select: 'name description tel'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id if ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
};

//desc      Add single booking
//@route    POST /api/v1/companies/:companyId/bookings/
//@access   Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.company = req.params.companyId;

        var { name, address, website, description, tel ,numberOfbooking,maximumNumberOfbooking}  = await Company.findById(req.params.companyId);

        if (numberOfbooking+1>maximumNumberOfbooking) {
            return res.status(404).json({ success: false, message: `Booking is already full`});
        }
        numberOfbooking = numberOfbooking+1
        const company = await Company.findByIdAndUpdate(req.params.companyId,{ name, address, website, description, tel ,numberOfbooking,maximumNumberOfbooking} , {
            new: true,
            runValidators: true
        })

        if (!company) {
            return res.status(404).json({ success: false, message: `No company with the id of ${req.params.companyId}` });
        }


        //add user Id to req.body
        req.body.user = req.user.id;
        //Check for existed booking
        const existedBookings = await Booking.find({ user: req.user.id });

        //If the user is not an admin, they can only create 3 bookings.
        if (existedBookings.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made 3 bookings` })
        }
        if (Date.parse(req.body.bookingDate) < Date.parse("May 10, 2022") ||
            Date.parse(req.body.bookingDate) >= Date.parse("May 14, 2022")) {

            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} can only booking during May 10-13 2022` })
        }

        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Cannot create Booking" });
    }
};

//desc      Update v
//@route    PUT /api/v1/bookings/:id
//@access   Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No Booking with the id of ${req.params.id}` });
        }

        //Make sure user is the booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this booking` });
        }

        if (Date.parse(req.body.bookingDate) < Date.parse("May 10, 2022") ||
            Date.parse(req.body.bookingDate) >= Date.parse("May 14, 2022")) {

            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} can only booking during May 10-13 2022` })
        }
        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({
            status: true,
            data: booking
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot update Booking" });
    }
};

//desc      Delete booking
//@route    DELETE /api/v1/bookings/:id
//@access   Private
exports.deleteBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        //Make sure user is the booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this booking` });
        }

        await booking.remove();

        res.status(200).json({
            status: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot delete Booking" });
    }
};