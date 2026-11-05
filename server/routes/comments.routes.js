const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/comments.controller');
const verifyToken = require('../middleware/auth');

router.get('/article/:articleId', commentsController.getCommentsByArticle);
router.post('/article/:articleId', verifyToken, commentsController.createComment);
router.put('/:id', verifyToken, commentsController.updateComment);
router.delete('/:id', verifyToken, commentsController.deleteComment);

module.exports = router;
