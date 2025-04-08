const express = require('express');
const Order = require('../models/orderModel');
const router = express.Router(); 

// API lấy thống kê doanh thu theo tháng
router.get('/order-statistics', async (req, res) => {
  try {
    const results = await Order.aggregate([
      {
        $match: { status: "success" }, // Chỉ lấy đơn hàng đã hoàn thành
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          totalProducts: { $sum: { $size: "$products" } }, // Đếm tổng sản phẩm
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    const data = {
      labels: months,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: months.map((_, index) => {
            const result = results.find((res) => res._id.month === index + 1);
            return result ? result.totalRevenue : 0;
          }),
          backgroundColor: "#4e73df",
        },
        {
          label: "Số lượng sản phẩm đã bán",
          data: months.map((_, index) => {
            const result = results.find((res) => res._id.month === index + 1);
            return result ? result.totalProducts : 0;
          }),
          backgroundColor: "#1cc88a",
        },
      ],
    };

    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
});


module.exports = router; // Xuất router, không phải app
