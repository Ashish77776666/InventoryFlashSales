const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const { Transactions, db, mongoose } = require("./mongodbClient");

// Set up Express app
const app = express();
const port = 1002;

// Middleware
app.use(bodyParser.json());

// Use cors middleware for proper CORS handling
app.use(cors({
    origin: 'https://ecommerceflashsale.netlify.app', // Your Netlify site URL
    credentials: true // Allow cookies for session management
}));

// Session configuration
app.use(session({
    secret: 'your-strong-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Use HTTPS (ngrok provides HTTPS)
        httpOnly: true,
        sameSite: 'none' // Allow cross-site requests
    }
}));

// Logging middleware (optional, for debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.headers.origin}`);
    next();
});

// Middleware to check authentication
function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(403).json({ error: "Unauthorized" });
    }
}

function checkAuth(req, res, next) {
    console.log('Session:', req.session);
    console.log('User:', req.session.user);
    if (req.session.user) {
        console.log('User authenticated');
        next();
    } else {
        console.log('User not authenticated');
        res.status(403).json({ error: "Unauthorized" });
    }
}
// Check authentication endpoint
// app.get("/api/check-auth", checkAuth, (req, res) => {
//     res.json({ message: "You are authorized", user: req.session.user });
// });

app.get("/api/check-auth", (req, res) => {
    console.log('Check-auth endpoint hit, session:', req.session);
    res.json({ message: "You are authorized", user: req.session.user || null });
  });

// app.get("/api/check-auth", checkAuth, (req, res) => {
//     console.log('Check-auth endpoint hit, user:', req.session.user);
//     res.json({ message: "You are authorized", user: req.session.user });
// });
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

// Login endpoint
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Transactions.findOne({ email, password });
        if (user) {
            req.session.user = user;
            res.json({ message: "Login successful" });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Test route (optional, for debugging)
app.get("/", (req, res) => {
    res.send("Server is running!");
});

// Start the server
app.listen(port, "127.0.0.1", () => {
    console.log(`Server started on http://127.0.0.1:${port}`);
}).on("error", (err) => {
    console.error("Server failed to start:", err);
});