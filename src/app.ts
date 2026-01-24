import express, { Application } from 'express';
import cors from 'cors';
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  apiRateLimiter, 
  sanitizeInput,
  preventParamPollution 
} from './middlewares';
import { authRoutes } from './modules/auth';
import { animalRoutes } from './modules/animal';
import { milkRateRoutes } from './modules/milk-rate';
import { milkCollectionRoutes } from './modules/milk-collection';
import { expenseRoutes } from './modules/expense';
import { breedingRoutes } from './modules/breeding';
import { pregnancyStatusRoutes } from './modules/pregnancy-status';
import { notificationRoutes } from './modules/notification';
import { dashboardRoutes } from './modules/dashboard';

const app: Application = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging
app.use(requestLogger);

// Input sanitization (prevent NoSQL injection)
app.use(sanitizeInput);

// Prevent parameter pollution
app.use(preventParamPollution(['sort', 'fields']));

// Rate limiting for API routes (temporarily disabled)
// app.use('/api', apiRateLimiter);

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
app.use('/api/v1/milk-rates', milkRateRoutes);
app.use('/api/v1/milk-collection', milkCollectionRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/breeding', breedingRoutes);
app.use('/api/v1/pregnancy-status', pregnancyStatusRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
