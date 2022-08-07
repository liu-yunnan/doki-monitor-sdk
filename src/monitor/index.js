import onload from "./utils/onload"
import tracker from "./utils/tracker"
import getLastEvent from "./utils/getLastEvent"
import getSelector from "./utils/getSelector"

export class Minitor {
  constructor() {
    this.init()
  }

  init () {
    this.injectJsError()
    this.injectBlankScreen()
    this.injectXHR()
    this.injectTiming()
    this.injectPV()
    this.injectResidentTime()
  }

  injectJsError () {
    window.addEventListener('error', (event) => {
      let lastEvent = getLastEvent() // 最后一个交互事件
      // 脚本加载
      if (event.target && (event.target.src || event.target.href)) {
        tracker.send({
          kind: 'stability', // 监控指标的大类
          type: 'error', // 小类型，这是一个错误
          errorType: 'resourceError', // JS 执行错误
          filename: event.target.src || event.target.href, // 报错文件
          tagName: event.target.tagName,
        })
      } else {
        tracker.send({
          kind: 'stability', // 监控指标的大类
          type: 'error', // 小类型，这是一个错误
          errorType: 'jsError', // JS 执行错误
          message: event.message, // 报错信息
          filename: event.filename, // 报错文件
          position: `${event.lineno}:${event.colno}`, // 行、列信息
          stack: getLines(event.error.stack), // 栈信息
          selector: lastEvent ? getSelector(lastEvent.path) : '',  // 最后一个操作的元素
        })
      }
    }, true)

    window.addEventListener('unhandledrejection', (event) => {
      console.log('event: ', event)
      let lastEvent = getLastEvent()

      let message = ''
      let filename = ''
      let line = 0
      let column = 0
      let stack = ''
      let reason = event.reason
      if (typeof reason === 'string') {
        message = event.reason
      } else if (typeof reason === 'object') {
        if (reason.stack) {
          let matchRes = reason.stack.match(/at\s+(.+):(\d+):(\d+)/)
          filename = matchRes[1]
          line = matchRes[2]
          column = matchRes[3]
          stack = getLines(reason.stack)
        }
        message = reason.message
      }

      tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型，这是一个错误
        errorType: 'promiseError', // JS 执行错误
        message, // 报错信息
        filename, // 报错文件
        position: `${line}:${column}`, // 行、列信息
        stack, // 栈信息
        selector: lastEvent ? getSelector(lastEvent.path) : '',  // 最后一个操作的元素
      })
    }, true)

    function getLines (stack) {
      return stack.split('\n').slice(1).map(item => item.replace(/^\s+at\s+/g, '')).join('^')
    }
  }

  injectBlankScreen () {
    let wrapperElement = ['html', 'body', '#container', '.content']
    let emptyPoints = 0

    function getSelector (element) {
      if (element.id) {
        return '#' + element.id
      } else if (element.className) {
        return '.' + element.className.split(' ').filter(item => !!item).join('.')
      } else {
        return element.nodeName.toLowerCase()
      }
    }

    function isWrapper (element) {
      let selector = getSelector(element)
      if (wrapperElement.indexOf(selector) !== -1) {
        emptyPoints++
      }
    }

    onload(function () {
      for (let i = 1; i < 10; i++) {
        let xElements = document.elementsFromPoint(
          window.innerWidth * i / 10, window.innerHeight / 2
        )
        let yElements = document.elementsFromPoint(
          window.innerHeight / 2, window.innerHeight * i / 10
        )

        isWrapper(xElements[0])
        isWrapper(yElements[0])
      }

      if (emptyPoints >= 18) {
        let centerElements = document.elementsFromPoint(
          window.innerWidth / 2, window.innerHeight / 2
        )
        tracker.send({
          kind: 'stability',
          type: 'blank',
          emptyPoints,
          screen: window.screen.width + 'X' + window.screen.height,
          viewPoint: window.innerWidth + 'X' + window.innerHeight,
          selector: getSelector(centerElements[0])
        })
      }
    })
  }

  injectXHR () {
    let XMLHttpRequest = window.XMLHttpRequest
    let oldOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url, async) {
      // 上报请求无需拦截
      if (!url.match(/logstores/) && !url.match(/sockjs/)) {
        this.logData = { method, url, async }
      }
      return oldOpen.apply(this, arguments)
    }

    let oldSend = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.send = function (body) {
      if (this.logData) {
        let startTime = Date.now() // 记录开始时间

        let handler = (type) => (event) => {
          let duration = Date.now() - startTime // 持续时间
          let status = this.status
          let statusText = this.statusText
          console.log(123)
          tracker.send({
            kind: 'stability',
            type: 'xhr',
            eventType: type,
            pathname: this.logData.url,
            status: status + '-' + statusText,
            duration,
            response: this.response ? JSON.stringify(this.response) : '',
            params: body || ''
          })
        }

        this.addEventListener('load', handler('load'), false)
        this.addEventListener('error', handler('error'), false)
        this.addEventListener('abort', handler('abort'), false)
      }
      return oldSend.apply(this, arguments)
    }
  }

  injectTiming () {
    let FMP, LCP, FID
    // 增加一个性能条目观察者
    if (PerformanceObserver) {

      new PerformanceObserver((entryList, observer) => {
        let prefEntries = entryList.getEntries()
        FMP = prefEntries[0]
        observer.disconnect()
      }).observe({ entryTypes: ['element'] })

      new PerformanceObserver((entryList, observer) => {
        let prefEntries = entryList.getEntries()
        console.log('prefEntries: ', prefEntries)
        LCP = prefEntries[0]
        observer.disconnect()
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      new PerformanceObserver((entryList, observer) => {
        let lastEvent = getLastEvent()
        let firstInput = entryList.getEntries()[0]
        console.log('firstInput: ', firstInput)

        if (firstInput) {
          // 开始处理的时间 - 开始点击的时间
          let inputDelay = firstInput.processingStart - firstInput.startTime
          // 处理的耗时
          let duration = firstInput.duration
          if (inputDelay > 0 || duration > 0) {

            tracker.send({
              kind: 'experience', // 用户体验
              type: 'firstInputDelay', // 统计每个阶段的时间
              inputDelay, // 延时时间
              duration, // 处理时间
              startTime: firstInput.startTime,
              selector: lastEvent ? getSelector(lastEvent.path || lastEvent.target) : '',
            })

          }
        }
        observer.disconnect()
      }).observe({ type: 'first-input', buffered: true }) // 用户第一次交互
    }

    onload(function () {
      setTimeout(() => {
        const {
          fetchStart,
          connectStart,
          connectEnd,
          requestStart,
          responseStart,
          responseEnd,
          domLoading,
          domInteractive,
          domContentLoadedEventStart,
          domContentLoadedEventEnd,
          domComplete,
          loadEventStart,
          loadEventEnd,
        } = performance.timing

        tracker.send({
          kind: 'experience', // 用户体验
          type: 'timing', // 统计每个阶段的时间
          connectTime: connectEnd - connectStart, // TCP 连接时间
          ttfbTime: responseStart - requestStart, // 第一个首字节的时间
          responseTime: responseEnd - responseStart, // 响应读取时间
          parseDOMTime: loadEventStart - domLoading, // DOM 解析时间
          domContentLoadedTime: domContentLoadedEventEnd - domContentLoadedEventStart, // onload 时间
          timeToInteractive: domInteractive - fetchStart, // 首次可交互时间
          loadTime: loadEventStart - fetchStart, // 完整的加载时间
        })
        let FP = performance.getEntriesByName('first-paint')[0]
        let FCP = performance.getEntriesByName('first-contentful-paint')[0]
        console.log('FP', FP)
        console.log('FCP', FCP)
        console.log('FMP', FMP)
        console.log('LCP', LCP)

        tracker.send({
          kind: 'experience', // 用户体验
          type: 'paint',
          firstPaint: FP.startTime,
          firstContentfulPaint: FCP.startTime,
          firstMeaningfulPaint: FMP.startTime,
          largestContentfulPaint: LCP.startTime,
        })

      }, 3000)
    })
  }

  // PV:页面被浏览的次数
  // UV：24小时内(00:00-24:00)访问的独立用户数 
  injectPV () {
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
      let entryType = ''
      switch (window.performance.navigation.type) {
        case 0:
          entryType = 'navigate'//网页通过点击链接,地址栏输入,表单提交,脚本操作等方式加载
          break
        case 1:
          entryType = 'reload'//网页通过“重新加载”按钮或者location.reload()方法加载
          break
        case 2:
          entryType = 'back_forward'//网页通过“前进”或“后退”按钮加载
          break
        case 255:
          entryType = 'reserved'//任何其他来源的加载
      }
      tracker.send({
        kind: 'behavior',//监控指标的大类：用户行为
        type: 'pv',//小类型 pv
        effectiveType: navigator.connection.effectiveType,//网络类型
        rtt: navigator.connection.rtt,//往返时延
        markUv: markUv(),
        referrer: document.referrer,//用户来路地址：地址栏进入、浏览器收藏夹打开会获取到空值
        entryType: entryType,//用户来路方式
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

  injectResidentTime () {
    const routeList = []
    const routeTemplate = {
      // 除了userId以外，还可以附带一些其余的用户特征到这里面
      startTime: 0,
      duration: 0,
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
    // 单页面应用触发 replaceState 时的上报
    window.addEventListener('replaceState', () => {
      recordNextPage()
    })
    // 单页面应用触发 pushState 时的上报
    window.addEventListener('pushState', () => {
      recordNextPage()
      console.log(routeList)
    })
    // 浏览器回退、前进行为触发的 可以自己判断是否要上报
    window.addEventListener('popstate', () => {
      recordNextPage()
      console.log(routeList)
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
    })
  }
}