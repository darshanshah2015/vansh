import type { Request, Response } from 'express';
import * as personsService from '../services/persons.service';
import * as relationshipService from '../services/relationship.service';
import * as fileService from '../../../shared/services/file.service';
import * as claimsService from '../../claims/services/claims.service';

export async function addPerson(req: Request, res: Response) {
  const person = await personsService.addPerson(req.params.slug as string, req.body, req.user!.id);
  res.status(201).json({ data: person });
}

export async function listPersons(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const result = await personsService.listPersonsByTree(req.params.slug as string, page, limit);
  res.json(result);
}

export async function getPerson(req: Request, res: Response) {
  const person = await personsService.getPerson(req.params.id as string);
  res.json({ data: person });
}

export async function updatePerson(req: Request, res: Response) {
  const person = await personsService.updatePerson(req.params.id as string, req.body, req.user!.id);
  res.json({ data: person });
}

export async function requestDeletion(req: Request, res: Response) {
  const request = await personsService.requestDeletion(
    req.params.id as string,
    req.body.reason,
    req.user!.id
  );
  res.status(201).json({ data: request });
}

export async function getTimeline(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await personsService.getPersonTimeline(req.params.id as string, page, limit);
  res.json(result);
}

export async function addRelationship(req: Request, res: Response) {
  const rel = await relationshipService.addRelationship(
    req.params.slug as string,
    req.body,
    req.user!.id
  );
  res.status(201).json({ data: rel });
}

export async function removeRelationship(req: Request, res: Response) {
  await relationshipService.removeRelationship(req.params.id as string, req.user!.id);
  res.status(204).send();
}

export async function getRelationships(req: Request, res: Response) {
  const result = await relationshipService.getRelationshipsForPerson(req.params.id as string);
  res.json({ data: result });
}

export async function uploadPhoto(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({
      type: 'https://vansh.app/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'No file uploaded',
    });
    return;
  }
  fileService.validateFile(req.file, 'photo');
  const fileKey = await fileService.savePersonPhoto(req.file.buffer, req.file.originalname);
  const person = await personsService.updatePerson(
    req.params.id as string,
    { photoKey: fileKey } as any,
    req.user!.id
  );
  res.json({ data: person });
}

export async function getPhoto(req: Request, res: Response) {
  const person = await personsService.getPerson(req.params.id as string);
  if (!person.photoKey) {
    res.status(404).json({
      type: 'https://vansh.app/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'No photo found',
    });
    return;
  }
  const photoPath = fileService.getPersonPhotoPath(person.photoKey);
  res.sendFile(photoPath);
}

export async function createClaim(req: Request, res: Response) {
  const claim = await claimsService.createClaim(req.params.id as string, req.user!.id, req.body?.reason);
  res.status(201).json({ data: claim });
}
