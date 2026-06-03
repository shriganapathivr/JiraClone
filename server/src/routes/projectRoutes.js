import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.route('/').get(getProjects).post(
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('key')
      .trim()
      .matches(/^[A-Za-z][A-Za-z0-9]{1,9}$/)
      .withMessage('Key must be 2-10 letters/numbers'),
  ],
  validate,
  createProject
);

router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

export default router;
