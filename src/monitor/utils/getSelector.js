/*实际得到的
path: Array(7)
0: input
1: div.content
2: div#container
3: body
4: html
5: document
6: Window {window: Window, self: Window, document: document, name: '', location: Location, …}
length: 7
想要获得到：html body div#container div.content input
做一下处理
*/

function getSelectors (path) {
  return path.reverse().filter(element => {
    return element != document && element != window
  }).map(element => {
    let selector = ""
    if (element.id) {
      return `${element.nodeName.toLowerCase()}#${element.id}`
    } else if (element.className && typeof element.className === 'string') {
      return `${element.nodeName.toLowerCase()}.${element.className}`
    } else {
      selector = element.nodeName.toLowerCase()
    }
    return selector
  }).join(' ')
}

export default function (pathOrTarget) {
  if (Array.isArray(pathOrTarget)) {//数组
    return getSelectors(pathOrTarget)
  } else {//对象
    let path = []
    while (pathsOrTarget) {
      path.push(pathOrTarget)
      pathOrTarget = pathOrTarget.parentNode
    }
    return getSelectors(path)
  }
}