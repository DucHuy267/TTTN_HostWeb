const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const express = require('express');
const router = express.Router();

router.post('/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        // Kiểm tra tồn tại của sản phẩm và số lượng trong kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({ 
                error: `Only ${product.quantity} units of ${product.name} available in stock` 
            });
        }

        // Lấy giỏ hàng hoặc tạo mới nếu chưa tồn tại
        let cart = await Cart.findById(userId);
        if (!cart) {
            cart = new Cart({ _id: userId, products: [] });
        }

        // Tìm sản phẩm trong giỏ hàng
        const existingProductIndex = cart.products.findIndex(
            (item) => item.productId.toHexString() === productId
        );

        if (existingProductIndex !== -1) {
            // Kiểm tra tổng số lượng trong giỏ hàng và kho
            const currentQuantity = cart.products[existingProductIndex].quantity;
            if (currentQuantity + quantity > product.quantity) {
                return res.status(400).json({ 
                    error: `Cannot add ${quantity} units. Only ${product.quantity - currentQuantity} units left in stock` 
                });
            }
            // Cập nhật số lượng trong giỏ hàng
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            // Thêm sản phẩm mới vào giỏ
            cart.products.push({ productId, quantity });
        }

        await cart.save();
        return res.status(200).json({ message: 'Added to cart successfully' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ error: 'Error adding to cart' });
    }
});


router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const cart = await Cart.findById(userId).populate({
            path: 'products.productId',
            model: 'products',
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        return res.status(200).json(cart);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching cart' });
    }
});

router.put('/update', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        // Kiểm tra tồn tại của sản phẩm và số lượng trong kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({ 
                error: `Only ${product.quantity} units of ${product.name} available in stock` 
            });
        }
        // Lấy giỏ hàng
        const cart = await Cart.findById(userId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        // Tìm sản phẩm trong giỏ hàng
        const existingProductIndex = cart.products.findIndex(
            (item) => item.productId.toHexString() === productId
        );
        if (existingProductIndex !== -1) {
            // Cập nhật số lượng sản phẩm trong giỏ
            cart.products[existingProductIndex].quantity = quantity;
            await cart.save();
            return res.status(200).json({ message: 'Product quantity updated' });
        } else {
            return res.status(404).json({ error: 'Product not found in cart' });
        }
    } catch (error) {
        console.error('Error updating product quantity:', error);
        return res.status(500).json({ error: 'Error updating product quantity' });
    }
});


router.delete('/delete', async (req, res) => {
    const { userId, productId } = req.body;
    try {
        const cart = await Cart.findById(userId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        cart.products = cart.products.filter(
            (item) => item.productId.toHexString() !== productId
        );
        await cart.save();
        return res.status(200).json({ message: 'Product removed from cart' });
    } catch (error) {
        return res.status(500).json({ error: 'Error removing product from cart' });
    }
});

module.exports = router;
