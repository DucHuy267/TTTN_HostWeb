const Category = require('../models/categoryModel');

// Hàm lấy Category theo subcategoryName 
exports.getCategoryBySubcategoryName = async (req, res) => {
    try {
        const subcategoryName = req.params.subcategoryName;
        const category = await Category.findOne({ 'subcategories.subcategoryName': subcategoryName });
        if (category) {
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin danh mục', details: err });
    }
};

// Hàm lấy Category theo categoryId
exports.getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findOne({ categoryId: categoryId });

        if (category) {
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin danh mục', details: err });
    }
};

// Hàm lấy tất cả Category
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách danh mục', details: err });
    }
};
// Hàm thêm mới Category
exports.addCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(200).json({ message: 'Danh mục đã được thêm thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi thêm danh mục', details: err });
    }
};

// Hàm cập nhật Category
exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const updatedCategory = await Category.findOneAndUpdate(
            { categoryId: categoryId },
            req.body,
            { new: true }
        );
        if (updatedCategory) {
            res.status(200).json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục để cập nhật' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật danh mục', details: err });
    }
};
// Hàm xóa Category
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const deletedCategory = await Category.findOneAndDelete({ categoryId: categoryId });

        if (deletedCategory) {
            res.status(200).json({ message: 'Danh mục đã được xóa thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục để xóa' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa danh mục', details: err });
    }
};
