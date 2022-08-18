import tracker from '../utils/tracker'
import onload from '../utils/onload'
import getLastEvent from '../utils/getLastEvent'
import getSelector from '../utils/getSelector'

export function injectTiming () {
  let FMP, LCP
  //PerformanceObserver.observer方法用于观察传入的参数中指定的性能条目类型的集合
  if (PerformanceObserver) {
    // 增加一个性能条目的观察者
    // new PerformanceObserver((entryList, observer) => {
    //   let prefEntries = entryList.getEntries()
    //   FMP = prefEntries[0]
    //   observer.disconnect()//不再观察了
    // }).observe({ entryTypes: ['element'] })//观察页面中的有意义的元素

    //LCP
    new PerformanceObserver((entryList, observer) => {
      let prefEntries = entryList.getEntries()
      // console.log('prefEntries: ', prefEntries)
      LCP = prefEntries[0]
      observer.disconnect()//不再观察了
    }).observe({ entryTypes: ['largest-contentful-paint'] })//观察页面中的最大元素
    // FIP
    new PerformanceObserver((entryList, observer) => {
      let lastEvent = getLastEvent()
      let firstInput = entryList.getEntries()[0]
      // console.log('firstInput: ', firstInput)
      if (firstInput) {
        // 开始处理的时间 - 开始点击的时间 = 处理的延迟
        let inputDelay = firstInput.processingStart - firstInput.startTime
        // 处理的耗时
        let duration = firstInput.duration
        if (inputDelay > 0 || duration > 0) {
          tracker.send({
            kind: 'experience', // 用户体验指标
            type: 'firstInputDelay', //首次输入延迟
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
        navigationStart,
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
        domainLookupStart,
        domainLookupEnd,
      } = performance.timing
      tracker.send({
        kind: 'experience',//用户体验指标
        type: 'timing',//统计每个阶段的时间
        dnsTime: domainLookupEnd - domainLookupStart,//DNS解析时间==
        connectTime: connectEnd - connectStart, // TCP 连接时间
        responseTime: responseEnd - responseStart, // 响应读取时间
        timeToInteractive: domInteractive - fetchStart, // 首次可交互时间,白屏时间
        loadTime: loadEventStart - fetchStart, // 页面完整的加载时间
        domReadyTime: domContentLoadedEventEnd - fetchStart,//domReady,DOM阶段渲染耗时==
        ttfbTime: responseStart - requestStart, // 第一个首字节的时间
        parseDOMTime: loadEventStart - domLoading, // DOM 解析时间
        domContentLoadedTime: domContentLoadedEventEnd - domContentLoadedEventStart, // DOMContentLoaded事件时间

      })

      let FP = performance.getEntriesByName('first-paint')[0]// 首次非网页背景像素渲染,(白屏时间)
      let FCP = performance.getEntriesByName('first-contentful-paint')[0]// 首次绘制任何文本、图像、非空白canvas或者SVG的时间(灰屏时间)
      // console.log('FP', FP)
      // console.log('FCP', FCP)
      // console.log('FMP', FMP)
      // console.log('LCP', LCP)
      tracker.send({
        kind: 'experience', // 用户体验
        type: 'paint',
        firstPaint: FP.startTime,
        firstContentfulPaint: FCP.startTime,
        // firstMeaningfulPaint: FMP.startTime,
        largestContentfulPaint: LCP.startTime,
      })
    }, 3000)
  })
}