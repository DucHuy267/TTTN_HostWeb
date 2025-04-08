const Product = require('../models/productModel');

// Hàm lấy tất cả sản phẩm (chỉ hiển thị sản phẩm có isVisible = true)
exports.getAllProductsTrue = async (req, res) => {
    try {
        const products = await Product.find({ isVisible: true }); // Lọc sản phẩm hiển thị
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm', details: err });
    }
};

// Hàm lấy sản phẩm theo categoryId (chỉ hiển thị sản phẩm có isVisible = true)
exports.getProductsByCategoryIdTrue = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const products = await Product.find({  categoryId: categoryId, isVisible: true  });

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm cho danh mục này' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy sản phẩm theo danh mục', details: err });
    }
};

// Hàm lấy sản phẩm theo subcategoryName (chỉ hiển thị sản phẩm có isVisible = true)
exports.getProductsBySubcategoryNameTrue = async (req, res) => {
    try {
        const subcategoryName = req.params.subcategoryName;
        
        console.log("Received subcategoryName:", subcategoryName); // Debug

        // Tìm sản phẩm có subcategoryName tương ứng và isVisible = true
        const products = await Product.find({ 
            subcategoryName: { $regex: new RegExp(subcategoryName, "i") }, 
            isVisible: true  // Lọc isVisible đúng cách
        });

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm cho danh mục con này' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy sản phẩm theo danh mục con', details: err });
    }
};

// Lấy 3 sản phẩm theo subcategoryName
exports.getBySubcategory = async (req, res) => {
    try {
        const { subcategoryName } = req.params;
        const products = await Product.find({ subcategoryName, isVisible: true })
                                      .limit(3)
                                      .select('name price imageUrl');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};


// Hàm lấy sản phẩm theo subcategoryId 
exports.getProductsBySubcategoryId = async (req, res) => {
    try {
        const subcategoryId = req.params.subcategoryId;
        const products = await Product.find({ subcategoryId: subcategoryId });

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm cho danh mục con này' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy sản phẩm theo danh mục con', details: err });
    }
};

// Hàm lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm', details: err });
    }
};

// Hàm lấy sản phẩm theo _id (được sử dụng như productId)
exports.getProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin sản phẩm', details: err });
    }
};

// Hàm lấy sản phẩm theo categoryId
exports.getProductsByCategoryId = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const products = await Product.find({ categoryId: categoryId });

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm cho danh mục này' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy sản phẩm theo danh mục', details: err });
    }
};

// Hàm thêm sản phẩm mới vào cơ sở dữ liệu
exports.addProduct = async (req, res) => {
    try {
        // console.log("Dữ liệu nhận từ frontend:", req.body); 

        const product = new Product(req.body);
        await product.save();

        res.status(200).json({ message: 'Sản phẩm đã được thêm thành công', product });
    } catch (err) {
        console.error("❌ Lỗi khi thêm sản phẩm:", err.message); // In lỗi backend ra console
        res.status(500).json({ error: 'Lỗi khi thêm sản phẩm', details: err.message });
    }
};

// Hàm cập nhật sản phẩm trong cơ sở dữ liệu
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.productId; // Lấy productId từ URL
        const updateData = req.body;            // Lấy thông tin cập nhật từ body
        // Tìm sản phẩm theo _id và cập nhật thông tin
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true
        });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json({ message: 'Sản phẩm đã được cập nhật thành công', product: updatedProduct });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm', details: err });
    }
};
// Hàm xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (deletedProduct) {
            res.status(200).json({ message: 'Sản phẩm đã được xóa thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa sản phẩm', details: err });
    }
};

// Hàm tìm kiếm sản phẩm theo tên
exports.searchProductsByName = async (req, res) => {
    try {
        const { name } = req.query;
        const products = await Product.find({ name: { $regex: name, $options: 'i' } });

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm phù hợp' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi tìm kiếm sản phẩm', details: err });
    }
};
