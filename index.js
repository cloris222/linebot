import 'dotenv/config'
import linebot from 'linebot'
// import express from 'express'
import {
  GetAuthorizationHeader,
  fetchMRTExits
} from './commands/fetchMRTExits.js'

// const app = express()
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.on('message', (event) => {
  console.log('收到訊息')
  if (event.message.type === 'location') {
    console.log('indexevent', event)
    GetAuthorizationHeader()
    fetchMRTExits(event)
  }
  if (event.message.type !== 'text') return

  if (event.message.text === '找捷運站') {
    fetchMRTExits(event)
  }
})

// const linebotParser = bot.parser()

// app.post('/', linebotParser)

// app.get('/', (req, res) => {
//   res.status(200).send('ok')
// })

// app.listen('/', process.env.PORT || 3000, () => {
//   console.log('機器人啟動')
// })

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})
