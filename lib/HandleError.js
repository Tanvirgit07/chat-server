const handleError = (statusCode, message) =>  {
    const error = new Error;
    error.statusCode = statusCode;
    error.message = message;
}

module.exports = handleError;