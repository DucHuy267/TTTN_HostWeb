const express = require('express');
const {
    getOrderById,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    getAllOrders,
    create_order,
    create_order_receive,
    getOrdersByUserId,
    getOrdersByStatus,
    createPaymentUrl,
    vnpayReturn,
    confirmShipment,
    confirmDelivery,
    getOrdersByStatusAndShipperId
} = require('../controllers/orderController');

const router = express.Router();

// lấy chi tiết theo id
router.get('/getOrderById/:id', getOrderById);
// tạo
router.post('/addOrder', addOrder);
// cập nhật trạng thái
router.put('/status/:id', updateOrderStatus);
//xóa
router.delete('/delete/:id', deleteOrder);
// lấy tất cả
router.get('/getAll', getAllOrders);
// lấy theo trạng thái
router.get('/status/:status', getOrdersByStatus);
// Route để thêm đơn hàng mới
router.post('/create_order', create_order);
// thanh toans khi nhan hang
router.post('/create_order_receive', create_order_receive);
// lấy order theo User
router.get('/userId/:userId', getOrdersByUserId);

// thanh toán vnpay
router.post('/create_payment_url', createPaymentUrl);
// trả về thông báo
router.get('/vnpay_return', vnpayReturn);

// API để shipper xác nhận giao hàng
router.put('/confirmShipment/:orderId/:shipperId', confirmShipment);
// API để xác nhận đơn hàng đã được giao
router.put('/confirmDelivery/:orderId/:shipperId', confirmDelivery);
// Lấy danh sách đơn hàng theo trạng thái và id shipper
router.get('/getOrdersByStatusAndShipperId/:status/:shipperId', getOrdersByStatusAndShipperId);

module.exports = router;
