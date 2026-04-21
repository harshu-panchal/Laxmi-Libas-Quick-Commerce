import express from 'express';
import { createTicket, getUserTickets, getTicketDetails, addTicketMessage } from './supportController';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

router.use(authenticate); // All support routes require login

router.post('/', createTicket);
router.get('/my-tickets', getUserTickets);
router.get('/:id', getTicketDetails);
router.post('/:id/messages', addTicketMessage);

export default router;
