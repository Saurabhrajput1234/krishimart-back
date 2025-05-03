const express = require("express");
const ErrorHandler = require("./middleware/error");
const connectDatabase = require("./db/Database");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit"); 

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}


connectDatabase();

app.use(helmet()); 

// Limit each IP to 100 requests per 15 mins
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());

app.use(cors());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin); 
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.get("/test", (req, res) => {
  res.send("Hello World!");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const message = require("./controller/message");
const conversation = require("./controller/conversation");
const withdraw = require("./controller/withdraw");
const chatbotRoutes = require("./controller/chatbotRoutes");

// Endpoints
app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/chatbot", chatbotRoutes);

// Error middleware
app.use(ErrorHandler);

// Start the server
const server = app.listen(process.env.PORT || 3002, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

// Handling Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling UNCAUGHT EXCEPTION!`);
});

// Handling Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
