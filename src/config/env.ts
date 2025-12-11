import dotenv from 'dotenv';

dotenv.config();

type Env = {
  PORT: number;
  DATABASE_URL: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
  EKO_INTERNAL_EMAIL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
};

const env: Env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/cleaning_by_eko',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'password',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  EKO_INTERNAL_EMAIL: process.env.EKO_INTERNAL_EMAIL || 'ops@cleaningbyeko.example',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

export default env;
