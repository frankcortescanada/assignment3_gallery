// server.js
// WEB322 - Assignment 3 Gallery
// Author: Francisco Cortes - Web Programming Tools and Frameworks

const express = require("express");                                                                                                         // Import express
const exphbs = require("express-handlebars");                                                                                               // Import express-handlebars for views
const path = require("path");                                                                                                               // Import path to set up routes
const fs = require("fs");                                                                                                                   // Required to read user.json

const session = require("client-sessions");                                                                                                 // Session management
const randomstring = require("randomstring");                                                                                               // For generating random strings
const mongoose = require('mongoose');                                                                                                       // For MongoDB interaction
const purchaseRoutes = require("./purchase");                                                                                               // Import purchase routes

const app = express();                                                                                                                      // Create express app
const PORT = 3000;                                                                                                                          // Define the port

                                                                                                                                                // MongoDB Atlas Connection
const mongoDB = "mongodb+srv://fcortesgarcia_db_user:nrbFqLUckClHlwwd@mongodbatlas.uqglfen.mongodb.net/web322DB?retryWrites=true&w=majority";  // MongoDB Atlas connection string
mongoose.connect(mongoDB)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas", err));

app.use(express.urlencoded({ extended: true }));                                                                                              // Middleware to parse request body

app.use(session({
  cookieName: "session",  
  secret: randomstring.generate(),  
  duration: 20 * 60 * 1000,  
  activeDuration: 5 * 60 * 1000,  
}));

app.engine(".hbs", exphbs.engine({
  extname: ".hbs",

                                                                                                                                                  // THIS LINE ENABLES PARTIALS
  partialsDir: path.join(__dirname, "views/partials"),

  helpers: {
    ifEquals: function (a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  }
}));

app.set("view engine", ".hbs");                                                                                                                     // Set the default view engine as Handlebars
app.set("views", path.join(__dirname, "views"));                                                                                                    // Tell express that views are in the 'views' folder

app.use(express.static(path.join(__dirname, "public")));                                                                                              // Serve static files (CSS, images)

//                                                                                                                                                    Use the purchase routes
app.use(purchaseRoutes);

                                                                                                                                                      // Route to display the login page
app.get("/", (req, res) => {
  res.render("login");                                                                                                                                // Render login view
});

                                                                                                                                                        // Route to handle user login
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  fs.readFile(path.join(__dirname, "user.json"), "utf8", async (err, data) => {
    if (err) {
      console.log(err);
      return res.render("login", { error: "Server error" });
    }

    const users = JSON.parse(data);

    if (!users[username]) {
      return res.render("login", { error: "Not a registered username" });
    }

    if (users[username] !== password) {
      return res.render("login", { error: "Invalid password" });
    }

    req.session.user = username;

                                                                                                                                                          // Initialize the status of all images to "A" (Available) when the user first logs on
    await mongoose.connection.collection("gallery").updateMany(
      {},
      { $set: { status: "A" } }                                                                                                                           // Update all images to "A" (Available)
    );

    res.redirect("/gallery");                                                                                                                             // Redirect to the gallery page
  });
});

                                                                                                                                                          // Route to display the gallery page
app.get("/gallery", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const images = await mongoose.connection
    .collection("gallery")
    .find({ status: "A" })                                                                                                                                // Only get images with status "A" (Available)
    .toArray();

  let selectedImageName = "Galleria.jpg";                                                                                                                 // Default image if nothing selected
  let selectedImageLabel = "Galleria";

  const requested = req.query.selected;                                                                                                                   // Get the selected image from the query parameter

  if (images.length > 0 && requested) {
    const found = images.find(img => img.filename === requested);
    if (found) {
      selectedImageName = found.filename;
      selectedImageLabel = found.filename.replace(".jpg", "");
    }
  }

  res.render("gallery", {
    images: images,
    selectedImageName: selectedImageName,
    selectedImageLabel: selectedImageLabel,
    username: "Frank Cortes",                                                                                                                           
    email: "fcortes-garcia@myseneca.ca"  
  });
});


                                                                                                                                                          // Route to handle image selection from gallery
app.post("/", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const images = await mongoose.connection
    .collection("gallery")
    .find({ status: "A" })                                                                                                                                // Only get available images
    .toArray();

  let selected = req.body.rdoImage || "Galleria.jpg";                                                                                                     // Default to Galleria if no image selected
  let selectedLabel = "gallery";

  if (selected !== "Galleria.jpg") {
    selectedLabel = selected.replace(".jpg", "");
  }

  if (selected !== "Galleria.jpg" && !images.find(img => img.filename === selected)) {
    selected = "Galleria.jpg";                                                                                                                            // Fallback to default if image not found
    selectedLabel = "gallery";
  }

  res.render("gallery", {
    images: images,
    selectedImageName: selected,
    selectedImageLabel: selectedLabel,
    username: req.session.user,                                                                                                                           // User session data
    email: "fcortes-garcia@myseneca.ca"  
  });
});
// Route to handle logout
app.get("/logout", (req, res) => {
  req.session.reset();                                                                                                                                    // Clear the session
  res.redirect("/");                                                                                                                                      // Redirect to login page
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});