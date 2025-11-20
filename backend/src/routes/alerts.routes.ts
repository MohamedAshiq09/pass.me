import { Router } from 'express';
import alertsController from '../controllers/alerts.controller';

const router = Router();

// Get alerts for a vault
router.get('/', alertsController.getAlerts);

// Mark alert as read
router.patch('/:alertId/read', alertsController.markAsRead);

// Get alert statistics
router.get('/stats/:vault_id', alertsController.getAlertStats);

// Delete alert
router.delete('/:alertId', alertsController.deleteAlert);

export default router;