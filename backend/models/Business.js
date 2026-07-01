const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({

    businessName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber:{
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true
    },
    website: {
        type: String,
        trim: true
        
    },
    logo: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    }

},
    {
        timestamps: true
    }
);
const Business = mongoose .model('Business', businessSchema);
module.exports = Business;
