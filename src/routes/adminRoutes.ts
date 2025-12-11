import { Router } from 'express';
import {
  login,
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listSites,
  createSite,
  updateSite,
  deleteSite,
  listTickets,
  exportTickets,
  monthlyReport,
} from '../controllers/adminController';
import { requireAdmin } from '../utils/auth';

const router = Router();

router.post('/login', login);

router.use(requireAdmin);
router.get('/companies', listCompanies);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

router.get('/sites', listSites);
router.post('/sites', createSite);
router.put('/sites/:id', updateSite);
router.delete('/sites/:id', deleteSite);

router.get('/tickets', listTickets);
router.post('/tickets/export', exportTickets);
router.get('/reports/monthly', monthlyReport);

export default router;
