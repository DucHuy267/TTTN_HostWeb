
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const config = require('config');
const Cart = require('../models/cartModel'); 

// Helper functions
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
}

function createHmacSignature(data, secretKey) {
    let hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
}

function generateSuccessHtml(vnp_Params) {
    return `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #f7f8fa; }
                    .container { text-align: center; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                    .container h2 { color: #28a745; }
                    .details { margin-top: 10px; text-align: left; }
                    .details p { margin: 5px 0; }
                    .button { margin-top: 20px; }
                    .button button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="../image/success.png" alt="Success"/>
                    <h2>Payment Successful!</h2>
                    <div class="details">
                        <p><strong>Amount:</strong> ${vnp_Params['vnp_Amount']} VND</p>
                        <p><strong>Transaction ID:</strong> ${vnp_Params['vnp_TransactionNo']}</p>
                        <p><strong>Date:</strong> ${vnp_Params['vnp_CreateDate']}</p>
                        <p><strong>Payment Method:</strong> ${vnp_Params['vnp_BankCode'] || 'Unknown'}</p>
                    </div>
                    <div class="button">
                        <button onclick="window.location.href='http://localhost:3000'">DONE</button>
                    </div>
                </div>
            </body>
        </html>
    `;
}

// Create Payment URL
exports.createPaymentUrl = async (orderId, amount, req, res) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // Lấy cấu hình từ môi trường
    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');
    let vnpUrl = config.get('vnp_Url');
    let returnUrl = config.get('vnp_ReturnUrl');
    let bankCode = req.body.bankCode;
    let locale = req.body.language || 'vn'; // Mặc định là 'vn' nếu không có ngôn ngữ
    let currCode = 'VND';

    // Chuẩn bị tham số cho VNPAY
    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': currCode,
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': `Thanh toan cho ma GD: ${orderId}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    // Tạo chữ ký bảo mật cho yêu cầu
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let signed = createHmacSignature(signData, secretKey);

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl; // Return the generated payment URL
};

// VNPAY Return Handler
exports.vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa các tham số không cần thiết
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp các tham số theo thứ tự
    vnp_Params = sortObject(vnp_Params);

    // Lấy thông tin cấu hình
    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');

    // Tạo chuỗi ký hiệu và xác thực
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let signed = createHmacSignature(signData, secretKey);

    // Kiểm tra tính hợp lệ của chữ ký
    if (secureHash === signed) {
        let orderStatus = vnp_Params['vnp_ResponseCode'] === '00' ? 'success' : 'error';
        let transactionId = vnp_Params['vnp_TransactionNo'];
        let orderId = vnp_Params['vnp_TxnRef'];

        try {
            // Cập nhật đơn hàng
            const updatedOrder = await Order.findOneAndUpdate(
                { orderId: String(orderId) },  // Đảm bảo orderId là một chuỗi
                {
                    // status: orderStatus,
                    transactionNo: transactionId,
                    paymentDate: new Date(),
                },
                { new: true }
            );                      

            if (!updatedOrder) {
                return res.status(404).send('Order not found.');
            }

            // Nếu thanh toán thành công, xóa sản phẩm khỏi giỏ hàng
            if (orderStatus === 'success') {

                // Trừ số lượng sản phẩm trong kho
                // for (const item of products) {
                //     const product = await Product.findById(item.productId);
                //     if (!product) {
                //         return res.status(404).send({ message: `Sản phẩm ${item.productId} không tồn tại` });
                //     }
                //     // Kiểm tra số lượng tồn kho
                //     if (product.quantity < item.quantity) {
                //         return res.status(400).send({ 
                //             message: `Sản phẩm ${product.name} không đủ số lượng trong kho` 
                //         });
                //     }
                //     // Cập nhật số lượng sản phẩm
                //     product.quantity -= item.quantity;
                //     await product.save();
                // }

                // Lấy danh sách các sản phẩm đã thanh toán từ đơn hàng
                const paidProductIds = updatedOrder.products.map(product => product.productId);

                // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng
                await removeItemsFromCart(updatedOrder.userId, paidProductIds);

                // Trả về kết quả thành công
                res.status(200).send(generateSuccessHtml(vnp_Params));
            } else {
                res.status(200).send('<p>Payment failed. Please try again.</p>');
            }
        } catch (err) {
            console.error('Error updating order:', err);
            res.status(500).send('Internal Server Error.');
        }
    } else {
        res.status(400).send('Invalid request.');
    }
};

