const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    productName:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        trim: true
    },
    price:{
        type: Number,
        required: true
    },
    image:{
        type: String,
        trim: true,
        required: true
    },
    stock:{
        type: Number,
        required: true
    },
    business:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    }
},
    {
        timestamps: true
    }
);
const Product = mongoose.model('Product', productSchema);
module.exports = Product;