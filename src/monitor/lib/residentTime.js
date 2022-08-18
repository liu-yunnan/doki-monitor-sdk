import tracker from "../utils/tracker"
export function injectResidentTime () {
  const routeList = []
  const routeTemplate = {
    // 除了userId以外，还可以附带一些其余的用户特征到这里面
    startTime: 0,
    dulation: 0,
    endTime: 0,
  }
  function recordNextPage () {
    // 记录前一个页面的页面停留时间
    const time = new Date().getTime()
    routeList[routeList.length - 1].endTime = time
    routeList[routeList.length - 1].dulation = time - routeList[routeList.length - 1].startTime
    // 推一个新的页面停留记录
    routeList.push({
      ...routeTemplate,
      ...{ pathname: window.location.pathname, startTime: time, dulation: 0, endTime: 0 },
    })
  }
  // 第一次进入页面时,记录
  window.addEventListener('load', () => {
    const time = new Date().getTime()
    routeList.push({
      ...routeTemplate,
      ...{ pathname: window.location.pathname, startTime: time, dulation: 0, endTime: 0 },
    })
    console.log(routeList)
  })
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
  // 单页面应用触发 replaceState 时的上报
  window.addEventListener('replaceState', () => {
    recordNextPage()
  })
  // 单页面应用触发 pushState 时的上报
  window.addEventListener('pushState', () => {
    recordNextPage()
    // console.log(routeList)
  })
  // 浏览器回退、前进行为触发的 可以自己判断是否要上报
  window.addEventListener('popstate', () => {
    recordNextPage()
    // console.log(routeList)
  })
  // 关闭浏览器前记录最后的时间并上报
  window.addEventListener('beforeunload', () => {
    const time = new Date().getTime()
    routeList[routeList.length - 1].endTime = time
    routeList[routeList.length - 1].dulation = time - routeList[routeList.length - 1].startTime
    // 记录完了离开的时间，将获取到的该用户的每个路由停留时间一起上报
    tracker.send({
      kind: 'behavior',//用户行为指标
      type: 'residentTime',//用户停留时间
      durations: JSON.stringify(routeList),
    })
    // debugger
  })

}