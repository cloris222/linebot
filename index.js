import 'dotenv/config'
import linebot from 'linebot'
import fetchDailyimg from './commands/fetchDailyimg.js'

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.on('message', (event) => {
  if (event.message.type !== 'text') return

  if (event.message.text === '每日一圖') {
    fetchDailyimg(event)
  }
})

bot.listen('/', process.env.PORT || 3000, () => {
  console.log('機器人啟動')
})
