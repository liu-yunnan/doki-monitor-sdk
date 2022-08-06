export default function (callback) {
  // 判断页面是否加载完成
  if (document.readyState === 'complete') {
    callback()
  } else {
    window.addEventListener('load', callback())

  }
}