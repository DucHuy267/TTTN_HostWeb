const express = require('express');

const {getAllComments, getCommentsByProductId
    , getCommentsByUserId, getCommentById,
     createComment, updateComment, deleteComment,
     getAverageRating } = require('../controllers/commentController');

const router = express.Router();

// Lấy tất cả các bình luận
router.get('/', getAllComments);
// Lấy tất cả các bình luận theo productId
router.get('/getCommentsByProductId/:productId', getCommentsByProductId);
router.get('/getCommentsByUserId/:userId', getCommentsByUserId);
// Lấy bình luận theo ID
router.get('/:id', getCommentById);
// Tạo mới một bình luận
router.post('/', createComment);
// Cập nhật bình luận theo ID
router.put('/:id', updateComment);  
// Xóa bình luận theo ID
router.delete('/:id', deleteComment);
// Đánh giá trung bình của sản phẩm
router.get('/getAverageRating/:productId', getAverageRating);

module.exports = router;
