import tracker from '../utils/tracker'
// PV:页面被浏览的次数
// UV：24小时内(00:00-24:00)访问的独立用户数 

export function injectPV () {
  function randomString (len) {
    len = len || 10
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789'
    var maxPos = $chars.length
    var pwd = ''
    for (let i = 0; i < len; i++) {
      pwd = pwd + $chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return pwd + new Date().getTime()
  }
  // 获得Uv
  function markUv () {
    const date = new Date()
    let markUv = localStorage.getItem('ps_markUv') || ''
    const datatime = localStorage.getItem('ps_markUvTime') || ''
    const today = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' 23:59:59'
    if ((!markUv && !datatime) || (date.getTime() > datatime * 1)) {
      markUv = randomString()
      localStorage.setItem('ps_markUv', markUv)
      localStorage.setItem('ps_markUvTime', new Date(today).getTime())
    }
    return markUv
  }
  const handler = () => {
    // let entryType = ''
    // switch (window.performance.navigation.type) {
    //   case 0:
    //     entryType = 'navigate'//网页通过点击链接,地址栏输入,表单提交,脚本操作等方式加载
    //     break
    //   case 1:
    //     entryType = 'reload'//网页通过“重新加载”按钮或者location.reload()方法加载
    //     break
    //   case 2:
    //     entryType = 'back_forward'//网页通过“前进”或“后退”按钮加载
    //     break
    //   case 255:
    //     entryType = 'reserved'//任何其他来源的加载
    //     break
    // }
    tracker.send({
      kind: 'behavior',//监控指标的大类：用户行为
      type: 'pv',//小类型 pv
      effectiveType: navigator.connection.effectiveType,//网络类型
      rtt: navigator.connection.rtt,//往返时延
      markUv: markUv(),
      referrer: document.referrer,//用户来路地址：地址栏进入、浏览器收藏夹打开会获取到空值
      entryType: window.performance.navigation.type,//用户来路方式
      screen: window.screen.width + "X" + window.screen.height,
      pathname: location.pathname,//当前页面的路径和文件名
    })
  }
  // popstate事件监听
  window.addEventListener('popstate', handler(), true)

  // 为 pushState 以及 replaceState 方法添加 Evetn 事件
  let _wr = function (type) {
    let orig = history[type]
    return function () {
      let e = new Event(type)
      e.arguments = arguments
      window.dispatchEvent(e)
      // 注意事件监听在url变更方法调用之前 也就是在事件监听的回调函数中获取的页面链接为跳转前的链接
      var rv = orig.apply(this, arguments)
      return rv
    }
  }
  history.pushState = _wr('pushState')
  history.replaceState = _wr('replaceState')

  window.addEventListener('pushState', function () {
    console.log('pushState')
    handler()
  }, true)
  window.addEventListener('replaceState', function () {
    console.log('replaceState')
    handler()
  }, true)
}