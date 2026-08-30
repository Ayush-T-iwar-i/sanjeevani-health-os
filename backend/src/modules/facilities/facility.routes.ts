import { Router } from 'express';
import * as facilityController from './facility.controller';

const router = Router();

router.get('/search', facilityController.search);
router.get('/services', facilityController.listServices);
router.get('/:id', facilityController.getById);

export default router;
