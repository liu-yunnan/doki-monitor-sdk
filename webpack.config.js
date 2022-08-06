const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
// user-agent把浏览器的UserAgent变为一个对象
module.exports = {
  entry: './src/index.js',
  context: process.cwd(),//上下文目录
  output: {
    path: path.resolve(__dirname, 'dist'),//输出目录
    filename: 'monitor.js',
    clean: true, // 自动将上次打包目录资源清空
  },
  devServer: {
    static: path.resolve(__dirname, 'public'),//devServer静态文件根目录
    open: true,
    hot: false,
    //自定义接口测试
    // setupMiddlewares ??
    onBeforeSetupMiddleware: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }

      devServer.app.get('/success', function (req, res) {
        res.json({ name: 'DoKiDoKi' })
      })
      devServer.app.post('/error', (req, res) => {
        res.sendStatus(500)
      })
    },
  },
  plugins: [
    //自动打包出html文件
    new HTMLWebpackPlugin({
      template: './src/index.html',
      inject: 'head'
    })
  ],
  mode: 'development'
}