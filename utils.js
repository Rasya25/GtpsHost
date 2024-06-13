const fs = require('fs');
const path = require('path');
const databaseFile = fs.readFileSync('./database/users.json');
const hostFolder = './database/hosts/';
delete require.cache[require.resolve('./database/users.json')];

function isUserExist(username) {
    let users = JSON.parse(databaseFile);

    if (users[username]) {
        return true;
    } else {
        return false;
    }
}

function isHostExist(hostName) {
    hostName = hostName.toLowerCase(); // Convert hostName to lowercase to prevent case sensitive
    if (fs.existsSync(`${hostFolder}${hostName}.txt`)) {
        return true;
    } else {
        return false;
    }
}

function isHostOnUser(username, hostName) {
    let users = JSON.parse(databaseFile);
    let hosts = users[username]['hostList'];

    if (hosts.includes(hostName)) {
        return true;
    } else {
        return false;
    }
}

function getHostTotalPage(username) {
    let users = JSON.parse(databaseFile);
    let hosts = users[username]['hostList'];
    return Math.ceil(hosts.length / 5);
}

function getHostOnPage(username, page) {
    let users = JSON.parse(databaseFile);
    let hosts = users[username]['hostList'];
    return hosts.slice(page * 5, (page + 1) * 5);
}

function generateHostData(hostAddress) {
    const hostData = `${hostAddress} www.growtopia1.com\n${hostAddress} www.growtopia2.com\n${hostAddress} growtopia1.com\n${hostAddress} growtopia2.com\n${hostAddress} YoruAkio`;

    return hostData;
}

function writeHostsFile(username, hostName, hostAddress) {
    if (isHostExist(hostName)) {
        return `Host ${hostName} already exist!`;
    } else if (isHostOnUser(username, hostName)) {
        return `Host ${hostName} already on your list!`;
    }

    const hostData = generateHostData(hostAddress);
    // Ensure the database file is read correctly each time
    const databaseFilePath = path.resolve('./database/users.json');
    const usersData = fs.readFileSync(databaseFilePath, 'utf8');
    const users = JSON.parse(usersData);

    // Check if the user exists and has a hostList, if not, initialize it
    if (!users[username]) {
        users[username] = { hostList: [] };
    } else if (!users[username].hostList) {
        users[username].hostList = [];
    }

    users[username].hostList.push(hostName);

    fs.writeFileSync(databaseFilePath, JSON.stringify(users, null, 2)); // Pretty print JSON
    fs.writeFileSync(`${hostFolder}${hostName}.txt`, hostData);

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
