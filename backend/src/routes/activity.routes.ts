import { Router } from 'express';
import activityController from '../controllers/activity.controller';

const router = Router();

// Get activities for a vault
router.get('/:vault_id', activityController.getActivities);

// Record login activity
router.post('/login', activityController.recordLogin);

// Record password generation activity
router.post('/password-generation', activityController.recordPasswordGeneration);

// Get activity statistics
router.get('/:vault_id/stats', activityController.getActivityStats);

export default router;