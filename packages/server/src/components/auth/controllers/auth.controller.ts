import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function signup(req: Request, res: Response) {
  const { user, sessionToken } = await authService.signup(req.body);
  res.cookie('session', sessionToken, COOKIE_OPTIONS);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response) {
  const { user, sessionToken } = await authService.login(req.body.email, req.body.password);
  res.cookie('session', sessionToken, COOKIE_OPTIONS);
  res.json({ data: user });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.session;
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie('session', { path: '/' });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ data: user });
}

export async function forgotPassword(req: Request, res: Response) {
  const { token } = await authService.createResetToken(req.body.email);
  res.json({ data: { token, message: 'If an account with that email exists, a reset token has been generated.' } });
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ data: { message: 'Password has been reset successfully.' } });
}
