const express = require('express');
const path = require('path');
const app = express();
const hostFolderPath = path.join(__dirname, 'database', 'hosts');

// Define a route for handling GET requests to '/hosts/:hostName'
// Express uses a middleware function to handle the request and response objects
app.get('/hosts/:hostName', (req, res) => {
    
    const { hostName } = req.params;
    
    const hostFilePath = path.join(hostFolderPath, `${hostName}.txt`);
    res.sendFile(hostFilePath, err => {
        if (err) {
            res.status(404).send('Host not found');
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
// kembangin aja ini, taruh wm gw ya Rasya R.