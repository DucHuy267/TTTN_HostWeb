const express = require('express');
const {
    addProduct,
    updateProduct,
    getProductById,
    getProductsByCategoryId,
    getAllProducts,
    getAllProductsTrue,
    searchProductsByName,
    deleteProduct,
    getProductsBySubcategoryId,
    getProductsBySubcategoryNameTrue,
    getBySubcategory, 
    getProductsByCategoryIdTrue
} = require('../controllers/productController');

const router = express.Router();

// Route để tìm kiếm sản phẩm theo tên
router.get('/search', searchProductsByName);

// Route để lấy tất cả sản phẩm
router.get('/getAll', getAllProducts);

// Route để lấy tất cả sản phẩm (chỉ hiển thị sản phẩm có isVisible = true)
router.get('/getAllTrue', getAllProductsTrue);

// Route để lấy thông tin sản phẩm theo productId
router.get('/getDetail/:productId', getProductById);

// Route để lấy danh sách sản phẩm theo categoryId
router.get('/category/:categoryId', getProductsByCategoryId);

// Route để lấy danh sách sản phẩm theo categoryId (chỉ hiển thị sản phẩm có isVisible = true)
router.get('/categoryTrue/:categoryId', getProductsByCategoryIdTrue);

// Route để lấy danh sách sản phẩm theo subcategoryName (chỉ hiển thị sản phẩm có isVisible = true)
router.get('/subcategoryTrue/:subcategoryName', getProductsBySubcategoryNameTrue);

// Route để lấy danh sách sản phẩm theo subcategoryId
router.get('/subcategory/:subcategoryId', getProductsBySubcategoryId);

// Route để thêm sản phẩm mới
router.post('/addProduct', addProduct);

// Route để cập nhật sản phẩm theo productId
router.put('/updateProduct/:productId', updateProduct);

// Route để xóa sản phẩm
router.delete('/deleteProduct/:productId', deleteProduct);

// Route để lấy 3 sản phẩm theo subcategoryName
router.get('/getBySubcategory/:subcategoryName', getBySubcategory);

module.exports = router;
