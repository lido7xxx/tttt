const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs').promises;
const path = require('path');

const abc = "1234567890";
const dev = 1234567890; // Replace with your WhatsApp number

let data = {};
let timer = {};
const rateb_list = [
    "الوظيفة : رائد فضاء 👨‍🚀  \n الراتب : 20000 ريال",
    "الوظيفة : مبرمج 👨‍💻  \n الراتب : 13000 ريال",
    "الوظيفة : مصاص دماء 🧛‍♂️  \n الراتب : 7500 ريال",
    "الوظيفة : قاضي 👨‍⚖️  \n الراتب : 8600 ريال",
    "الوظيفة : ملازم 👮‍♂️  \n الراتب : 9000 ريال",
    "الوظيفة : طيار 👨‍✈️  \n الراتب : 12000 ريال"
];

const aksht = {};
const akshtt = [];

function timerSet(item, userId, timer, timeType, time) {
    const now = new Date();
    let delta;
    if (timeType === "min") {
        delta = new Date(now.getTime() + time * 60000);
    } else if (timeType === "sec") {
        delta = new Date(now.getTime() + time * 1000);
    } else {
        delta = new Date(now.getTime() + time * 60000);
    }

    if (!timer[userId]) {
        timer[userId] = {};
    }

    timer[userId][item] = {
        y: delta.getFullYear(),
        m: delta.getMonth() + 1,
        d: delta.getDate(),
        h: delta.getHours(),
        min: delta.getMinutes(),
        s: delta.getSeconds()
    };
}

function items(item, userId, data, timer) {
    data[userId].cash += 50;
    timerSet(item, userId, timer, "minutes", 10);
    return data[userId].cash;
}

function itemTimer(item, userId, data, timer) {
    if (timer[userId] && timer[userId][item] && timer[userId][item].y) {
        const now = new Date();
        const timerDate = new Date(
            timer[userId][item].y,
            timer[userId][item].m - 1,
            timer[userId][item].d,
            timer[userId][item].h,
            timer[userId][item].min,
            timer[userId][item].s
        );
        return timerDate < now;
    } else {
        if (!timer[userId]) {
            timer[userId] = {
                item1: {}, item2: {}, item3: {}, item4: {}, item5: {}, item6: {}, itemm6: {}
            };
        }
        return true;
    }
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            await processMessage(sock, msg);
        }
    });
}

async function processMessage(sock, msg) {
    if (!msg.message) return;

    const messageType = Object.keys(msg.message)[0];
    if (messageType !== 'conversation' && messageType !== 'extendedTextMessage') return;

    const chatId = msg.key.remoteJid;
    const messageText = msg.message.conversation || msg.message.extendedTextMessage.text;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Load data and timer from files
    try {
        data = JSON.parse(await fs.readFile('data.json', 'utf8'));
        timer = JSON.parse(await fs.readFile('timer.json', 'utf8'));
    } catch (error) {
        console.error('Error reading files:', error);
    }

    // Process commands
    if (messageText === 'الاوامر') {
        const commandList = senderId === dev.toString() ?
            '- راتب | لزيادو فلوسك\n- بخشيش | لزيادة فلوسك\nزرف (بلرد) | لزرف الفلوس\nفلوسي | لعرض فلوسك\nزرفي | لعرض الفلوس يلي زرفتهم\n- مضاربه (العدد) | ياتفوز 0-90% ياتخسر 0-90%\n- استثمار (العدد) | تزيد الفلوس بنسبة 0-15%\n- حظ (العدد) | ياتدبل الفلوس ياتخسرهم\n- اصنعي (الفلوس) |  علشان تصنع كود اكشط \n- ترسيت البنك | عشان تصفر لعبة البنك\n- اكشط (الكود) | علشان تاخذ كود اكشط' :
            '- راتب | لزيادو فلوسك\n- بخشيش | لزيادة فلوسك\nزرف (بلرد) | لزرف الفلوس\nفلوسي | لعرض فلوسك\nزرفي | لعرض الفلوس يلي زرفتهم\n- مضاربه (العدد) | ياتفوز 0-90% ياتخسر 0-90%\n- استثمار (العدد) | تزيد الفلوس بنسبة 0-15%\n- حظ (العدد) | ياتدبل الفلوس ياتخسرهم\n- اكشط (الكود) | علشان تاخذ كود اكشط';

        await sock.sendMessage(chatId, { text: commandList });
    } else if (messageText === 'فلوسي') {
        if (data[senderId]) {
            await sock.sendMessage(chatId, { text: `فلوسك هي ${data[senderId].cash} ريال` });
        } else {
            await sock.sendMessage(chatId, { text: 'ماعندك حساب بنكي' });
        }
    }
    // Add more command handlers here...

    // Save data and timer to files
    await fs.writeFile('data.json', JSON.stringify(data, null, 2));
    await fs.writeFile('timer.json', JSON.stringify(timer, null, 2));
}

connectToWhatsApp();
