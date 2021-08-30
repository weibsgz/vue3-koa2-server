const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')

const log4js = require('./utils/log4js')
const index = require('./routes/index')
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')

const router = require('koa-router')()
const jwt = require('jsonwebtoken')
const koaJwt = require('koa-jwt')
const utils = require('./utils/utils')

//链接数据库
require('./config/db')

// error handler
onerror(app)
// app.use(() => {
//   ctx.body = '这是错误信息，因为没传ctx'
// })
// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
)
app.use(json())
// app.use(logger()) //注释掉KOA2自带的LOGGER 用LOG4JS
app.use(require('koa-static')(__dirname + '/public'))

app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
)

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`)

  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200 //更改状态码，让前端可以正常接收到 前端处理异常
      ctx.body = utils.fail('Token认证失败', utils.CODE.AUTH_ERROR)
    } else {
      throw err //如果不是TOKEN得问题 继续抛出异常
    }
  })
})

//app.use(koaJwt({ secret: 'imooc' }).unless({ path: [/^\/api\/users\/login/] }))
//如果token过期 会抛出401

// routes
router.prefix('/api')

router.use(users.routes(), users.allowedMethods())
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
//app.use需要导入总的router路由 use一次，就不用单独去app.use每个router路由了
app.use(router.routes(), router.allowedMethods())
// app.use(index.routes(), index.allowedMethods())
// app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
  log4js.error(err.stack)
})

module.exports = app
