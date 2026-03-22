import { Router } from 'express';
import multer from 'multer';
import { validateBody } from '../../../middleware/validate.middleware';
import { requireAuth } from '../../../middleware/auth.middleware';
import {
  createPersonSchema,
  updatePersonSchema,
  deleteRequestSchema,
  createRelationshipSchema,
} from '../validation/persons.validation';
import * as personsController from '../controllers/persons.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const personRoutes = Router();

// Tree-scoped person routes
personRoutes.post(
  '/trees/:slug/persons',
  requireAuth,
  validateBody(createPersonSchema),
  personsController.addPerson
);
personRoutes.get('/trees/:slug/persons', personsController.listPersons);
personRoutes.post(
  '/trees/:slug/relationships',
  requireAuth,
  validateBody(createRelationshipSchema),
  personsController.addRelationship
);

// Person-scoped routes
personRoutes.get('/persons/:id', personsController.getPerson);
personRoutes.patch(
  '/persons/:id',
  requireAuth,
  validateBody(updatePersonSchema),
  personsController.updatePerson
);
personRoutes.post(
  '/persons/:id/delete-request',
  requireAuth,
  validateBody(deleteRequestSchema),
  personsController.requestDeletion
);
personRoutes.get('/persons/:id/timeline', personsController.getTimeline);
personRoutes.get('/persons/:id/relationships', personsController.getRelationships);
personRoutes.post('/persons/:id/claim', requireAuth, personsController.createClaim);
personRoutes.post(
  '/persons/:id/photo',
  requireAuth,
  upload.single('photo'),
  personsController.uploadPhoto
);
personRoutes.get('/persons/:id/photo', personsController.getPhoto);

// Relationship routes
personRoutes.delete('/relationships/:id', requireAuth, personsController.removeRelationship);
