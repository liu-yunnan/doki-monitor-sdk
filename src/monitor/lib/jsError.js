import getLastEvent from '../utils/getLastEvent'
import getSelector from '../utils/getSelector'
import tracker from '../utils/tracker'
export function injectJsError () {
  // console.log('js Error')
  // 监听全局未捕获的错误
  window.addEventListener('error', function (event) {
    let lastEvent = getLastEvent()//获取到最后一个交互事件
    // console.log(lastEvent)
    // 判断是否为脚本加载错误
    if (event.target && (event.target.src || event.target.href)) {
      tracker.send({
        kind: 'stability',//监控指标的大类：稳定性指标
        type: 'error',//小类型 这是一个错误
        errorType: 'resourseError',//资源加载错误
        filename: event.target.src || event.target.href,//报错文件
        tagName: event.target.tagName,//script
        //想要获得到：html body div#container div.content input
        // selector: getSelector(event.target),//最后一个操作的元素
      })
    } else {
      tracker.send({
        kind: 'stability',//监控指标的大类：稳定性指标
        type: 'error',//小类型 这是一个错误
        errorType: 'jsError',//JS执行错误
        message: event.message,//报错信息
        filename: event.filename,//报错文件
        position: `${event.lineno}:${event.colno}`,//报错具体位置
        stack: getLines(event.error.stack),//堆栈信息
        //想要获得到：html body div#container div.content input
        selector: lastEvent ? getSelector(lastEvent.path) : '',//最后一个操作的元素
      })
    }
  }, true)
  // promiseError
  window.addEventListener('unhandledrejection', (event) => {
    // console.log(event)
    let reason = event.reason
    let message
    let filename
    let line = 0
    let column = 0
    let stack = ''
    // 获取最后一个交互事件
    let lastEvent = getLastEvent()
    if (typeof reason === 'string') {
      message = reason
    } else if (typeof reason === 'object') {
      //reason为一个错误对象的情况
      // at http://localhost:3000/:24:30\n
      message = reason.message
      if (reason.stack) {
        //  正则匹配错误位置
        let matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/)
        //matchResult 信息
        // 0: "at http://localhost:3000/:24:30"
        // 1: "http://localhost:3000/"
        // 2: "24"
        // 3: "30"
        filename = matchResult[1]
        line = matchResult[2]
        column = matchResult[3]
      }
      stack = getLines(reason.stack)
    }
    tracker.send({
      kind: 'stability',//监控指标的大类：稳定性指标
      type: 'error',//小类型 这是一个错误
      errorType: 'promiseError',//JS执行错误
      message,//报错信息
      filename,//报错文件
      position: `${line}:${column}`,//报错具体位置
      stack,//堆栈信息
      //想要获得到：html body div#container div.content input
      selector: lastEvent ? getSelector(lastEvent.path) : '',//最后一个操作的元素
    })
  })
  // 不同浏览器报错信息不一样，不可做统一处理
  function getLines (stack) {
    // 处理后的信息，只留下错误信息：errorClick (http://localhost:3000/:19:28)^HTMLInputElement.onclick (http://localhost:3000/)
    return stack.split('\n').slice(1).map(item => item.replace(/^\s+at\s+/g, "")).join('^')
  }
}