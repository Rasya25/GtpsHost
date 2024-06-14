const fs = require('fs');
const path = require('path');
const databaseFile = fs.readFileSync('./database/users.json');
const hostFolder = './database/hosts/';
delete require.cache[require.resolve('./database/users.json')];

/**
 * Checks if a user exists in the database.
 *
 * @param {string} username - The username of the user to check.
 * @return {boolean} Returns true if the user exists, false otherwise.
 */
function isUserExist(username) {
    // Parse the database file and store it in the users variable
    let users = JSON.parse(databaseFile);

    // Check if the user exists in the database
    if (users[username]) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if a host file exists for a given host name.
 *
 * @param {string} hostName - The name of the host to check.
 * @return {boolean} Returns true if a host file exists for the given host name, false otherwise.
 */
function isHostExist(hostName) {
    // Convert hostName to lowercase to prevent case sensitive
    hostName = hostName.toLowerCase();

    // Check if a file exists for the given host name
    if (fs.existsSync(`${hostFolder}${hostName}.txt`)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if a given host is present in the list of hosts associated with a user.
 *
 * @param {string} username - The username of the user.
 * @param {string} hostName - The name of the host.
 * @return {boolean} Returns true if the host is associated with the user, false otherwise.
 */
function isHostOnUser(username, hostName) {
    // Parse the database file and store it in the users variable
    let users = JSON.parse(databaseFile);

    // Get the list of hosts associated with the user
    let hosts = users[username]['hostList'];

    // Check if the given host is present in the list of hosts
    // associated with the user
    if (hosts.includes(hostName)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Returns the total number of pages needed to display all the hosts
 * associated with a user.
 *
 * @param {string} username - The username of the user.
 * @return {number} The total number of pages needed to display all the hosts.
 */
function getHostTotalPage(username) {
    // Parse the database file and store it in the users variable
    let users = JSON.parse(databaseFile);

    // Get the list of hosts associated with the user
    let hosts = users[username]['hostList'];

    // Calculate the total number of pages needed to display all the hosts
    // and round up to the nearest integer
    return Math.ceil(hosts.length / 5);
}

/**
 * Returns a subset of hosts associated with a user.
 *
 * @param {string} username - The username of the user.
 * @param {number} page - The index of the page to display.
 * @return {Array} An array of hosts on the specified page.
 */
function getHostOnPage(username, page) {
    // Parse the database file and store it in the users variable
    let users = JSON.parse(databaseFile);

    // Get the list of hosts associated with the user
    let hosts = users[username]['hostList'];

    // Extract the hosts on the specified page
    return hosts.slice(page * 5, (page + 1) * 5);
}

/**
 * Generates the host data for a given host address.
 *
 * @param {string} hostAddress - The host address.
 * @return {string} The generated host data.
 */
function generateHostData(hostAddress) {
    // Construct the host data string with the given host address
    // and the various host names.
    const hostData = `${hostAddress} www.growtopia1.com\n${hostAddress} www.growtopia2.com\n${hostAddress} growtopia1.com\n${hostAddress} growtopia2.com\n${hostAddress} YoruAkio`;

    return hostData;
}

/**
 * Writes a host file for a given user and host name.
 *
 * @param {string} username - The username of the user.
 * @param {string} hostName - The name of the host.
 * @param {string} hostAddress - The address of the host.
 * @return {string} A success message if the host is created, or an error message if the host already exists.
 */
function writeHostsFile(username, hostName, hostAddress) {
    // Check if the host already exists
    if (isHostExist(hostName)) {
        return `Host ${hostName} already exist!`;
    }
    // Check if the host is already on the user's list
    else if (isHostOnUser(username, hostName)) {
        return `Host ${hostName} already on your list!`;
    }

    // Generate the host data
    const hostData = generateHostData(hostAddress);
    // Ensure the database file is read correctly each time
    const databaseFilePath = path.resolve('./database/users.json');
    const usersData = fs.readFileSync(databaseFilePath, 'utf8');
    const users = JSON.parse(usersData);

    // Check if the user exists and has a hostList, if not, initialize it
    if (!users[username]) {
        users[username] = { hostList: [] };
    }
    // Check if the hostList is not defined, if not, initialize it
    else if (!users[username].hostList) {
        users[username].hostList = [];
    }

    // Add the host to the user's host list
    users[username].hostList.push(hostName);

    // Write the updated user data back to the database file
    fs.writeFileSync(databaseFilePath, JSON.stringify(users, null, 2)); // Pretty print JSON
    // Write the host data to the host file
    fs.writeFileSync(`${hostFolder}${hostName}.txt`, hostData);

    // Return a success message
    return `Host ${hostName} has been created!`;
}

module.exports = {
    isUserExist,
    isHostExist,
    isHostOnUser,
    getHostTotalPage,
    getHostOnPage,
    writeHostsFile,
    generateHostData,
};
