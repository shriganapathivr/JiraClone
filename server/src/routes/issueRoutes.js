import { Router } from 'express';
import { body } from 'express-validator';
import {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  reorderIssues,
  deleteIssue,
} from '../controllers/issueController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

// Board/backlog drag-and-drop — members may reorder & change status.
router.patch('/reorder', reorderIssues);

router.route('/').get(getIssues).post(
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createIssue
);

// updateIssue allows members to change status/order only (enforced in controller).
router.route('/:id').get(getIssue).put(updateIssue).delete(adminOnly, deleteIssue);

export default router;
