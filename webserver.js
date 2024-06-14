// Import the express module to create an HTTP server
const express = require('express');
// Import the path module to work with file paths
const path = require('path');

// Create an instance of the express application
const app = express();

// Join the directory path of the current file with the 'database' and 'hosts' folder paths
// This will give us the path to the directory where the host files are stored
const hostFolderPath = path.join(__dirname, 'database', 'hosts');

// Define a route for handling GET requests to '/hosts/:hostName'
// Express uses a middleware function to handle the request and response objects
app.get('/hosts/:hostName', (req, res) => {
    // Destructure the hostName property from the request parameters object
    const { hostName } = req.params;
    // Join the hostFolderPath with the hostName and '.txt' to form the file path
    const hostFilePath = path.join(hostFolderPath, `${hostName}.txt`);

    // Send the file at the specified file path as the response to the client
    // The sendFile method handles the streaming of the file to the client
    // If there is an error, set the response status to 404 and send the string 'Host not found'
    res.sendFile(hostFilePath, err => {
        if (err) {
            res.status(404).send('Host not found');
        }
    });
});

// Start the server and listen on port 3000
// The callback function is called when the server has started successfully
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
