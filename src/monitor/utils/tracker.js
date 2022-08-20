// 日志服务配置
let host = 'cn-beijing.log.aliyuncs.com'
let project = 'f-monitor-demo'//项目名
let logStore = 'f-monitor-demo-store'//服务名
let userAgent = require('user-agent')
function getExtraData () {
  return {
    title: document.title,
    url: location.href,
    timestamp: Date.now(),
    userAgent: userAgent.parse(navigator.userAgent).name,
    //用户ID/token等等
    hostname: location.hostname,//主机的域名
  }
}
class SendTracker {
  constructor() {
    // this.url = `http://${project}.${host}/logstores/${logStore}/track` //上报路径
    this.url = 'http://47.103.139.192:3000/sdk_post'
    this.xhr = new XMLHttpRequest()
  }
  send (data = {}) {
    let extraData = getExtraData()
    let log = { ...extraData, ...data }
    //对象的值不能是数字
    for (let key in log) {
      if (typeof log[key] === 'number' && key !== 'timestamp') {
        log[key] = `${log[key]}`
      }
    }
    console.log('log', log)
    let body = JSON.stringify(log)
    // let body = JSON.stringify({
    //   __logs__: [log]
    // })
    // console.log(body)
    // this.xhr.open('POST', this.url, true)
    // this.xhr.setRequestHeader('Content-type', 'application/json')//请求体内容
    // this.xhr.setRequestHeader('x-log-apiversion', '0.6.0')//版本号
    // this.xhr.setRequestHeader('x-log-bodyrawsize', body.length)//请求体的大小

    // this.xhr.onload = function () {
    //   // console.log(this.xhr.response)
    // }
    // this.xhr.onerror = function (error) {
    //   // console.log(error)
    // }
    // this.xhr.send(body)
    navigator.sendBeacon(this.url, body)

  }
}

export default new SendTracker()

