const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  categoryId: { type: String }, 
  subcategoryName: { type: String }, // Tham chiếu danh mục con
  brand: { type: String }, // Thêm trường brand
  imageUrl: { type: String }, // Thay đổi trường imageUrl để lưu trữ mảng các URL hình ảnh
  isVisible: { type: Boolean, default: true },
  sections: [ // thành phần mô tả sản phẩm
    {
        title: { type: String, required: true, trim: true }, // Tiêu đề
        content: { type: String, required: true, trim: true } // Nội dung
    }
],
});

const Product = mongoose.model('products', productSchema);

module.exports = Product; 
