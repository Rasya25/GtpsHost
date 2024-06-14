require('dotenv').config();
const TeleBot = require('node-telegram-bot-api');
const fs = require('fs');
const utils = require('./utils');
const path = require('path');

const bot = new TeleBot(process.env.TOKEN, { polling: true });
let userState = {};
try {
    const userStateFile = fs.readFileSync('./database/userState.json');
    userState = JSON.parse(userStateFile);
} catch (error) {
    console.log('No existing userState found. Starting with an empty state.');
}

const defaultButton = [
    [
        {
            text: 'Host List',
            callback_data: 'hostList',
        },
        {
            text: 'Help',
            callback_data: 'help',
        },
    ],
];

/**
 * Creates default user data in the database if the user is not already registered.
 * @param {string} username - The username of the user.
 * @param {number} chatId - The chat ID of the user.
 */
function defaultUsersData(username, chatId) {
    // Read the database file
    const users = JSON.parse(fs.readFileSync('./database/users.json', 'utf-8'));

    // Check if the user is already registered
    if (!users[username]) {
        // If not, create default user data
        users[username] = {
            chatId: chatId,
            hostList: [],
        };

        // Write the updated user data back to the database file
        fs.writeFileSync(
            './database/users.json',
            JSON.stringify(users, null, 2),
        );
    }
}

/**
 * Saves the user state to the userState.json file.
 *
 * This function writes the userState object directly to the userState.json
 * file. The userState object contains the state of the bot for each user,
 * including their message ID, state, and any other relevant data.
 */
function saveUserState() {
    fs.writeFileSync(
        './database/userState.json',
        JSON.stringify(userState, null, 2),
    );
}

bot.onText(/\/start/, msg => {
    const chatId = msg.chat.id;

    // Check if the user has a username
    if (msg.from.username === undefined) {
        return bot.sendMessage(
            chatId,
            'Please set your username to use this bot.',
        );
    }

    // Check if the user is already registered
    if (!utils.isUserExist(msg.from.username)) {
        defaultUsersData(msg.from.username, msg.chat.id);

        bot.sendPhoto(chatId, './assets/banner.png', {
            caption: `
        *• Welcome ${msg.from.username} •*
━━━━━━━━━━━━━━━━━━

You're now registered to the bot.

You can now use the bot feature by clicking the button below.

━━━━━━━━━━━━━━━━━━
`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: defaultButton,
            },
        });
    } else {
        bot.sendPhoto(chatId, './assets/banner.png', {
            caption: `
        *• Welcome ${msg.from.username} •*
━━━━━━━━━━━━━━━━━━

You can now use the bot feature by clicking the button below.

━━━━━━━━━━━━━━━━━━
`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: defaultButton,
            },
        });
    }
});

bot.onText(/\/add/, msg => {
    const chatId = msg.chat.id;
    const [command, hostName, hostAddress] = msg.text.split(' ');

    if (hostName === undefined || hostAddress === undefined) {
        return bot.sendMessage(
            chatId,
            'Please enter the host name and address.',
        );
    }

    const databaseFile = fs.readFileSync('./database/users.json');

    let users = JSON.parse(databaseFile);

    // Check if the host already exists
    if (utils.isHostExist(hostName)) {
        return bot.sendMessage(chatId, 'Host already exists.');
    } else if (users[msg.from.username].hostList.includes(hostName)) {
        return bot.sendMessage(
            chatId,
            'You already have a host with the same name.',
        );
    }

    // Add confirmation message using userState
    userState[chatId] = {
        state: 'WAITING_HOST_CONFIRMATION',
        data: {
            hostName: hostName,
            hostAddress: hostAddress,
        },
    };
    saveUserState();

    bot.sendPhoto(chatId, './assets/banner.png', {
        caption: `
            *• Add Host •*
━━━━━━━━━━━━━━━━━━

Host Name: ${userState[chatId].data.hostName}
Host Address: \`\`\`php
${utils.generateHostData(userState[chatId].data.hostAddress)}\`\`\`

━━━━━━━━━━━━━━━━━━

Do you want to add this host?`,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Yes',
                        callback_data: 'writeHost',
                    },
                    {
                        text: 'No',
                        callback_data: 'cancel',
                    },
                ],
            ],
        },
    });
});

