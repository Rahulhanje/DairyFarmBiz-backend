import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dairy_farm_db',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number,

  // Email
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@dairyfarm.com',
  emailFromName: process.env.EMAIL_FROM_NAME || 'Dairy Farm Management',
  notificationEmail: process.env.NOTIFICATION_EMAIL || '',
};
