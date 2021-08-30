const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  menuType: Number, //菜单类型
  menuName: String, //菜单名称
  menuCode: String, //权限标识
  path: String, //路由地址
  icon: String, //图标
  componet: String, //组件地址
  menuState: Number, //菜单状态
  parentId: [mongoose.Types.ObjectId],
  createTime: {
    type: Date,
    default: Date.now()
  }, //创建时间
  updateTime: {
    type: Date,
    default: Date.now()
  } //更新时间
})

module.exports = mongoose.model('menu', userSchema, 'menus')
