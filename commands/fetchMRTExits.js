import axios from 'axios'
import template from '../templates/MRT.js'
import writejson from '../utils/writejson.js'
import accesstoken from './fetchAccessToken.js'

let fetchMRTExits
export default fetchMRTExits = async (event) => {
  try {
    console.log('mrtaccesstoken', accesstoken)
    // console.log('eventmessage', event)
    const header = {
      authorization:
        'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJER2lKNFE5bFg4WldFajlNNEE2amFVNm9JOGJVQ3RYWGV6OFdZVzh3ZkhrIn0.eyJleHAiOjE2Njk4NjE4NzIsImlhdCI6MTY2OTc3NTQ3MiwianRpIjoiOGQzNTYyM2YtOGVjOC00ZDNkLThlN2ItNjYxZWNhZGM3YTkzIiwiaXNzIjoiaHR0cHM6Ly90ZHgudHJhbnNwb3J0ZGF0YS50dy9hdXRoL3JlYWxtcy9URFhDb25uZWN0Iiwic3ViIjoiY2ZhODQ0MmItYTAwMy00ZGU5LWI3MzQtNGEzYmY2NWQ0ZWM1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiY2xvcmlzMjIyLWE5ZWQyZTlkLWZlMWUtNDJlZSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsic3RhdGlzdGljIiwicHJlbWl1bSIsIm1hYXMiLCJhZHZhbmNlZCIsImhpc3RvcmljYWwiLCJiYXNpYyJdfSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwidXNlciI6IjdmNmZiOTg2In0.gp7IX_zy4ecudbET1m1JVy8BfY3Dpq0rBUoe1B3NIWcLgfkgcTpgAiT7kMb5egWDyxpbns9qOV_PqkshJ9mBHxljJGwCvo9VQorMmJVaYIzXCNCH-PcwFo9AcxEqmmyMYLdOjk9Rkhl9jGjVHg5c6dI5xkhfxPC9IrBd8BUq1-Gqwu6P3vWBt3VdaKqAgoFMjrnAYx3AdlmN1kpkFTJSMBkgqD5v4zAzYSPtrQJbT1O-SabG583cN-woGWoB9VZ6dHtAci3j_eLy_ut6nT1WGlpeied3MQQZ-yyeTQL3rYIWIRm8S40ppdZV3pwWd4QhytZF8oroT1atIUQTrXWueA'
    }
    const { data } = await axios.get(
      'https://tdx.transportdata.tw/api/basic/v2/Rail/Metro/StationExit/TRTC?%24format=JSON',
      {
        headers: header
      }
    )

    const distance = (lat1, lon1, lat2, lon2, unit) => {
      if (lat1 === lat2 && lon1 === lon2) {
        return 0
      } else {
        const radlat1 = (Math.PI * lat1) / 180
        const radlat2 = (Math.PI * lat2) / 180
        const theta = lon1 - lon2
        const radtheta = (Math.PI * theta) / 180
        let dist =
          Math.sin(radlat1) * Math.sin(radlat2) +
          Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
        if (dist > 1) {
          dist = 1
        }
        dist = Math.acos(dist)
        dist = (dist * 180) / Math.PI
        dist = dist * 60 * 1.1515
        if (unit === 'K') {
          dist = dist * 1.609344
        }
        if (unit === 'N') {
          dist = dist * 0.8684
        }
        return dist
      }
    }
    // 求出所有符合條件的出口
    const MRTFilter = data.filter((e) => {
      const distanceresult = distance(
        event.message.latitude,
        event.message.longitude,
        e.ExitPosition.PositionLat,
        e.ExitPosition.PositionLon,
        'k'
      )
      return distanceresult <= 2
    })

    // 讓出口由近至遠重新排列
    const MRTExits = MRTFilter.sort((a, b) => {
      // console.log('a,b', a, b)
      const distanceresultA = distance(
        event.message.latitude,
        event.message.longitude,
        a.ExitPosition.PositionLat,
        a.ExitPosition.PositionLon,
        'k'
      )
      const distanceresultB = distance(
        event.message.latitude,
        event.message.longitude,
        b.ExitPosition.PositionLat,
        b.ExitPosition.PositionLon,
        'k'
      )
      return distanceresultA - distanceresultB
    })
    console.log('mrtexit', MRTExits)

    // 將抓到的資料放進bubble中
    const bubbles = []
    for (const exit of MRTExits) {
      const map = `http://maps.google.com/?q=${exit.ExitPosition.PositionLat},${exit.ExitPosition.PositionLon}`
      const exitdistance = distance(
        event.message.latitude,
        event.message.longitude,
        exit.ExitPosition.PositionLat,
        exit.ExitPosition.PositionLon,
        'k'
      )
      const bubble = JSON.parse(JSON.stringify(template))
      bubble.hero.url =
        'https://raw.githubusercontent.com/cloris222/linebot/main/magnifying-glass-g79bf9f149_1280.png'
      bubble.body.contents[0].text = exit.ExitName.Zh_tw
      bubble.body.contents[2].contents[0].contents[0].text = '距離'
      bubble.body.contents[2].contents[0].contents[1].text = `${exitdistance.toFixed(
        2
      )}公里`
      bubble.body.contents[2].contents[1].contents[0].text = '地址'
      bubble.body.contents[2].contents[1].contents[1].text = `${exit.LocationDescription}`
      bubble.footer.contents[0].action.label = 'Google地圖'
      bubble.footer.contents[0].action.uri = encodeURI(map)

      bubbles.push(bubble)
      if (bubbles.length > 10) break
    }

    const replies = {
      type: 'flex',
      altText: '附近捷運站點查詢結果',
      contents: {
        type: 'carousel',
        contents: bubbles
      }
    }
    // console.log('em', event)
    // console.log('reply', replies)
    // console.log('reply', replies.contents.contents[0])
    if (bubbles.length === 0) {
      event.reply('目前地點查詢不到合適站點，請換個地點重新嘗試！')
    }
    event.reply(replies)
    writejson(replies, 'MRTExits')
  } catch (error) {
    console.error(error)
  }
}
// fetchMRTExits()
