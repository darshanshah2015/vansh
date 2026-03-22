import type { Request, Response } from 'express';
import * as usersService from '../services/users.service';
import * as fileService from '../../../shared/services/file.service';

export async function getProfile(req: Request, res: Response) {
  const user = await usersService.getProfile(req.user!.id);
  res.json({ data: user });
}

export async function updateProfile(req: Request, res: Response) {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  res.json({ data: user });
}

export async function changePassword(req: Request, res: Response) {
  await usersService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  res.json({ data: { message: 'Password changed successfully' } });
}

export async function listUsers(req: Request, res: Response) {
  const result = await usersService.listUsers(req.query as any);
  res.json(result);
}

export async function getUserById(req: Request, res: Response) {
  const user = await usersService.getUserById(req.params.id as string);
  res.json({ data: user });
}

export async function uploadAadhaar(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({
      type: 'https://vansh.app/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'No file uploaded',
    });
    return;
  }
  fileService.validateFile(req.file, 'aadhaar');
  const fileKey = await fileService.saveAadhaarPhoto(req.file.buffer, req.file.originalname);
  await usersService.uploadAadhaar(req.user!.id, fileKey);
  res.json({ data: { message: 'Aadhaar photo uploaded successfully', status: 'pending' } });
}

export async function getAadhaarPhoto(req: Request, res: Response) {
  const photoKey = await usersService.getAadhaarPhotoKey(req.params.id as string);
  if (!photoKey) {
    res.status(404).json({
      type: 'https://vansh.app/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'No Aadhaar photo found',
    });
    return;
  }
  const photo = await fileService.getAadhaarPhoto(photoKey);
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(photo);
}
