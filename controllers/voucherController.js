const Voucher = require('../models/voucherModel');

// Lấy tất cả các voucher
exports.getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find();
        res.status(200).json({
            status: 'thành công',
            results: vouchers.length,
            data: {
                vouchers
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'thất bại',
            message: err.message
        });
    }
};

// Lấy một voucher theo ID
exports.getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) {
            return res.status(404).json({
                status: 'thất bại',
                message: 'Không tìm thấy voucher với ID đó'
            });
        }
        res.status(200).json({
            status: 'thành công',
            data: {
                voucher
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'thất bại',
            message: err.message
        });
    }
};

// Tạo một voucher mới
exports.createVoucher = async (req, res) => {
    try {
        const newVoucher = await Voucher.create(req.body);
        res.status(201).json({
            status: 'thành công',
            data: {
                voucher: newVoucher
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'thất bại',
            message: err.message
        });
    }
};

// Cập nhật một voucher theo ID
exports.updateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!voucher) {
            return res.status(404).json({
                status: 'thất bại',
                message: 'Không tìm thấy voucher với ID đó'
            });
        }
        res.status(200).json({
            status: 'thành công',
            data: {
                voucher
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'thất bại',
            message: err.message
        });
    }
};

// Xóa một voucher theo ID
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) {
            return res.status(404).json({
                status: 'thất bại',
                message: 'Không tìm thấy voucher với ID đó'
            });
        }
        res.status(204).json({
            status: 'thành công',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'thất bại',
            message: err.message
        });
    }
};