bot.onText(/\/remove/, msg => {
    const chatId = msg.chat.id;

    if (utils.isHostOnUser(msg.from.username, msg.text)) {
        bot.sendPhoto(chatId, './assets/banner.png', {
            caption: `
            *• Remove Host •*
━━━━━━━━━━━━━━━━━━

Host Name: ${msg.text}

━━━━━━━━━━━━━━━━━━

Do you want to remove this host?`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Yes',
                            callback_data: 'removeHost',
                        },
                        {
                            text: 'No',
                            callback_data: 'cancel',
                        },
                    ],
                ],
            },
        });
    } else {
        return bot.sendPhoto(chatId, './assets/banner.png', {
            caption: `Host are not on your list, check again using button below.`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: defaultButton,
            },
        });
    }
});

// TODO: Removing unsused callback_data
bot.on('message', msg => {
    const chatId = msg.chat.id;

    // Logger for messages
    const logMessage = `[MSG] ${msg.from.username} (${msg.from.id}): ${msg.text}`;
    console.log(logMessage);

    if (userState[chatId] && userState[chatId].state === 'WAITING_HOST_NAME') {
        // Add filter for the host name, only allow alphanumeric characters and -
        if (msg.text.match(/[^a-zA-Z0-9-]/)) {
            return bot.sendMessage(
                chatId,
                'Host name can only contain alphanumeric characters and -.',
            );
        }

        const databaseFile = fs.readFileSync('./database/users.json');

        let users = JSON.parse(databaseFile);
        let hostName = msg.text;
        console.log(hostName);

        // Check if the host already exists
        if (utils.isHostExist(hostName)) {
            return bot.sendMessage(
                chatId,
                'Host already exists, please use another name.',
            );
        } else if (users[msg.from.username].hostList.includes(hostName)) {
            return bot.sendMessage(
                chatId,
                'You already have a host with the same name.',
            );
        }

        // Save the host name to the userState
        userState[chatId] = {
            state: 'WAITING_HOST_ADDRESS',
            messageId: userState[chatId].messageId,
            data: {
                hostName: hostName,
            },
        };
        saveUserState();

        bot.editMessageCaption(
            `
        *• Add Host •*
━━━━━━━━━━━━━━━━━━

Please enter the host address you want to add.

━━━━━━━━━━━━━━━━━━`,
            {
                chat_id: chatId,
                message_id: userState[chatId].messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Cancel',
                                callback_data: 'cancel',
                            },
                        ],
                    ],
                },
            },
        );
    } else if (
        userState[chatId] &&
        userState[chatId].state === 'WAITING_HOST_ADDRESS'
    ) {
        // Add filter for the host address, only allow alphanumeric characters and .
        if (msg.text.match(/[^a-zA-Z0-9.]/)) {
            return bot.sendMessage(
                chatId,
                'Host address can only contain alphanumeric characters and .',
            );
        }

        const userFile = fs.readFileSync('./database/users.json');
        const hostFolder = './database/hosts/';
        const hostAddress = msg.text;

        let users = JSON.parse(userFile);
        let data = userState[chatId].data;

        // Check if the host already exists
        if (utils.isHostExist(msg.text)) {
            return bot.sendMessage(chatId, 'Host already exists.');
        } else if (users[msg.from.username].hostList.includes(data.hostName)) {
            return bot.sendMessage(
                chatId,
                'You already have a host with the same name.',
            );
        }

        // Add the host to the user's host list
        users[msg.from.username].hostList.push(data.hostName);

        // Create the host file
        const hostData = `${hostAddress} www.growtopia1.com
${hostAddress} www.growtopia2.com
${hostAddress} growtopia1.com
${hostAddress} growtopia2.com
${hostAddress} YoruAkio`;

        fs.writeFileSync('./database/users.json', JSON.stringify(users));
        fs.writeFileSync(`${hostFolder}${data.hostName}.txt`, hostData);

        bot.sendMessage(chatId, 'Host address added successfully.');

        bot.editMessageCaption(
            `
        *• Welcome ${msg.from.username} •*
━━━━━━━━━━━━━━━━━━

Host address added successfully.

You can use the bot feature by clicking the button below.

━━━━━━━━━━━━━━━━━━
`,
            {
                chat_id: chatId,
                message_id: userState[chatId].messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: defaultButton,
                },
            },
        );

        delete userState[chatId];
        saveUserState();
    } else if (
        userState[chatId] &&
        userState[chatId].state === 'WAITING_HOST_CONFIRMATION'
    ) {
        console.log(userState[chatId].data);
    }
});

