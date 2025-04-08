const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    sections: [
        {
            title: { type: String, required: true, trim: true }, // Tiêu đề
            content: { type: String, required: true, trim: true } // Nội dung
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
