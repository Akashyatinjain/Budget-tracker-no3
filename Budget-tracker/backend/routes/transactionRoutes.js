const express = require('express');
const app = express();
const transactionRoutes = require('./routes/transactionRoutes');
const authMiddleware = require('./middleware/authMiddleware');

app.use(express.json());

// Protect transaction routes with auth
app.use('/api/transactions', authMiddleware, transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
