const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const authMiddleware = require('../middleware/authMiddleware');


// Create a new business
router.post('/',authMiddleware, async (req, res) => {
try{
    const { businessName, category, phoneNumber, description, address, email, website, logo } = req.body;
    const owner = req.user._id;

    const business = new Business({
        businessName,
        category,
        phoneNumber,
        description,
        address,
        email,
        website,
        logo,
        owner
    });
    res.status(201).json({ message: 'Business created successfully', business });

}catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
}
});
//get all businesses
router.get('/my-businesses',authMiddleware, async (req, res) => {
    try{
        const businesses = await Business.find({ owner: req.user._id });
        if(businesses.length === 0){

            return res.status(200).json({
                success: true,
                message: 'No businesses found for this user',
                businesses: []
            })
        }
                return res.status(200).json({
                    success: true,
                    message: "Businesses fetched successfully",
                     businesses
          });        
        

    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id',async (req, res) => {
    try{

        const { id } = req.params;
        const business = await Business.findById(id);
        if(!business){
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Business fetched successfully',
            business
        });

    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


//update a business
router.put('/:id',authMiddleware, async (req, res) => {
    try{

        const {id} = req.params;
        const business = await Business.findById(id);
        if(!business){
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }
        if(business.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const updatedBusiness = await Business.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json({
            success: true,
            message: 'Business updated successfully',
            business: updatedBusiness
        });
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
    