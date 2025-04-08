const express = require('express');
const voucherController = require('../controllers/voucherController');

const router = express.Router();

router.get('/', voucherController.getAllVouchers); // Lấy tất cả các voucher
router.get('/:id', voucherController.getVoucherById); // Lấy voucher theo ID
router.post('/', voucherController.createVoucher); // Tạo voucher mới
router.put('/:id', voucherController.updateVoucher); // Cập nhật voucher theo ID
router.delete('/:id', voucherController.deleteVoucher); // Xóa voucher theo ID

module.exports = router;
