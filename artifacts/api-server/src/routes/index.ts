import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import categoriesRouter from "./categories";
import sourcesRouter from "./sources";
import advertisementsRouter from "./advertisements";
import analyticsRouter from "./analytics";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import automationRouter from "./automation";
import proxyRouter from "./proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(categoriesRouter);
router.use(sourcesRouter);
router.use(advertisementsRouter);
router.use(analyticsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(automationRouter);
router.use(proxyRouter);

export default router;
