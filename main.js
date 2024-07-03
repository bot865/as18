require("./all/global")
const func = require("./all/place")
const readline = require("readline")
const yargs = require('yargs/yargs')
const _ = require('lodash')
const usePairingCode = true
const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})
return new Promise((resolve) => {
rl.question(text, resolve)
})}

async function startSesi() {
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const { state, saveCreds } = await useMultiFileAuthState(`./session`)
const { version, isLatest } = await fetchLatestBaileysVersion()
const getMessage = async (key) => {
if (store) {
const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
return msg?.message || undefined
}
return {
conversation: 'hallo'
}}

const connectionOptions = {
    isLatest,
    getMessage,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: !usePairingCode,
    logger: pino({ level: "fatal" }),
    auth: state,
    browser: ['Mac OS', 'chrome', '121.0.6167.159']
}
const Skyzo = func.makeWASocket(connectionOptions)
if (usePairingCode && !Skyzo.authState.creds.registered) {
const phoneNumber = await question(color('Script remake by ELAKRAB ELYOTUBER (Sc ini free Not for sale !)\nMasukan nomornya dibawah berawal 62 :\n', 'white'));
const code = await Skyzo.requestPairingCode(phoneNumber.trim())
console.log(`KODE : ${code}`)
}
store.bind(Skyzo.ev)

Skyzo.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect } = update
if (connection === 'close') {
const reason = new Boom(lastDisconnect?.error)?.output.statusCode
console.log(color(lastDisconnect.error, 'deeppink'))
if (lastDisconnect.error == 'Error: Stream Errored (unknown)') {
process.exit()
} else if (reason === DisconnectReason.badSession) {
console.log(color(`ملف الجلسة غير صالح، يرجى حذف الجلسة والمسح مرة أخرى 🐍`))
process.exit()
} else if (reason === DisconnectReason.connectionClosed) {
console.log(color('[SYSTEM]', 'white'), color('تم إغلاق الاتصال، جارٍ إعادة الاتصال 🐍...', 'deeppink'))
process.exit()
} else if (reason === DisconnectReason.connectionLost) {
console.log(color('[SYSTEM]', 'white'), color('انقطع الاتصال، جارٍ محاولة إعادة الاتصال 🐍..', 'deeppink'))
process.exit()
} else if (reason === DisconnectReason.connectionReplaced) {
console.log(color('تم استبدال الاتصال، وتم فتح جلسة عمل جديدة أخرى، يرجى إغلاق الجلسة الحالية أولاً 🐍..'))
Skyzo.logout()
} else if (reason === DisconnectReason.loggedOut) {
console.log(color(`تم تسجيل خروج الجهاز، يرجى المسح مرة أخرى والتشغيل 🐍.`))
Skyzo.logout()
} else if (reason === DisconnectReason.restartRequired) {
console.log(color('إعادة التشغيل مطلوبة، إعادة التشغيل 🐍...'))
await startSesi()
} else if (reason === DisconnectReason.timedOut) {
console.log(color('انتهت مهلة الاتصال، جارٍ الاتصال 🐍...'))
startSesi()
}
} else if (connection === "oke udah") {
console.log(color('bentar...'))
} else if (connection === "open") {
Skyzo.sendMessage("201028085788@s.whatsapp.net", {text: "تم تشغيل البوت بنجاح 🐍🌿"})
console.log(color('العقرب اليوتيوبر 🐍'))
}
})

Skyzo.ev.on('call', async (user) => {
if (!global.anticall) return
let botNumber = await Skyzo.decodeJid(Skyzo.user.id)
for (let ff of user) {
if (ff.isGroup == false) {
if (ff.status == "offer") {
let sendcall = await Skyzo.sendMessage(ff.from, {text: `˛ َِ𝗘َِ𝗟َِ𝗔َِ𝗞َِ𝗥َِ𝗔َِ𝗕 َِ𝗘َِ𝗟َِ𝗬َِ𝗢َِ𝗧َِ𝗨َِ𝗕َِ𝗘َِ𝗥 .
Mampus gw blok`, contextInfo: {mentionedJid: [ff.from], externalAdReply: {thumbnailUrl: "https://telegra.ph/file/caa9288c34034e5bb8d28.png", title: "˛ َِ𝗘َِ𝗟َِ𝗔َِ𝗞َِ𝗥َِ𝗔َِ𝗕 َِ𝗘َِ𝗟َِ𝗬َِ𝗢َِ𝗧َِ𝗨َِ𝗕َِ𝗘َِ𝗥 .!", previewType: "صوره 🐍"}}}, {quoted: null})
Skyzo.sendContact(ff.from, [owner], "Dont Call !", sendcall)
await sleep(8000)
await Skyzo.updateBlockStatus(ff.from, "block")
}}
}})

