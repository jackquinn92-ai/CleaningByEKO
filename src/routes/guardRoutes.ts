import { Router } from 'express';
import { resolvePin, submitTicket } from '../controllers/guardController';

const router = Router();
router.post('/pin/resolve', resolvePin);
router.post('/tickets', submitTicket);

export default router;
