import express from "express"
const route = express.Router()

import { allRequests, allStores, deletingVendor, editVendor, registerVendor,selectVendorInfo, vendorOrder } from "../controllers/vendor.controller"
import { viewProducts } from "../controllers/product.controller"
import { VerifyAccessToken } from "../middleware/verfiyToken"
import { selectFeedback, selectReview, view_vendor_feedback } from "../controllers/review.controller"

route.get('/allstores', allStores)
route.get('/allrequests', allRequests)
route.post('/requestVendor', registerVendor)
route.delete('/deleteVendor/:id',VerifyAccessToken,deletingVendor)
route.get('/vendorProduct/:id', viewProducts)
route.patch('/updateVendor/:id', editVendor)
route.get('/select-review/:id', selectReview)
route.get('/select-feedback/:id', selectFeedback)
route.get('/select-vendorFeedback', view_vendor_feedback)
route.get('/select-vendor/:id', selectVendorInfo)
route.get('/vendor/order/:id', vendorOrder)

export default route
