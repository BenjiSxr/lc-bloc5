const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDB } = require('./config/db');
const { writeLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comments.routes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL) {
    app.set('trust proxy', 1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use('/api', writeLimiter);
app.use(express.json());

// DB initialization
(async () => {
    await initDB();
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Blog API is running...');
});

app.listen(PORT, () => {
    console.log('CORS IS UP TO EVERYTHING')
    console.log(`Server is running on port ${PORT}`);
});
