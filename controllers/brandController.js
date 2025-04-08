const Brand = require('../models/brandModel');

// Hàm lấy Brand theo brandId
exports.getBrandById = async (req, res) => {
    try {
        const brandId = req.params.brandId;
        const brand = await Brand.findOne({ _id: brandId });

        if (brand) {
            res.status(200).json(brand);
        } else {
            res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin thương hiệu', details: err });
    }
};

// Hàm lấy tất cả Brands
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json(brands);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách thương hiệu', details: err });
    }
};

// Hàm thêm mới Brand
exports.addBrand = async (req, res) => {
    try {
        const brand = new Brand(req.body);
        await brand.save();
        res.status(200).json({ message: 'Thương hiệu đã được thêm thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi thêm thương hiệu', details: err });
    }
};

// Hàm cập nhật Brand
exports.updateBrand = async (req, res) => {
    try {
        const brandId = req.params.brandId;
        const updatedBrand = await Brand.findOneAndUpdate(
            { _id: brandId },
            req.body,
            { new: true } // Trả về document đã cập nhật
        );

        if (updatedBrand) {
            res.status(200).json(updatedBrand);
        } else {
            res.status(404).json({ message: 'Không tìm thấy thương hiệu để cập nhật' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật thương hiệu', details: err });
    }
};

// Hàm xóa Brand
exports.deleteBrand = async (req, res) => {
    try {
        const brandId = req.params.brandId;
        const deletedBrand = await Brand.findOneAndDelete({ _id: brandId });

        if (deletedBrand) {
            res.status(200).json({ message: 'Thương hiệu đã được xóa thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy thương hiệu để xóa' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa thương hiệu', details: err });
    }
};