Skyzo.ev.on('messages.upsert', async (chatUpdate) => {
try {
m = chatUpdate.messages[0]
if (!m.message) return
m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
if (m.key && m.key.remoteJid === 'status@broadcast') return Skyzo.readMessages([m.key])
if (!Skyzo.public && m.key.remoteJid !== global.owner+"@s.whatsapp.net" && !m.key.fromMe && chatUpdate.type === 'notify') return
if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return
if (global.autoread) Skyzo.readMessages([m.key])
m = func.smsg(Skyzo, m, store)
require("./skyzoo")(Skyzo, m, store)
} catch (err) {
console.log(err)
}
})

Skyzo.ev.on('messages.update', async (chatUpdate) => {
        for(const { key, update } of chatUpdate) {
			if (update.pollUpdates && key.fromMe) {
				const pollCreation = await getMessage(key)
				if(pollCreation) {
				    const pollUpdate = await getAggregateVotesInPollMessage({
							message: pollCreation,
							pollUpdates: update.pollUpdates,
						})
	                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
	                if (toCmd == undefined) return
                    var prefCmd = "."+toCmd
	                Skyzo.appenTextMessage(prefCmd, chatUpdate)
				}
			}
		}
    })

Skyzo.ev.on('group-participants.update', async (anu) => {
if (!global.welcome) return
let botNumber = await Skyzo.decodeJid(Skyzo.user.id)
if (anu.participants.includes(botNumber)) return
try {
let metadata = await Skyzo.groupMetadata(anu.id)
let namagc = metadata.subject
let participants = anu.participants
for (let num of participants) {
let check = anu.author !== num && anu.author.length > 1
let tag = check ? [anu.author, num] : [num]
try {
ppuser = await Skyzo.profilePictureUrl(num, 'image')
} catch {
ppuser = 'https://telegra.ph/file/b7d88e0d1718342dc9d2b.jpg'
}
if (anu.action == 'add') {
Skyzo.sendMessage(anu.id, {text: check ? `@${anu.author.split("@")[0]} menambahkan @${num.split("@")[0]}` : `Welcome @${num.split("@")[0]}`, 
contextInfo: {mentionedJid: [...tag], externalAdReply: { thumbnailUrl: ppuser, title: '© ELAKRAB ELYOTUBER ', body: '', renderLargerThumbnail: true, sourceUrl: linkgc, mediaType: 1}}})
} 
if (anu.action == 'remove') { 
Skyzo.sendMessage(anu.id, {text: check ? `@${anu.author.split("@")[0]} mengeluarkan @${num.split("@")[0]}` : `@${num.split("@")[0]} telah keluar`, 
contextInfo: {mentionedJid: [...tag], externalAdReply: { thumbnailUrl: ppuser, title: '© ᴠᴄʟᴏᴜᴅx ᴏꜰꜰɪᴄɪᴀʟ', body: '', renderLargerThumbnail: true, sourceUrl: linkgc, mediaType: 1}}})
}
if (anu.action == "promote") {
Skyzo.sendMessage(anu.id, {text: `@${anu.author.split("@")[0]} menjadikan @${num.split("@")[0]} sebagai admin`, 
contextInfo: {mentionedJid: [...tag], externalAdReply: { thumbnailUrl: ppuser, title: '© ELAKRAB ELYOTUBER ', body: '', renderLargerThumbnail: true, sourceUrl: linkgc, mediaType: 1}}})
}
if (anu.action == "demote") {
Skyzo.sendMessage(anu.id, {text: `@${anu.author.split("@")[0]} memberhentikan @${num.split("@")[0]} sebagai admin`, 
contextInfo: {mentionedJid: [...tag], externalAdReply: { thumbnailUrl: ppuser, title: '© ᴠᴄʟᴏᴜᴅx ᴏꜰꜰɪᴄɪᴀʟ', body: '', renderLargerThumbnail: true, sourceUrl: linkgc, mediaType: 1}}})
}
} 
} catch (err) {
console.log(err)
}})

Skyzo.public = true

Skyzo.ev.on('creds.update', saveCreds)
return Skyzo
}

startSesi()

process.on('uncaughtException', function (err) {
console.log('Caught exception: ', err)
})
