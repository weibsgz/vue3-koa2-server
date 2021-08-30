const router = require('koa-router')()
const User = require('../models/userSchema')
const Menu = require('../models/menuSchema')
const util = require('../utils/utils')
const Counter = require('./../models/counterSchema')
const jwt = require('jsonwebtoken')
const md5 = require('md5')
router.prefix('/users')

router.post('/login', async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body
    const res = await User.findOne(
      {
        userName,
        userPwd: md5(userPwd)
      }
      // 'userId userName userEmail state role deptId roleList' //只返回指定字段
    )

    console.log('res=>', res)

    const token = jwt.sign(
      {
        data: res._doc //携带额数据  ._doc才是用户的表的信息，其他字段都是一些自带的，没用
      },
      'imooc', //密钥名
      { expiresIn: '1h' } //过期时间 1小时
    )

    // var f = new User({ userName: 'admin', userPwd: '123' })
    // f.save(function (err, f) {
    //   if (err) return console.error(err)
    // })

    if (res) {
      console.log('接口请求成功', token)
      res._doc.token = token //发送给前端token
      ctx.body = util.success(res)
    } else {
      ctx.body = util.fail('账号或者密码不正确')
    }
  } catch (err) {
    console.log('接口请求失败')
    ctx.body = util.fail(err.msg)
  }
})

router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state != '0') params.state = state

  try {
    // 根据条件查询所有用户列表,第二个参数代表过滤掉_id ,userPwd字段
    const query = User.find(params, { _id: 0, userPwd: 0 })
    //查询当页的数据
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)

    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`)
  }
})

// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  //$in userIds可能是一个数组  userid是否包含在这个数组里
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  if (res.nModified) {
    ctx.body = util.success(res, `共删除成功${res.nModified}条`)
    return
  }
  ctx.body = util.fail('删除失败')
})

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action
  } = ctx.request.body
  if (action == 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return
    }
    //查询userName 或者 userEmail有没有相同的人
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      '_id userName userEmail'
    )
    if (res) {
      ctx.body = util.fail(
        `系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`
      )
    } else {
      // $inc 是incercemnt 让sequence_value + 1
      //  { new: true } 代表返回一个新的文档

      const doc = await Counter.findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { sequence_value: 1 } },
        { new: true }
      )
      try {
        //创建
        const user = new User({
          userId: doc.sequence_value, //需要手动增加一个自增的ID
          userName,
          userPwd: md5('123'),

          userEmail,
          role: 1, //默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save()
        ctx.body = util.success(true, '用户创建成功')
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败')
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return
    }
    try {
      //查找userId ，更新后面的字段
      const res = await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      )
      ctx.body = util.success({}, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败')
    }
  }
})
// 获取用户对应的权限菜单
router.get('/getPermissionList', async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  ctx.body = util.success(menuList)
})

async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole == 0) {
    //管理员
    rootList = (await Menu.find({})) || []
  } else {
    // 根据用户拥有的角色，获取权限列表
    // 现查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map((role) => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys
      ])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({ _id: { $in: permissionList } })
  }
  return util.getTreeMenu(rootList, null, [])
}
module.exports = router
