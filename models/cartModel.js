const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        require: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
            },
            quantity: {
                type: Number,
            },
            _id: false,
        },
    ],
})

const Cart = mongoose.model('carts', cartSchema);
module.exports = Cart;