import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout endpoint - to be implemented' });
});

export default router;
