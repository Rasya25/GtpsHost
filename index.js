require('dotenv').config();
const TeleBot = require('node-telegram-bot-api');
const fs = require('fs');
const utils = require('./utils');
const path = require('path');
delete require.cache[require.resolve('./database/users.json')];

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
    const [command, hostName] = msg.text.split(' ');
    console.log(`Command: ${command}, Host Name: ${hostName}`);

    if (!utils.isHostOnUser(msg.from.username, msg.text)) {
        bot.sendPhoto(chatId, './assets/banner.png', {
            caption: `
            *• Remove Host •*
━━━━━━━━━━━━━━━━━━

Host Name: *${hostName}*

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

        userState[chatId] = {
            state: 'WAITING_HOST_REMOVE',
            data: {
                hostName: hostName,
            },
        };
        saveUserState();
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

    if (
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
        case 'removeHost': {
            const hostName = userState[chatId].data.hostName;

            if (!hostName) {
                return bot.sendMessage(
                    chatId,
                    'Something went wrong. Please try again.',
                );
            }

            const users = JSON.parse(
                fs.readFileSync('./database/users.json', 'utf-8'),
            );
            const hostFolder = './database/hosts/';

            if (!fs.existsSync(`${hostFolder}${hostName}.txt`)) {
                return bot.sendMessage(chatId, 'Host not found.');
            }

            users[query.from.username].hostList = users[
                query.from.username
            ].hostList.filter(host => host !== hostName);

            fs.unlinkSync(`${hostFolder}${hostName}.txt`);
            fs.writeFileSync('./database/users.json', JSON.stringify(users));

            bot.editMessageCaption(
                `
                *• Remove Host •*
━━━━━━━━━━━━━━━━━━

Host: ${hostName} has been removed successfully.

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
                text: 'Host has been removed successfully.',
            });
            break;
        }
        case 'host': {
            const [action, direction, page] = query.data.split('_');
            let newPage = Math.max(
                0,
                Math.min(
                    utils.getHostTotalPage(query.from.username) - 1,
                    Number(page) + (direction === 'next' ? 1 : -1),
                ),
            );

            const hosts = utils.getHostOnPage(query.from.username, newPage);
            const message =
                `Hosts: Page (${newPage + 1} / ${utils.getHostTotalPage(
                    query.from.username,
                )})\n` +
                hosts
                    .map((host, index) => `${index + 1}. ${host}.txt\n`)
                    .join('');

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
                                        newPage <
                                        utils.getHostTotalPage(
                                            query.from.username,
                                        ) -
                                            1
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
