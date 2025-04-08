const Order = require('../models/orderModel');

const  getHotSellingProducts = async (req, res) => {
    try {
        const hotSellingProducts = await Order.aggregate([
            { $unwind: '$products' },
            { $group: { _id: '$products.productId', totalSold: { $sum: '$products.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $project: { _id: 0, product: '$productDetails', totalSold: 1 } }
        ]);

        res.status(200).json(hotSellingProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hot selling products', error });
    }
};

module.exports = { getHotSellingProducts };