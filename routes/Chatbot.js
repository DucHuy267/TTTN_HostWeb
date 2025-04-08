const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");

// 🔎 Chatbot tìm sản phẩm
router.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase()
            .replace(/[^a-zA-Z0-9\sáàạãảâấầậẫẩăắằặẵẳéèẹẽẻêếềệễểóòọõỏôốồộỗổơớờợỡởúùụũủưứừựữửíìịĩỉýỳỵỹỷđ]/g, "")
            .trim();
        
        if (/(tìm|có không|shop có|sản phẩm này|không|\?|!)/gi.test(userMessage)) {
            let productName = userMessage.replace(/(tìm|có không|shop có|sản phẩm này|không|\?|!)/gi, "").trim();
            if (!productName) return res.json({ reply: "❌ Vui lòng nhập tên sản phẩm cần tìm." });

            console.log("Đang tìm sản phẩm:", productName);

            // Tách các từ trong tin nhắn
            const words = productName.split(" ").filter(word => word.length > 1);

            // Tạo danh sách cụm từ giảm dần độ dài (n-grams)
            const searchQueries = [];
            for (let len = words.length; len > 0; len--) {
                for (let i = 0; i <= words.length - len; i++) {
                    searchQueries.push(words.slice(i, i + len).join(" "));
                }
            }

            console.log("Các cụm từ tìm kiếm:", searchQueries);

            // Tạo điều kiện tìm kiếm với $or để tìm theo nhiều cụm từ
            const searchRegex = searchQueries.map(query => ({ name: { $regex: query, $options: "i" } }));
            const products = await Product.find({ $or: searchRegex });

            if (products.length > 0) {
              const response = products.map(p => ({
                  _id : p._id,
                  name: p.name,
                  price: p.price.toLocaleString("vi-VN") + "đ",
                  imageUrl: p.imageUrl || "https://via.placeholder.com/150",
              }));

              return res.json({ products: response });
          }

            return res.json({ reply: "❌ Xin lỗi, shop không tìm thấy sản phẩm này." });
        }

        res.json({ reply: "❓ Tôi không hiểu yêu cầu của bạn." });
    } catch (error) {
        console.error("Lỗi khi tìm sản phẩm:", error);
        res.status(500).json({ reply: "⚠️ Đã xảy ra lỗi, vui lòng thử lại sau." });
    }
});

// 🛒 Thêm sản phẩm vào giỏ hàng
router.post("/cart/add", async (req, res) => {
    try {
        const { userId, productName } = req.body;
        if (!userId) return res.json({ reply: "❌ Lỗi: Không tìm thấy người dùng." });

        const product = await Product.findOne({ name: { $regex: productName, $options: "i" } });
        if (!product) return res.json({ reply: "❌ Sản phẩm không tồn tại." });

        let cart = await Cart.findOne({ _id: userId });
        if (!cart) cart = new Cart({ _id: userId, products: [] });

        const existingProduct = cart.products.find((p) => p.productId.equals(product._id));
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.products.push({ productId: product._id, quantity: 1 });
        }

        await cart.save();
        res.json({ reply: `🛒 Đã thêm **${product.name}** vào giỏ hàng!` });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        res.status(500).json({ reply: "⚠️ Đã xảy ra lỗi, vui lòng thử lại sau." });
    }
});

module.exports = router;
