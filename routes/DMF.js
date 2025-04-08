const express = require('express');
const {getTopProducts, getProductCountInOrders, getProductCountInOrdersAll} = require('../controllers/DMF_SuggestProducts');
const {getHotSellingProducts} = require('../controllers/DMF_HotSelling');

const router = express.Router();

// Lấy danh sách sản phẩm gợi ý cho người dùng
router.get('/top-products/:userId', getTopProducts);

// Lấy danh sách sản phẩm bán chạy nhất
router.get('/hot-selling-products', getHotSellingProducts);

// Lấy số lượng sản phẩm trong đơn hàng của user
router.get('/product-count/:userId', getProductCountInOrders);

// Lấy số lượng sản phẩm trong đơn hàng của tất cả user
router.get('/productCountsAll', getProductCountInOrdersAll);




module.exports = router;