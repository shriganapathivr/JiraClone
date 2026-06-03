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
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(getSprints).post(
  [
    body('name').trim().notEmpty().withMessage('Sprint name is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createSprint
);

router.post('/:id/start', startSprint);
router.post('/:id/complete', completeSprint);
router.route('/:id').put(updateSprint).delete(deleteSprint);

export default router;
