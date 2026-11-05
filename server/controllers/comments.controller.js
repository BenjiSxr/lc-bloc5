const { pool } = require('../config/db');

exports.getCommentsByArticle = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT comments.*, users.username, users.avatar
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.article_id = ?
            ORDER BY comments.created_at DESC
        `, [req.params.articleId]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createComment = async (req, res) => {
    try {
        const { content } = req.body || {};
        if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Content is required' });

        const [articles] = await pool.query('SELECT id FROM articles WHERE id = ?', [req.params.articleId]);
        if (articles.length === 0) return res.status(404).json({ message: 'Article not found' });

        const [result] = await pool.query(
            'INSERT INTO comments (content, article_id, user_id) VALUES (?, ?, ?)',
            [content, req.params.articleId, req.userId]
        );

        const [comments] = await pool.query(`
            SELECT comments.*, users.username, users.avatar
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.id = ?
        `, [result.insertId]);

        res.status(201).json(comments[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body || {};
        if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Content is required' });

        const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);

        if (comments.length === 0) return res.status(404).json({ message: 'Comment not found' });
        if (comments[0].user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });

        await pool.query('UPDATE comments SET content = ? WHERE id = ?', [content, req.params.id]);

        res.json({ message: 'Comment updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);

        if (comments.length === 0) return res.status(404).json({ message: 'Comment not found' });
        if (comments[0].user_id !== req.userId) return res.status(403).json({ message: 'Forbidden' });

        await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