// xóa sản phẩm đả thanh toán
const removeItemsFromCart = async (userId, paidProductIds) => {
    try {
        // Cập nhật giỏ hàng của người dùng, xóa các sản phẩm đã thanh toán
        const result = await Cart.findOneAndUpdate(
            { _id: userId },
            { $pull: { products: { productId: { $in: paidProductIds } } } },
            { new: true } // Trả về giỏ hàng đã cập nhật
        );

        if (result) {
            console.log('Sản phẩm đã được xóa khỏi giỏ hàng:', result);
        } else {
            console.log('Không tìm thấy giỏ hàng của người dùng.');
        }
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm trong giỏ hàng:', err);
    }
};

// them sp vào orders
exports.create_order = async (req, res) => {
    try {
        const { userId, userInfo, products, amount, payment } = req.body;

        // Validation checks for required fields
        if (!userId || !amount || !products || products.length === 0) {
            return res.status(400).send({ message: 'Required fields are missing or invalid' });
        }

        let date = new Date();  // Define the date variable here
        const orderId = moment(date).format('DDHHmmss'); // Simplified unique ID generation

        // Create the order object
        const newOrder = new Order({
            userId,
            orderId,
            userInfo,
            products: products.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                total: item.total,
            })),
            totalPrice: amount,
            status: 'pending',
            paymentMethod: payment || 'Unknown', // Default payment method if not provided
        });

        // Save the new order to the database
        await newOrder.save();

        // Call createPaymentUrl with the generated orderId
        const paymentUrl = await exports.createPaymentUrl(orderId, amount, req, res);

        // Ensure the response is sent only once
        if (!res.headersSent) {
            return res.status(200).send({
                message: 'Order created successfully',
                orderId: newOrder.orderId,
                paymentUrl: paymentUrl, // Return payment URL in the response
            });
        }
    } catch (error) {
        console.error('Error creating order:', error);

        // Ensure the response is sent only once in case of error
        if (!res.headersSent) {
            return res.status(500).send({
                message: 'Failed to create order',
                error: error.message,
            });
        }
    }
};

// thanh toán khi nhận hàng
exports.create_order_receive = async (req, res) => {
    try {
        const { userId, userInfo, products, amount, payment } = req.body;

        // Kiểm tra tính hợp lệ của dữ liệu
        if (!userId || !amount || !products || products.length === 0) {
            return res.status(400).send({ message: 'Thông tin đơn hàng không hợp lệ' });
        }

        // Tạo orderId duy nhất
        const date = new Date();
        const orderId = moment(date).format('DDHHmmss');

        // Tạo đối tượng đơn hàng
        const newOrder = new Order({
            userId,
            orderId,
            userInfo,
            products: products.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                total: item.total,
            })),
            totalPrice: amount,
            status: 'pending', // Khởi tạo với trạng thái pending
            paymentMethod: payment || 'COD', // Mặc định là COD nếu không cung cấp
        });

        // Lưu đơn hàng
        await newOrder.save();

        // Trừ số lượng sản phẩm trong kho
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).send({ message: `Sản phẩm ${item.productId} không tồn tại` });
            }

            // Kiểm tra số lượng tồn kho
            if (product.quantity < item.quantity) {
                return res.status(400).send({ 
                    message: `Sản phẩm ${product.name} không đủ số lượng trong kho` 
                });
            }

            // Cập nhật số lượng sản phẩm
            product.quantity -= item.quantity;
            await product.save();
        }

        // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng
        const paidProductIds = products.map((product) => product.productId);
        await removeItemsFromCart(userId, paidProductIds);

        // Phản hồi thành công
        return res.status(200).send({
            message: 'Order created successfully',
            orderId: newOrder.orderId,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).send({
            message: 'Failed to create order',
            error: error.message,
        });
    }
};

// lấy order theo UserId
exports.getOrdersByUserId = async (req, res) => {
    const userId = req.params.userId;
    try {
      const orders = await Order.find({ userId: userId }).populate('products.productId', 'name price imageUrl');
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error });
    }
};

// Lấy danh sách đơn hàng theo trạng thái
exports.getOrdersByStatus = async (req, res) => {
    try {
      const { status } = req.params;
      
      // Kiểm tra trạng thái hợp lệ
      const validStatuses = ['pending', 'processing', 'shipped', 'success', 'canceled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ." });
      }
  
      const orders = await Order.find({ status })
        .populate('products.productId', 'name price imageUrl')
        .populate('userId', 'name email');
  
      if (orders.length === 0) {
        return res.status(404).json({ message: "Không có đơn hàng nào trong trạng thái này." });
      }
  
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error: error.message });
    }
  };

// lấy tất cả order
exports.getAllOrders = async (req, res) => {
    try {
        // Tìm tất cả đơn hàng, populate để lấy thông tin chi tiết của user và product
        const orders = await Order.find()
            .populate('userId', 'name email') // Chỉ lấy trường name và email của user
            .populate('products.productId', 'name price'); // Chỉ lấy trường name và price của product

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công.',
            data: orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách đơn hàng.',
            error: error.message,
        });
    }
};

