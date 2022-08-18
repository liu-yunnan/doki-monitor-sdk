# 前端监控SDK

## 信息采集

#### 稳定性指标（stability）

- js错误（**type: "error"**）

  - js运行错误

  - 资源加载异常

  - promise错误

- 接口异常（**type: "xhr"**）

- 白屏异常（**type: "blank"**）

#### 用户体验指标/性能监控（experience）

- timing
- paint
- 首次输入延迟 firstInputDelay

#### 用户行为指标（behavior）

- PV
- UV
- 页面停留时间



## 在vue项目中使用

安装

```
npm install --save doki-monitor-sdk
```

Vue2项目中使用

```
//main.js中导入
// 导入SDK
import 'doki-monitor-sdk'
import { injectVueError } from 'doki-monitor-sdk/src/monitor/lib/vueError'

Vue.config.errorHandler = (error, vm, info) => {
  injectVueError(error, vm, info)
}
```


