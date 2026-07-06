import { Router } from 'express';
import multer from 'multer';
import { validateBody } from '../../../middleware/validate.middleware';
import { requireAuth } from '../../../middleware/auth.middleware';
import { asyncHandler } from '../../../middleware/async.middleware';
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
  asyncHandler(personsController.addPerson)
);
personRoutes.get('/trees/:slug/persons', asyncHandler(personsController.listPersons));
personRoutes.post(
  '/trees/:slug/relationships',
  requireAuth,
  validateBody(createRelationshipSchema),
  asyncHandler(personsController.addRelationship)
);

// Person-scoped routes
personRoutes.get('/persons/:id', asyncHandler(personsController.getPerson));
personRoutes.patch(
  '/persons/:id',
  requireAuth,
  validateBody(updatePersonSchema),
  asyncHandler(personsController.updatePerson)
);
personRoutes.delete('/persons/:id', requireAuth, asyncHandler(personsController.deletePerson));
personRoutes.post(
  '/persons/:id/delete-request',
  requireAuth,
  validateBody(deleteRequestSchema),
  asyncHandler(personsController.requestDeletion)
);
personRoutes.get('/persons/:id/timeline', asyncHandler(personsController.getTimeline));
personRoutes.get('/persons/:id/relationships', asyncHandler(personsController.getRelationships));
personRoutes.post('/persons/:id/claim', requireAuth, asyncHandler(personsController.createClaim));
personRoutes.post(
  '/persons/:id/photo',
  requireAuth,
  upload.single('photo'),
  asyncHandler(personsController.uploadPhoto)
);
personRoutes.get('/persons/:id/photo', asyncHandler(personsController.getPhoto));

// Relationship routes
personRoutes.delete('/relationships/:id', requireAuth, asyncHandler(personsController.removeRelationship));
