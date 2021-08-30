const log4js = require('log4js')

const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL
}
log4js.configure({
  appenders: {
    console: {
      type: 'console' //开发环境默认输出到控制台
    },
    info: {
      type: 'file', //生产输出到LOG文件
      filename: 'logs/all-logos.log'
    },
    error: {
      type: 'dateFile', //错误日志按天滚
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true //设置文件名称为filename + pattern
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'debug'
    },
    error: {
      appenders: ['console', 'error'],
      level: 'error'
    },
    info: {
      appenders: ['console', 'info'],
      level: 'info'
    }
  }
})
/**
 * 日志输出，level为debug
 * @param {string} content
 */

exports.debug = (content) => {
  const logger = log4js.getLogger()
  logger.level = levels.debug
  logger.debug(content)
}

/**
 * 日志输出，level为error
 * @param {string} content
 */

exports.error = (content) => {
  const logger = log4js.getLogger('error') //需要制定追加器的名称才能输出日志
  logger.level = levels.error
  logger.error(content)
}

/**
 * 日志输出，level为info
 * @param {string} content
 */

exports.info = (content) => {
  const logger = log4js.getLogger('info')
  logger.level = levels.info
  logger.info(content)
}
