const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    voucherId: {type: String,required: true,unique: true,trim: true},
    name: {type: String, required: true, trim: true },
    description: {type: String,required: true,trim: true},
    discount: {type: String,required: true,trim: true
    },
    type: {type: String,required: true,trim: true

    }, // giảm giá theo sản phẩm, giảm giá theo đơn hàng, giảm giá theo mã giảm giá
    startDate: {type: Date,required: true
    },
    endDate: {type: Date,required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }], //Mảng chứa các ID sản phẩm áp dụng khuyến mãi (nếu có)
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }], // Mảng chứa các ID danh mục áp dụng khuyến mãi (nếu có)
    active: {type: Boolean,default: true
    }
}, {
    timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
