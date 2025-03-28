// Main file
//Importing modules required
import express from 'express';
import productsRouter from './routes/getProducts.js';
import ordersRouter from './routes/addOrder.js';
import signUpRouter from './routes/signup.js';
import loginRouter from './routes/login.js';

import logger from './logger.js';

import cors from 'cors';

const app = express();
const PORT = 5500;

// Enabling Cross-origin resource sharing
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to log HTTP requests sent
app.use(logger);

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Serves static files from public directory
app.use(express.static('public'));

// Mounting routers to specific routes
app.use('/deals', productsRouter);
app.use('/orders', ordersRouter);
app.use('/signup', signUpRouter);
app.use('/login', loginRouter);


// Starts the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});