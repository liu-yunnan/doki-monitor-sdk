import tracker from "../utils/tracker"
//重写xhr拦截进行上报
export function injectXHR () {
  // 拿到XMLHttpRequest
  let XHLHttpRequest = window.XMLHttpRequest
  //保存原有的open方法
  let oldOpen = XMLHttpRequest.prototype.open
  //重写open：保存methods，url参数用于埋点上报
  //不能使用箭头函数，箭头函数无arguments；箭头函数会改变指向，我们需要将this指向XMLHttpRequest；箭头函数的this绑定的是上一层的this
  XHLHttpRequest.prototype.open = function (method, url, async) {
    // 上报请求无需拦截，否则会造成死循环
    if (!url.match(/sdk_post/)) {
      this.logData = { method, url }
    }
    //执行原有的open方法
    return oldOpen.apply(this, arguments)
  }
  //同上
  let oldSend = XMLHttpRequest.prototype.send
  XHLHttpRequest.prototype.send = function (body) {
    if (this.logData) {
      let startTime = Date.now()
      let handler = (type) => {
        let duration = Date.now() - startTime//持续时间
        let status = this.status//200 500
        let statusText = this.statusText//OK Server Error
        tracker.send({
          kind: 'stability',
          type: 'xhr',
          eventType: type,//load error abort
          pathname: this.logData.url,//请求路径
          status: status + '-' + statusText,//状态码
          duration,//持续时间
          response: this.response ? JSON.stringify(this.response).substring(0, 2048) : '',//响应体
          params: body || ''//参数
        })
      }
      //xhr对象的进度事件
      // abort：在因为调用abort()方法而终止连接时触发。
      // error：在请求发生错误时触发。
      // load： 在接收到完整的响应数据时触发。
      this.addEventListener('load', handler('load'), false)
      this.addEventListener('error', handler('error'), false)
      this.addEventListener('abort', handler('abort'), false)//放弃
    }
    return oldSend.apply(this, arguments)
  }
}