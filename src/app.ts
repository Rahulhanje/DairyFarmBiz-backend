import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares';
import { authRoutes } from './modules/auth';
import { animalRoutes } from './modules/animal';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dairy Farm API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/animals', animalRoutes);
// app.use('/api/v1/milk-collection', milkCollectionRoutes);
// app.use('/api/v1/milk-rates', milkRateRoutes);
// app.use('/api/v1/expenses', expenseRoutes);
// app.use('/api/v1/breeding', breedingRoutes);
// app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