bot.on('callback_query', query => {
    const [action, ...args] = query.data.split('_');
    const chatId = query.message.chat.id;

    // Logger for buttons callback
    const logButton = `[BTN] ${query.from.username} (${query.from.id}): ${query.data}`;
    console.log(logButton);

    switch (action) {
        case 'addHosts': {
            bot.editMessageCaption(
                `
                *• Add Host •*
━━━━━━━━━━━━━━━━━━

Please enter the host name you want to add.

━━━━━━━━━━━━━━━━━━
                `,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Cancel',
                                    callback_data: 'cancel',
                                },
                            ],
                        ],
                    },
                },
            );

            userState[chatId] = {
                state: 'WAITING_HOST_NAME',
                messageId: query.message.message_id,
            };
            saveUserState();

            bot.answerCallbackQuery(query.id, {
                text: 'Please enter the name of the host you want to add.',
            });
            break;
        }
        case 'host': {
            const [action, direction, page] = query.data.split('_');
            let newPage = Number(page);
            const totalPages = utils.getHostTotalPage(query.from.username);

            if (direction === 'prev' && newPage > 0) {
                newPage -= 1;
            } else if (direction === 'next' && newPage < totalPages - 1) {
                newPage += 1;
            }

            let message = `Hosts: Page (${newPage + 1} / ${totalPages + 1})\n`;

            if (newPage !== Number(page)) {
                const hosts = utils.getHostOnPage(query.from.username, newPage);

                hosts.forEach((host, index) => {
                    message += `${index + 1}. ${host}.txt\n`;
                });
            }

            bot.editMessageCaption(
                `
                *• Host List •*
━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━`,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Prev',
                                    callback_data:
                                        newPage > 0
                                            ? `host_prev_${newPage}`
                                            : 'null',
                                },
                                {
                                    text: 'Page: ' + (newPage + 1),
                                    callback_data: 'null',
                                },
                                {
                                    text: 'Next',
                                    callback_data:
                                        newPage < totalPages - 1
                                            ? `host_next_${newPage}`
                                            : 'null',
                                },
                            ],
                            [
                                {
                                    text: 'Cancel',
                                    callback_data: 'cancel',
                                },
                            ],
                        ],
                    },
                },
            );

            break;
        }
        case 'hostList': {
            const page = 0;
            const hosts = utils.getHostOnPage(query.from.username, page);
            const totalPages = utils.getHostTotalPage(query.from.username);
            let message = `Hosts: Page (${page + 1} / ${totalPages + 1})\n`;

            hosts.forEach((host, index) => {
                message += `${index + 1}. ${host}.txt\n`;
            });

            // message += `Last updated: ${new Date().toLocaleString()}`;

            bot.editMessageCaption(
                `
                *• Host List •*
━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━`,

                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Prev',
                                    callback_data: `host_prev_${page}`,
                                },
                                {
                                    text: 'Page: ' + (page + 1),
                                    callback_data: 'null',
                                },
                                {
                                    text: 'Next',
                                    callback_data: `host_next_${page}`,
                                },
                            ],
                            [
                                {
                                    text: 'Cancel',
                                    callback_data: 'cancel',
                                },
                            ],
                        ],
                    },
                },
            );

            break;
        }
        case 'help': {
            bot.sendMessage(chatId, 'Help');

            userState[chatId] = {
                state: 'HELP',
                messageId: query.message.message_id,
            };
            break;
        }
        case 'writeHost': {
            const hostData = userState[chatId].data;
            const username = query.from.username;

            const writeHost = utils.writeHostsFile(
                username,
                hostData.hostName,
                hostData.hostAddress,
            );

            bot.sendMessage(chatId, writeHost);

            bot.answerCallbackQuery(query.id);
            break;
        }
        case 'cancel': {
            bot.editMessageCaption(
                `
                *• Welcome ${query.from.username} •*
━━━━━━━━━━━━━━━━━━

You can use the bot feature by clicking the button below.

━━━━━━━━━━━━━━━━━━
                `,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: defaultButton,
                    },
                },
            );
            bot.answerCallbackQuery(query.id, {
                text: 'Canceled',
            });
            break;
        }
        case 'null': {
            bot.answerCallbackQuery(query.id);
            break;
        }
    }
});

bot.on('polling_error', error => {
    console.log(error);
});
