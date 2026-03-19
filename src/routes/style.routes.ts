import { Router } from 'express';
import styleController from '../controllers/style.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';

const router = Router();

// Protect all style routes
router.use(authMiddleware);
router.use(organizationMiddleware);

router
    .route('/')
    .get(styleController.getStyles)
    .post(styleController.createStyle);

router
    .route('/me')
    .get(styleController.getMyStyles);

router
    .route('/:id')
    .get(styleController.getStyleById)
    .put(styleController.updateStyle)
    .delete(styleController.deleteStyle);

export default router;
