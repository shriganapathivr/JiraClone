import { Router } from 'express';
import { body } from 'express-validator';
import {
  getContacts,
  getConversation,
  sendMessage,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(protect);

router.get('/contacts', getContacts);
router.get('/unread/count', getUnreadCount);

router.post(
  '/',
  [
    body('to').notEmpty().withMessage('Recipient is required'),
    body('body').trim().notEmpty().withMessage('Message cannot be empty'),
  ],
  validate,
  sendMessage
);

router.get('/:userId', getConversation);

export default router;
