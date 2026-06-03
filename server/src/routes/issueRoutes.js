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

router.patch('/reorder', reorderIssues);

router.route('/').get(getIssues).post(
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  validate,
  createIssue
);

router.route('/:id').get(getIssue).put(updateIssue).delete(deleteIssue);

export default router;
