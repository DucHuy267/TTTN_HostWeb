const express = require('express');
const {
    addCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryBySubcategoryName
} = require('../controllers/categoryController');

const router = express.Router();

// Route để thêm mới danh mục
router.post('/addCategory', addCategory);

// Route để lấy tất cả danh mục
router.get('/getAll', getAllCategories);

// Route để lấy thông tin danh mục theo categoryId
router.get('/getDetailCategory/:categoryId', getCategoryById);

// Route để lấy thông tin danh mục theo subcategoryName
router.get('/getCategoryBySubcategoryName/:subcategoryName', getCategoryBySubcategoryName);

// Route để cập nhật danh mục
router.put('/updateCategory/:categoryId', updateCategory);

// Route để xóa danh mục
router.delete('/deleteCategory/:categoryId', deleteCategory);

module.exports = router;
