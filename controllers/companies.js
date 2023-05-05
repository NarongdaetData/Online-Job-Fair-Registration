const Company = require('../models/Company');



//@desc     Get all companies
//@route    GET /api/v1/companies
//@access   Public
exports.getCompanies= async (req,res,next)=>{
    try{
        const companies = await Company.find();

        if(!companies) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:companies});
    }catch(err) {
        res.status(400).json({success:false});
    }
};

//@desc     Get single company
//@route    GET /api/v1/companies/:id
//@access   Public   
exports.getCompany= async (req,res,next)=>{
    try{
        const company = await Company.findById(req.params.id);

        if(!company) {
            return res.status(400).json({success:false});
        }

        res.status(200).json({success:true, data:company});
    }catch(err) {
        res.status(400).json({success:false});
    }
};

//@desc Create new company
//@route    POST /api/v1/companies
//@access   Private
exports.createCompany= async (req,res,next)=>{
    const { name, address, website, description, tel,maximumNumberOfbooking } = req.body;
    const numberOfbooking = 0
    //maximumNumberOfbooking =Number(maximumNumberOfbooking)
    const company = await Company.create({
        name,
        address,
        website,
        description,
        tel,
        numberOfbooking,
        maximumNumberOfbooking
      });
  

    res.status(201).json({
        success: true, 
        data: company
    });
};

//@desc     Update company
//@route    PUT /api/v1/companies/:id
//@access   Private
exports.updateCompany= async (req,res,next)=>{
    try{
        const { name, address, website, description, tel,maximumNumberOfbooking } = req.body;
        const company = await Company.findByIdAndUpdate(req.params.id, {
            name,
            address,
            website,
            description,
            tel,
            numberOfbooking,
            maximumNumberOfbooking
          }, {
            new: true,
            runValidators: true
        })

        if(!company){
            return res.status(400).json({sucess: false});
        }

        res.status(200).json({success: true, data: company});
    }catch(err) {
        res.status(400).json({success: false});
    }
};

//@desc     Delete company
//@route    DELETE /api/v1/companies/:id
//@access   Private   
exports.deleteCompany= async (req,res,next)=>{
    try{
        const company = await Company.findById(req.params.id);

        if(!company) {
            return res.status(404).json({success: false, message: `Bootcamp not found with id of ${req.params.id}`});
        }

        company.remove();
        res.status(200).json({success:true, data: {}});
    }catch(err) {
        res.status(400).json({success: false});
    }
};