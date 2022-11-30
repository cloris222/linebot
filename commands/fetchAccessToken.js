import axios from 'axios'
import nodeSchedule from 'node-schedule'
const accesstoken = ''
const GetAuthorizationHeader = async () => {
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

    console.log('accesstoken', data)
    // accesstoken = data.access_token
  } catch (error) {
    console.error(error)
  }
  nodeSchedule.scheduleJob('0 */4 * * *', GetAuthorizationHeader)
  GetAuthorizationHeader()
}
export default accesstoken
