import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Importing routers
import productsRouter from './routes/getProducts.js';
import ordersRouter from './routes/addOrder.js';
import signUpRouter from './routes/signup.js';
import loginRouter from './routes/login.js';
import logoutRouter from './routes/logout.js';
import adminRouter from './routes/adminBack.js';
import storesRouter from './routes/stores.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 5500;

// Enabling Cross-Origin Resource Sharing (CORS)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html at /admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Mounting routers
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/signup', signUpRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/admin/api', adminRouter);  // Changed this to avoid conflicts
app.use('/stores', storesRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
