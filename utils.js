const fs = require('fs');
const databaseFile = fs.readFileSync('./database/users.json');
const hostFolder = './database/hosts/';

function isUserExist(username) {
    let users = JSON.parse(databaseFile);

    if (users[username]) {
        return true;
    } else {
        return false;
    }
}

function isHostExist(hostName) {
    if (fs.existsSync(`${hostFolder}${hostName}.txt`)) {
        return true;
    } else {
        return false;
    }
}

function getHostTotalPage(username) {
    let users = JSON.parse(databaseFile);
    console.log(users);
    let hosts = users[username]['hostList'];
    return Math.ceil(hosts.length / 5);
}

function getHostOnPage(username, page) {
    let users = JSON.parse(databaseFile);
    // console.log(users);
    let hosts = users[username]['hostList'];
    // console.log(hosts.slice(page * 5, (page + 1) * 5));
    return hosts.slice(page * 5, (page + 1) * 5);
}

module.exports = {
    isUserExist,
    isHostExist,
    getHostTotalPage,
    getHostOnPage,
};
