import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import catalogRouter from "./catalog";
import usersRouter from "./users";
import borrowingRouter from "./borrowing";
import reservationsRouter from "./reservations";
import finesRouter from "./fines";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(catalogRouter);
router.use(usersRouter);
router.use(borrowingRouter);
router.use(reservationsRouter);
router.use(finesRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(activityRouter);

export default router;
