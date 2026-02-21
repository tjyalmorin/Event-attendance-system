import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

// POST /api/participants/register
router.post('/register', (req: Request, res: Response) => {
  res.json({ message: 'Participant registration - to be implemented' });
});

// GET /api/participants/event/:eventId
router.get('/event/:eventId', (req: Request, res: Response) => {
  res.json({ message: 'Get participants by event - to be implemented' });
});

// GET /api/participants/:id
router.get('/:id', (req: Request, res: Response) => {
  res.json({ message: 'Get participant by ID - to be implemented' });
});

// PUT /api/participants/:id
router.put('/:id', (req: Request, res: Response) => {
  res.json({ message: 'Update participant - to be implemented' });
});

// DELETE /api/participants/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.json({ message: 'Delete participant - to be implemented' });
});

// POST /api/participants/verify
router.post('/verify', (req: Request, res: Response) => {
  res.json({ message: 'Verify QR code - to be implemented' });
});

export default router;
