#### 回顾核心代码
下面是在 Vue 项目中使用 VueRouter 时最核心的代码，首先我们尝试通过这段代码来分析 VueRouter 的一些基本特性
```JavaScript
// router/index.js
// ① 注册插件
Vue.use(VueRouter)

// 创建路由对象
const router = new VueRouter({
    routes: [
        { name: 'home', path: '/', component: homeComponent }
    ]
})

// main.js
// ② 创建 Vue 实例，注册 router 对象 
new Vue({
 router,
 render: h => h(App)
}).$mount('#app')
```
通过 ① ，我们可以发现 VueRouter 是 Vue 的一个插件，因此需要使用 Vue.use 来注册插件，Vue 功能的强大离不开它的插件机制，包括 VueRouter、Vuex 等都是利用插件机制实现的

Vue.use 这个方法可以传入函数或对象，如果传入的是函数，Vue.use 内部会调用这个函数，如果传入对象的话，Vue.use 内部则会调用这个对象的 install 方法

通过 ② ，很容易能看出 VueRouter 是一个类，类也是对象，可以拥有自己的属性，我们只需给这个类添加一个静态方法 install，就可以同时满足 ① 和 ② 的条件了

经过上面分析，我们清楚了 VueRouter 应该是一个类，那么下面我们就围绕着如何实现这个类展开讨论...


#### VueRouter 类成员
下面是 VueRouter 类的主要成员，实现 VueRouter 的过程就是在逐一实现这些属性和方法

```
class VueRouter {
    属性：options 
    // 记录构造函数中传入的对象，主要也就是路由规则
    属性：data 
    // data 是一个对象，其有一个属性叫做 current，用来记录当前的路由地址，data 对象是一个响应式的对象，因为路由地址发生改变后，
    // 对应的组件要自动更新，如何将 data 对象变为响应式呢？
    属性：routeMap 
    // 记录路由地址和组件的对应关系
    
    构造方法：Constructor（options）: VueRouter
    // 构造函数中初始化 options 等属性方法
    静态方法：install（Vue）：void
    // install 用来实现 Vue 的插件机制
    实例方法：init（）：void
    // 统一调用下面的三个方法：initEvent、createRouteMap、initComponents
    实例方法：initEvent（）：void
    // 监听浏览器历史的变化
    实例方法：createRouteMap（）：void
    // 初始化routeMap属性，负责将构造函数中传入的路由规则解析成键值对的形式存储到routeMap对象中，其键就是路由的地址，值就是路由的组件
    实例方法：initComponents（Vue）：void
    // 用来创建 router-link 和 router-view 这两个组件
}
```

#### Vue 的构建版本
Vue 的构建版本分为运行时版和完整版
-  `运行时版`：不支持 template 模板，需要打包的时候提前编译
- `完整版`：包含运行时和编译器，体积比运行时版大 10k 左右，程序运行的时候把模板转换成 render 函数
- 
使用 Vue-cli 创建的项目默认使用的是`运行时版本`的 Vue，因为体积的原因，使用运行时版本的 Vue 效率更高

完整版和运行时版本的区别：运行时版本不含编译器，也就是不能将 template 编译成 render 函数，因此，运行时版本的 Vue 组件中无法使用 template，而完整版的 Vue 中自带编译器，它会将 template 模板编译为 render 函数，因此可以使用 template

在 Vue 项目中，默认使用的是运行时版本，那么如何启用完整版呢？

```JavaScript
// vue.config.js
module.exports = {
    runtimeCompiler: true
}

```


#### router-view
router-view 组件相当于一个占位符，在它内部，会根据当前路由地址获取到对应的路由组件并旋绕到 router-view 所对应的 html 节点上