// lấy chi tiết order theo id
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('userId', 'name email') // Chỉ lấy trường name và email của user
            .populate('products.productId', 'name price') // Chỉ lấy trường name và price của product
            .populate('shipper.shipperId', 'name phone'); // Chỉ lấy trường name và phone của shipper

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đơn hàng thành công.',
            data: order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết đơn hàng.',
            error: error.message,
        });
    }
};

// tạo mới order
exports.addOrder = async (req, res) => {
    try {
        const { userId, userInfo, products, totalPrice, paymentMethod } = req.body;

        // Validate dữ liệu
        if (!userId || !userInfo || !products || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin.',
            });
        }

        // Tạo mã orderId duy nhất
        const orderId = `ORD-${Date.now()}`;

        const newOrder = new Order({
            userId,
            orderId,
            userInfo,
            products,
            totalPrice,
            paymentMethod,
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: 'Tạo đơn hàng mới thành công.',
            data: newOrder,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng.',
            error: error.message,
        });
    }
};

// cập nhật trạng thái
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp trạng thái đơn hàng mới.',
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công.',
            data: order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đơn hàng.',
            error: error.message,
        });
    }
};

// API để shipper xác nhận đơn hàng được giao 
exports.confirmShipment = async (req, res) => {
    try {
        const { orderId, shipperId } = req.params;

        // Kiểm tra shipper có tồn tại và có quyền giao hàng không
        const shipper = await User.findById(shipperId);
        if (!shipper || shipper.role !== 'shipper') {
            return res.status(403).json({ message: "Người dùng không có quyền xác nhận giao hàng." });
        }

        // Cập nhật trạng thái đơn hàng và thêm thông tin shipper
        const updatedOrder = await Order.findByIdAndUpdate(
            { _id: orderId, status: "processing" }, // Chỉ cập nhật nếu trạng thái là "processing"
            {
                $set: {
                    status: "shipped",
                    shipper: {
                        shipperId: shipper._id,
                        name: shipper.name,
                        phone: shipper.phone,
                    },
                    deliveryConfirmedAt: new Date() // Ghi lại thời gian xác nhận
                }
            },
            { new: true } // Trả về đơn hàng đã cập nhật
        );

        if (!updatedOrder) {
            return res.status(400).json({ message: "Không thể xác nhận giao hàng. Kiểm tra trạng thái đơn hàng." });
        }

        res.status(200).json({ message: "Đơn hàng đã được shipper xác nhận giao hàng.", order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// API để xác nhận đơn hàng đã được giao
exports.confirmDelivery = async (req, res) => {
    try {
        const { orderId, shipperId } = req.params;

        // Kiểm tra shipper có tồn tại và có quyền giao hàng không
        const shipper = await User.findById(shipperId);
        if (!shipper || shipper.role !== 'shipper') {
            return res.status(403).json({ message: "Người dùng không có quyền xác nhận giao hàng." });
        }

        // Cập nhật trạng thái đơn hàng và thêm thông tin shipper
        const updatedOrder = await Order.findByIdAndUpdate(
            { _id: orderId, status: "shipper", "shipper.shipperId": shipper._id }, // Chỉ cập nhật nếu trạng thái là "shipped" và shipperId khớp
            {
                $set: {
                    status: "success",
                    deliveryConfirmedAt: new Date() // Ghi lại thời gian xác nhận
                }
            },
            { new: true } // Trả về đơn hàng đã cập nhật
        );

        if (!updatedOrder) {
            return res.status(400).json({ message: "Không thể xác nhận giao hàng. Kiểm tra trạng thái đơn hàng." });
        }

        res.status(200).json({ message: "Đơn hàng đã được xác nhận giao hàng thành công.", order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Lấy danh sách đơn hàng theo trạng thái và id shipper
exports.getOrdersByStatusAndShipperId = async (req, res) => {
    try {
        const { status, shipperId } = req.params;
        
        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['pending', 'processing', 'shipped', 'success', 'canceled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ." });
        }
    
        const orders = await Order.find({ status, 'shipper.shipperId': shipperId })
            .populate('products.productId', 'name price imageUrl')
            .populate('userId', 'name phone');
    
        if (orders.length === 0) {
            return res.status(404).json({ message: "Không có đơn hàng nào trong trạng thái này." });
        }
    
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error: error.message });
    }
};

// xóa đơn hàng
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng để xóa.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa đơn hàng thành công.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa đơn hàng.',
            error: error.message,
        });
    }
};

