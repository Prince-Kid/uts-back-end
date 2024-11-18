import express from "express";
import {
 Welcome,
 allUsers,
 allVendors,
 deleteUser,
 editUser,
 findUser,
 login,
 register,
 updatePassword,
 verifyEmail,
 getUserInfo
} from "../controllers/user.controller";

import { VerifyAccessToken } from "../middleware/verfiyToken";

import { addFeedback, addReview, selectFeedback } from "../controllers/review.controller";

const route = express.Router();

route.get("/", Welcome);

route.get("/finduser/:id", findUser)
route.get("/allusers", allUsers)
route.get("/allvendors", allVendors)
route.post("/register", register);
route.patch("/updateuser/:id", editUser);
route.patch("/updatepassword/:id", updatePassword);
route.delete("/deleteuser/:id", VerifyAccessToken, deleteUser);
route.post("/login", login);
route.post("/addreview/:id", addReview);
route.post("/addfeedback/:id", addFeedback);

route.get("/getfeedback/:id", selectFeedback);

route.get("/verfiy-email", verifyEmail);
route.get("/user-info/:id", getUserInfo);

route.get("/finduser/:id", findUser);
route.get("/allusers", allUsers);
route.get("/allvendors", allVendors);

export default route;
