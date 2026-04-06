// server.js
// WEB322 - Assignment 3 Gallery
// Author: Francisco Cortes - Web Programming Tools and Frameworks


const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Show purchase page
router.get("/purchase/:image", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const imageName = req.params.image;

  try {
    const image = await mongoose.connection
      .collection("gallery")
      .findOne({ filename: imageName });

    if (!image) {
      return res.send("Image not found");
    }

    res.render("purchase", {
      image: image,
      username: req.session.user
    });
  } catch (err) {
    console.log(err);
    res.send("Error retrieving image");
  }
});

// Process BUY or CANCEL
router.post("/purchase/:image", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const imageName = req.params.image;
  const action = req.body.action;

  try {
    if (action === "BUY") {
      await mongoose.connection
        .collection("gallery")
        .updateOne(
          { filename: imageName },
          { $set: { status: "S" } }
        );

      return res.send('<script>alert("SOLD"); window.location="/gallery";</script>');
    }

    return res.send(`<script>alert("MAYBE NEXT TIME"); window.location="/gallery?selected=${encodeURIComponent(imageName)}";</script>`);
  } catch (err) {
    console.log(err);
    res.send("Error processing purchase");
  }
});

module.exports = router;