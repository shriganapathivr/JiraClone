import { Router } from 'express';
import { body } from 'express-validator';
import {
  getComments,
  createComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(getComments).post(
  [
    body('body').trim().notEmpty().withMessage('Comment body is required'),
    body('issue').notEmpty().withMessage('Issue is required'),
  ],
  validate,
  createComment
);

router.delete('/:id', deleteComment);

export default router;
