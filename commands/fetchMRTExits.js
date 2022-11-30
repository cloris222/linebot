import axios from 'axios'
import template from '../templates/MRT.js'
import writejson from '../utils/writejson.js'
import nodeSchedule from 'node-schedule'

// 取得accesstoken
let accesstoken = ''
export const GetAuthorizationHeader = async () => {
  try {
    const parameter = {
      grant_type: 'client_credentials',
      client_id: 'cloris222-a9ed2e9d-fe1e-42ee',
      client_secret: '84847813-0269-48c3-b80d-ad0b6f1ce120'
    }

    const header = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    const authUrl =
      'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'

    const { data } = await axios.post(authUrl, parameter, {
      headers: header
    })

    console.log('accesstoken', data.access_token)
    accesstoken = data.access_token
    console.log('accesstoken2', accesstoken)
    accesstoken = data.access_token

    return accesstoken
  } catch (error) {
    console.error(error)
  }
  nodeSchedule.scheduleJob('0 */4 * * *', GetAuthorizationHeader)
  GetAuthorizationHeader()
}

export const fetchMRTExits = async (event) => {
  try {
    console.log('mrtaccesstoken', accesstoken)
    // console.log('eventmessage', event)
    const header = {
      authorization: 'Bearer ' + accesstoken
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
