require('dotenv').config();
const TeleBot = require('node-telegram-bot-api');
const fs = require('fs');
const utils = require('./utils');
const path = require('path');

const bot = new TeleBot(process.env.TOKEN, { polling: true });
const userState = {};

const defaultButton = [
    [
        {
            text: 'Add Host',
            callback_data: 'addHosts',
        },
        {
            text: 'Host List',
            callback_data: 'hostList',
        },
    ],
    [
        {
            text: 'Remove Host',
            callback_data: 'removeHosts',
        },
        {
            text: 'Help',
            callback_data: 'help',
        },
    ],
];
const hostFilePath = path.join(__dirname, 'database', 'users.json');

function getTotalPage(username) {
    let users = JSON.parse(fs.readFileSync(hostFilePath));
    let hosts = users[username]['hostList'];
    return Math.ceil(hosts.length / 5);
}

function getHostsPage(username, page) {
    let users = JSON.parse(fs.readFileSync(hostFilePath));
    let hosts = users[username]['hostList'];
    return hosts.slice(page * 5, (page + 1) * 5);
}

function defaultUsersData(username, chatId) {
    const databaseFile = fs.readFileSync('./database/users.json');

    let users = JSON.parse(databaseFile);

    if (!users[username]) {
        users[username] = {
            chatId: chatId,
            hostList: [],
        };

        fs.writeFileSync('./database/users.json', JSON.stringify(users));
    } else {
        return;
        // bot.sendMessage(chatId, "You're already registered.");
    }
}

bot.onText(/\/test/, msg => {
    const chatId = msg.chat.id;

    bot.sendPhoto(chatId, './assets/banner.png', {
        caption: `
        *• Welcome ${msg.from.username} •*
━━━━━━━━━━━━━━━━━━

You can now use the bot feature by clicking the button below.

━━━━━━━━━━━━━━━━━━
`,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Add Host',
                        callback_data: 'addHosts',
                    },
                    {
                        text: 'Host List',
                        callback_data: 'hostList',
                    },
                ],
                [
                    {
                        text: 'Remove Host',
                        callback_data: 'removeHosts',
                    },
                    {
                        text: 'Help',
                        callback_data: 'null',
                    },
                    {
                        text: 'Help',
                        callback_data: 'help',
                    },
                ],
            ],
        },
    });
});

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

bot.on('message', msg => {
    const chatId = msg.chat.id;

    if (userState[chatId] && userState[chatId].state === 'HELP') {
        bot.sendMessage(chatId, 'Help Message');

        delete userState[chatId];
    } else if (
        userState[chatId] &&
        userState[chatId].state === 'WAITING_HOST_NAME'
    ) {
        // Add filter for the host name, only allow alphanumeric characters and -
        if (msg.text.match(/[^a-zA-Z0-9-]/)) {
            return bot.sendMessage(
                chatId,
                'Host name can only contain alphanumeric characters and -.',
            );
        }

        const databaseFile = fs.readFileSync('./database/users.json');

        let users = JSON.parse(databaseFile);

        // Check if the host already exists
        if (utils.isHostExist(msg.text)) {
            bot.sendMessage(
                chatId,
                'Host already exists, please use another name.',
            );
        } else if (users[msg.from.username].hostList.includes(msg.text)) {
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
                hostName: msg.text,
            },
        };

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
    }
});

bot.on('callback_query', query => {
    const [action, ...args] = query.data.split('_');
    const chatId = query.message.chat.id;

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

            let message = 'Hosts: \n\n';

            if (newPage !== Number(page)) {
                const hosts = utils.getHostOnPage(query.from.username, newPage);

                hosts.forEach((host, index) => {
                    message += `${index + 1}. ${host}.txt\n`;
                });
            }

            message += `Last updated: ${new Date().toLocaleString()}`;

            bot.editMessageCaption(
                `
            *• Host List •*
━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━
            
            Page ${newPage + 1} of ${totalPages}`,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Next',
                                    callback_data: `host_next_${newPage}`,
                                },
                                {
                                    text: 'Page: ' + (newPage + 1),
                                    callback_data: 'null',
                                },
                                {
                                    text: 'Previous',
                                    callback_data: `host_prev_${newPage}`,
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
            let message = 'Hosts: \n\n';

            hosts.forEach((host, index) => {
                message += `${index + 1}. ${host}.txt\n`;
            });

            message += `Last updated: ${new Date().toLocaleString()}`;

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
                                    text: 'Next',
                                    callback_data: `host_next_${page}`,
                                },
                                {
                                    text: 'Page: ' + (page + 1),
                                    callback_data: 'null',
                                },
                                {
                                    text: 'Previous',
                                    callback_data: `host_prev_${page}`,
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
        case 'removeHosts': {
            bot.sendMessage(chatId, 'Remove Hosts');
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
