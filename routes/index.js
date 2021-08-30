const router = require('koa-router')()

router.get('/', (ctx) => {
  ctx.body = 'index11'
})

module.exports = router
