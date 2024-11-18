import express from "express"
import {
  annualSellingReport,
  overallAnnualSellingReport,
  OverallWeeklySellingReport,
  WeeklySellingReport,
} from "../controllers/analyticController";

const router = express.Router()

router.get("/annualSellingReport/:id", annualSellingReport);
router.get("/overallAnnualSellingReport/", overallAnnualSellingReport);
router.get("/WeeklySellingReport/:id", WeeklySellingReport);
router.get("/OverallWeeklySellingReport/", OverallWeeklySellingReport);


export default router;