const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const { releaseReservation, purchase, setReservation, client } = require("./redisClient");
const { Transactions, db, mongoose } = require("./mongodbClient");

// Set up Express app
const app = express();
const port = 2002;

// Middleware
app.use(bodyParser.json());

// app.use(cors({
//   origin: "https://ecommerceflashsale.netlify.app",
//   credentials: true,
// }));

app.use(cors({
  origin: "https://ecommerceflashsale.netlify.app",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Trust the first proxy (ngrok)
app.use(
  session({
    secret: "some-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24  // 1 day
    },
  })
);
app.set('trust proxy', true);

function checkAuth(req, res, next) {
  // console.log(req.session, "ashish bro")
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}

// Preflight handler for /api/product/:name
// app.options('/api/login', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/check-auth', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/register', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/product/:name', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/cart/add', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/cart/sub', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('api/purchase', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });
// app.options('/api/qtyUpdate', (req, res) => {
//   res.set({
//     'Access-Control-Allow-Origin': 'https://ecommerceflashsale.netlify.app',
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
//   });
//   res.sendStatus(204); // No Content
// });


// Login endpoint


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Transactions.findOne(
      { email, password },
      'name email password'
    );
    // const user = await Transactions.findOne({ email, password });
    if (user) {
      req.session.user = user;
      
      // console.log(req.session.user, "helllo bro113")
      res.json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check authentication
app.post("/api/check-auth", checkAuth, (req, res) => {
  res.json({ message: "You are authorized", user: req.session.user });
});

// Registration endpoint
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const newTransactions = new Transactions({ name, email, password });
  try {
    await newTransactions.save();
    res.status(201).json({ message: "Registration successful. Please log in." });
  } catch (error) {
    console.error("Error saving Transactions:", error);
    res.status(500).json({ error: "Failed to record Transactions." });
  }
});

// Get product quantity
app.post("/api/product/:name", async (req, res) => {
  try {
    const productName = req.params.name;
    if (!productName) {
      return res.status(400).json({ error: "Product name is required" });
    }
    const qty = await client.get(`inventory:${productName}`)
    if (qty === null) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(parseInt(qty));
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/cart/add", checkAuth, async (req, res) => {
  try {
    const { name, qty = 1 } = req.body;
    const userId = req.session.user._id;
    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    const InventoryQty = await client.get(`inventory:${name}`);
    if (InventoryQty <= 0) {
      return res.status(400).json({ error: "Product out of stock" });
    }
    // Add to user's reservation

    const reservationKey = `reservation:${userId}:${name}`;
    let reservationQty = await client.get(reservationKey);
    if (typeof reservationQty === "object") {
      await client.set(reservationKey, 0)
      await client.hset(`reservations:${name}`, userId, 0);
      reservationQty = 0;
    }
    console.log(InventoryQty, "1111111>>>>>>>>>>>", reservationQty)
    await setReservation(userId, name, qty)
    res.json({ qty: InventoryQty, reserved: qty });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/cart/sub", checkAuth, async (req, res) => {
  try {
    const { name, qty = 1 } = req.body;
    const userId = req.session.user._id;
    if (!name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    const InventoryQty = await client.get(`inventory:${name}`);
    // if (InventoryQty <= 0) {
    //   return res.status(400).json({ error: "Product out of stock" });
    // }
    // Add to user's reservation

    const reservationKey = `reservation:${userId}:${name}`;
    let reservationQty = await client.get(reservationKey);
    if (typeof reservationQty === "object") {
      console.log(InventoryQty, "1111111>>>>>>>>>>>", reservationQty)
      return res.status(400).json({ error: "Product out of stock" });
    }
    await releaseReservation(userId, name, qty)
    res.json({ qty: InventoryQty, reserved: qty });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/purchase", checkAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const data = await purchase(userId);
    const oid = mongoose.Types.ObjectId.createFromHexString(userId);

    // Find the user's transaction document to check existing orders
    const existingTransaction = await Transactions.findOne({ _id: oid });

    // Determine the next order number
    let nextOrderNumber = 1;
    if (existingTransaction) {
      // Get all top-level order keys (e.g., order1, order2)
      const orderKeys = Object.keys(existingTransaction.toObject()).filter(key => key.startsWith('order'));
      if (orderKeys.length > 0) {
        // Extract numbers from order keys and find the highest
        const orderNumbers = orderKeys.map(key => parseInt(key.replace('order', '')));
        nextOrderNumber = Math.max(...orderNumbers) + 1;
      }
    }

    // Construct the dynamic field name (e.g., order1.orderDetails)
    const fieldName = `order${nextOrderNumber}`;

    // Update the document with the new order details
    const result = await Transactions.updateOne(
      { _id: oid },
      { $set: { [fieldName]: data } },
      { upsert: true, strict: false }
    );

    console.log("UpdateResult:", result);
    console.log("Inserted data for:", fieldName, data);

    res.json({ productDetails: data });
  } catch (error) {
    console.error("Error during purchase:", error);
    res.status(500).json({ error: 'Server error during purchase.' });
  }
});

app.post("/api/qtyUpdate", checkAuth, async (req, res) => {
  try {
    const { name, currentQty } = req.body;
    if (!name || currentQty === undefined) {
      return res.status(400).json({ error: "Product name and quantity are required" });
    }
    await client.set(`inventory:${name}`, currentQty);
    res.json({ qty: currentQty });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Server started on http://127.0.0.1:${port}`);
}).on("error", (err) => {
  console.error("Server failed to start:", err);
});

// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const session = require("express-session");
// const { releaseReservation, purchase, setReservation, client } = require("./redisClient");
// const { Transactions, db, mongoose } = require("./mongodbClient");
// const MongoStore = require('connect-mongo');
// // Set up Express app
// const app = express();
// const port = 1002;

// // Middleware
// app.use(bodyParser.json());
// // res.setHeader('Access-Control-Allow-Origin', '*');

// app.use(
//   cors({
//     origin: "https://ecommerceflashsale.netlify.app",
//     credentials: true,
//   })
// );

// app.use(
//   session({
//     secret: "some-secret",
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/registerDetails' }),
//     cookie: {
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//       maxAge: 24 * 60 * 60 * 1000
//     },
//   })
// );

// // Middleware to check authentication
// // function checkAuth(req, res, next) {
// //   if (req.session.user) {
// //     next();
// //   } else {
// //     res.status(403).json({ error: "Unauthorized" });
// //   }
// // }

// function checkAuth(req, res, next) {
//   console.log('Session ID:', req.sessionID);
//   console.log('Session:', req.session);
//   console.log('User:', req.session.user);
//   if (req.session.user) {
//     console.log('User authenticated');
//     next();
//   } else {
//     console.log('User not authenticated');
//     res.status(403).json({ error: "Unauthorized" });
//   }
// }

// // Check authentication
// app.get("/api/check-auth", checkAuth, (req, res) => {
//   res.json({ message: "You are authorized", user: req.session.user });
// });

// // Login endpoint
// app.post("/api/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await Transactions.findOne({ email, password });
//     if (user) {
//       // req.session.user = user;
//       req.session.user = {
//         id: user._id,
//         username: user.username
//       };
//       res.json({ message: "Login successful" });
//     } else {
//       res.status(401).json({ error: "Invalid credentials" });
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Registration endpoint
// app.post("/api/register", async (req, res) => {
//   const { name, email, password } = req.body;
//   const newTransactions = new Transactions({ name, email, password });
//   try {
//     await newTransactions.save();
//     res.status(201).json({ message: "Registration successful. Please log in." });
//   } catch (error) {
//     console.error("Error saving Transactions:", error);
//     res.status(500).json({ error: "Failed to record Transactions." });
//   }
// });

// // Get product quantity
// app.get("/api/product/:name", async (req, res) => {
//   try {
//     const productName = req.params.name;
//     if (!productName) {
//       return res.status(400).json({ error: "Product name is required" });
//     }
//     const qty = await client.get(`inventory:${productName}`)
//     if (qty === null) {
//       return res.status(404).json({ error: "Product not found" });
//     }
//     res.json(parseInt(qty));
//   } catch (error) {
//     console.error("Error fetching product:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.post("/api/cart/add", checkAuth, async (req, res) => {
//   try {
//     const { name, qty = 1 } = req.body;
//     const userId = req.session.user._id;
//     if (!name) {
//       return res.status(400).json({ error: "Product name is required" });
//     }
//     const InventoryQty = await client.get(`inventory:${name}`);
//     if (InventoryQty <= 0) {
//       return res.status(400).json({ error: "Product out of stock" });
//     }
//     // Add to user's reservation

//     const reservationKey = `reservation:${userId}:${name}`;
//     let reservationQty = await client.get(reservationKey);
//     if (typeof reservationQty === "object") {
//       await client.set(reservationKey, 0)
//       await client.hset(`reservations:${name}`, userId, 0);
//       reservationQty = 0;
//     }
//     console.log(InventoryQty, "1111111>>>>>>>>>>>", reservationQty)
//     await setReservation(userId, name, qty)
//     res.json({ qty: InventoryQty, reserved: qty });
//   } catch (error) {
//     console.error("Error adding to cart:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.post("/api/cart/sub", checkAuth, async (req, res) => {
//   try {
//     const { name, qty = 1 } = req.body;
//     const userId = req.session.user._id;
//     if (!name) {
//       return res.status(400).json({ error: "Product name is required" });
//     }
//     const InventoryQty = await client.get(`inventory:${name}`);
//     // if (InventoryQty <= 0) {
//     //   return res.status(400).json({ error: "Product out of stock" });
//     // }
//     // Add to user's reservation

//     const reservationKey = `reservation:${userId}:${name}`;
//     let reservationQty = await client.get(reservationKey);
//     if (typeof reservationQty === "object") {
//       console.log(InventoryQty, "1111111>>>>>>>>>>>", reservationQty)
//       return res.status(400).json({ error: "Product out of stock" });
//     }
//     await releaseReservation(userId, name, qty)
//     res.json({ qty: InventoryQty, reserved: qty });
//   } catch (error) {
//     console.error("Error adding to cart:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.post("/api/purchase", checkAuth, async (req, res) => {
//   try {
//     const userId = req.session.user._id;
//     const data = await purchase(userId);
//     const oid = mongoose.Types.ObjectId.createFromHexString(userId);

//     // Find the user's transaction document to check existing orders
//     const existingTransaction = await Transactions.findOne({ _id: oid });

//     // Determine the next order number
//     let nextOrderNumber = 1;
//     if (existingTransaction) {
//       // Get all top-level order keys (e.g., order1, order2)
//       const orderKeys = Object.keys(existingTransaction.toObject()).filter(key => key.startsWith('order'));
//       if (orderKeys.length > 0) {
//         // Extract numbers from order keys and find the highest
//         const orderNumbers = orderKeys.map(key => parseInt(key.replace('order', '')));
//         nextOrderNumber = Math.max(...orderNumbers) + 1;
//       }
//     }

//     // Construct the dynamic field name (e.g., order1.orderDetails)
//     const fieldName = `order${nextOrderNumber}`;

//     // Update the document with the new order details
//     const result = await Transactions.updateOne(
//       { _id: oid },
//       { $set: { [fieldName]: data } },
//       { upsert: true, strict: false }
//     );

//     console.log("UpdateResult:", result);
//     console.log("Inserted data for:", fieldName, data);

//     res.json({ productDetails: data });
//   } catch (error) {
//     console.error("Error during purchase:", error);
//     res.status(500).json({ error: 'Server error during purchase.' });
//   }
// });

// app.post("/api/qtyUpdate", checkAuth, async (req, res) => {
//   try {
//     const { name, currentQty } = req.body;
//     if (!name || currentQty === undefined) {
//       return res.status(400).json({ error: "Product name and quantity are required" });
//     }
//     await client.set(`inventory:${name}`, currentQty);
//     res.json({ qty: currentQty });
//   } catch (error) {
//     console.error("Error updating quantity:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Test route
// app.get("/", (req, res) => {
//   res.send("Server is running!");
// });

// app.listen(port, "127.0.0.1", () => {
//   console.log(`Server started on http://127.0.0.1:${port}`);
// }).on("error", (err) => {
//   console.error("Server failed to start:", err);
// });