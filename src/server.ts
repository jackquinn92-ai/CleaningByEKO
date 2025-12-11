import express from 'express';
import cors from 'cors';
import guardRoutes from './routes/guardRoutes';
import adminRoutes from './routes/adminRoutes';
import env from './config/env';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', guardRoutes);
app.use('/api/admin', adminRoutes);

app.listen(env.PORT, () => {
  console.log(`Cleaning by EKO API listening on ${env.PORT}`);
});
