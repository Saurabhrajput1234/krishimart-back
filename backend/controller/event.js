const express = require("express");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { upload } = require("../multer");
const Shop = require("../model/shop");
const Event = require("../model/event");
const Order = require("../model/order");
const ErrorHandler = require("../utils/ErrorHandler");
const { isSeller, isAdmin, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// Create event
router.post(
  "/create-event",
  upload.array("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        const files = req.files;
        // Map each file to an object with url and public_id from Cloudinary
        const imageUrls = files.map((file) => ({
          url: file.path,
          public_id: file.filename,
        }));

        const eventData = req.body;
        eventData.images = imageUrls;
        eventData.shop = shop;

        const event = await Event.create(eventData);

        res.status(201).json({
          success: true,
          event,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);
// Get all events
router.get("/get-all-events", async (req, res, next) => {
  try {
    const events = await Event.find();
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return  next(new ErrorHandler(error, 400));
  }
});

// Get all events of a shop
router.get(
  "/get-all-events/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await Event.find({ shopId: req.params.id });
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// Delete event of a shop
router.delete(
  "/delete-shop-event/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const eventId = req.params.id;
      const eventData = await Event.findById(eventId);

      if (!eventData) {
        return next(new ErrorHandler("Event not found!", 404));
      }

      // Delete each image from Cloudinary using its public_id
      for (const image of eventData.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }

      const event = await Event.findByIdAndDelete(eventId);
      if (!event) {
        return next(new ErrorHandler("Event not found with this id!", 500));
      }

      res.status(201).json({
        success: true,
        message: "Event deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// Get all events --- for admin
router.get(
  "/admin-all-events",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const events = await Event.find().sort({ createdAt: -1 });
      res.status(201).json({
        success: true,
        events,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Review for an event
router.put(
  "/create-new-review-event",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, eventId, orderId } = req.body;
      
      const event = await Event.findById(eventId);

      const review = {
        user,
        rating,
        comment,
        eventId,
      };

      // Convert ObjectId to string for comparison
      const isReviewed = event.reviews.find(
        (rev) => rev.user._id.toString() === req.user._id.toString()
      );

      if (isReviewed) {
        event.reviews.forEach((rev) => {
          if (rev.user._id.toString() === req.user._id.toString()) {
            rev.rating = rating;
            rev.comment = comment;
            rev.user = user;
          }
        });
      } else {
        event.reviews.push(review);
      }

      let avg = 0;
      event.reviews.forEach((rev) => {
        avg += rev.rating;
      });
      event.ratings = avg / event.reviews.length;

      await event.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": eventId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviewed successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

module.exports = router;
