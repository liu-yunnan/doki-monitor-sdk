import tracker from '../utils/tracker'
export function injectVueError (error, vm, info) {
  // 获取报错组件名
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, '')
  const ROOT_COMPONENT_NAME = '<Root>'
  const ANONYMOUS_COMPONENT_NAME = '<Anonymous>'

  const formatComponentName = (vm, includeFile) => {
    if (!vm) {
      return ANONYMOUS_COMPONENT_NAME
    }
    if (vm.$root === vm) {
      return ROOT_COMPONENT_NAME
    }
    const options = vm.$options
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      if (match) {
        name = match[1]
      }
    }
    return (
      (name ? `<${classify(name)}>` : ANONYMOUS_COMPONENT_NAME) + (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const componentName = formatComponentName(vm)
  const exception = {
    kind: 'stability', // 监控指标的大类：稳定性指标
    type: 'error', // 小类型 这是一个错误
    errorType: 'vueError', // 资源加载错误
    value: error.message,// 错误信息
    componentName,// 报错的Vue组件名
    hook: info,// 报错的Vue阶段
  }
  tracker.send(exception)



}
