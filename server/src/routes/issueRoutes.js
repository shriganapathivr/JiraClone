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
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

// Board/backlog drag-and-drop — members may reorder & change status.
router.patch('/reorder', reorderIssues);

// Issue create/delete permission (admin or project manager) is enforced in
// the controller, which has the project context needed to check it.
router.route('/').get(getIssues).post(
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createIssue
);

// updateIssue allows plain members to change status/order only (enforced in controller).
router.route('/:id').get(getIssue).put(updateIssue).delete(deleteIssue);

export default router;
