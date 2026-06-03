import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSprints,
  createSprint,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
} from '../controllers/sprintController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

// Sprint planning is project-head territory — admin only for all mutations.
router.route('/').get(getSprints).post(
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Sprint name is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createSprint
);

router.post('/:id/start', adminOnly, startSprint);
router.post('/:id/complete', adminOnly, completeSprint);
router.route('/:id').put(adminOnly, updateSprint).delete(adminOnly, deleteSprint);

export default router;
