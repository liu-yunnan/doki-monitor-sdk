import tracker from '../utils/tracker'
import onload from '../utils/onload'
export function injectBlankScreen () {
  let wrapperElements = ['html', 'body', '#container', '.content']
  let emptyPoints = 0
  function getSelector (element) {
    if (element.id) {
      return "#" + element.id
    } else if (element.className) {
      //一个element可能有多个类 a b c =>.a.b.c
      return "." + element.className.split(' ').filter(item => !item).join('.')
    } else {
      return element.nodeName.toLowerCase()
    }
  }
  // 判断是否为空白元素
  function isWrapper (element) {
    let selector = getSelector(element)
    if (wrapperElements.indexOf(selector) != -1) {
      emptyPoints++
    }
  }
  onload(function () {
    //取 18个点观察
    for (let i = 1; i <= 9; i++) {
      let xElements = document.elementFromPoint(
        window.innerWidth * i / 10, window.innerHeight / 2)
      let yElements = document.elementFromPoint(
        window.innerWidth / 2, window.innerHeight * i / 10)
      isWrapper(xElements)
      isWrapper(yElements)
    }
    if (emptyPoints >= 18) {
      // 屏幕中间点

      let centerElements = document.elementFromPoint(
        window.innerWidth / 2, window.innerHeight / 2
      )
      tracker.send({
        kind: 'stability',
        type: 'blank',
        emptyPoints,
        screen: window.screen.width + "X" + window.screen.height,
        viewPoint: window.innerWidth + "X" + window.innerHeight,//布局视口大小
        selector: getSelector(centerElements)
      })
    }
  })

}