/* eslint-disable */
let _Vue = null

export default class VueRouter {
    static install(Vue) {
        // 1. 注册插件，首先判断插件是否已经被注册
        if (VueRouter.install.installed) return

        VueRouter.install.installed = true
        // 2. 把 Vue 构造函数存储到全局变量中
        _Vue = Vue
        // 3. 把创建 Vue 实例时候传入的 router 对象注入到 Vue 实例上
        // 由于无法在静态方法中获取 VueRouter 的实例对象也就是 this，因此需要采取一种折中的方式去注入
        // 混入
        _Vue.mixin({
            beforeCreate() {
                // beforeCreate 钩子对于组件对象或路由都会执行，因此这里做下判断，只在路由对象中执行
                if (this.$options.router) {
                    // 通过在 Vue 的 prototype 上挂载 $router，就可以在 Vue 实例上拥有 $router 实例对象了
                    _Vue.prototype.$router = this.$options.router
                    this.$options.router.init()
                }
            }
        })
    }

    constructor(options) {
        this.options = options
        this.routerMap = {}
        // Vue.observable 方法用于将一个普通对象变为响应式对象
        // 使用 Vue.observable 方法创建的响应式对象可以直接用在渲染函数或者计算属性中
        // 建立 data 对象的目的就是建立一个响应式对象，在当前路由发生变化后去渲染变化后路由对应的组件
        this.data = _Vue.observable({
            // current 属性用以存储当前路由地址，默认情况下，当前路由地址是根路径
            current: '/'
        })
    }

    /**
     * 1. createRouterMap 方法用于将构造函数中传入的路由规则解析成键值对的形式存储到 this.routerMap 对象中
     * 2. routerMap 的键为路由地址，值为路由地址对应的组件，将来路由地址发生变化后，我们可以通过 routerMap 来找到新地址对应的组件，然后再将其渲染
     */
    createRouterMap() {
        // 遍历所有的路由规则，把路由规则解析成键值对的形式存储到 routeMap 中
        this.options.routes.forEach(route => {
            this.routerMap[route.path] = route.component
        });
    }

    /**
     * 1. 该方法用于创建 router-link 和 router-view 这两个组件
     * 2. router-link 组件需要接受一个 to 属性
     * 3. Vue.component 方法用于创建组件
     */
    initComponents(Vue) {
        const self = this

        // 创建 router-link 标签
        Vue.component('router-link', {
            props: {
                to: String
            },
            // router-link 最终渲染出来的是 a 标签
            // template: '<a :href="to"><slot></slot></a>'
            render(h) {
                return h('a', {
                    attrs: {
                        href: this.to
                    },
                    on: {
                        click: this.clickHander
                    }
                }, [this.$slots.default])
            },
            methods: {
                // 重新定义 router-link 标签的点击事件
                // 1. 阻止跳转
                // 2. 修改浏览器地址栏的地址为当前路由
                // 3. 将 VueRouter 实例对象上的 data 对象的 current 属性设为当前路由
                clickHander(e) {
                    history.pushState({}, '', this.to)
                    this.$router.data.current = this.to
                    e.preventDefault()
                }
            }
        })
        // 创建 router-view 标签
        Vue.component('router-view', {
            // render 函数中的 h 函数负责生成虚拟 DOM
            render(h) {
                // 1. 确定当前的路由地址
                const address = self.data.current
                // 2. 根据当前路由地址到 routerMap 对象中找到相应的组件
                const component = self.routerMap[address]
                // 3. 调用 h 函数将找到的组件渲染成虚拟 DOM 并返回，h 函数可以直接将一个组件转换成虚拟 DOM
                return h(component)
            }
        })
    }

    /**
     * 该方法用于注册 popstate 事件，当浏览器的前进后退按钮被点击时响应，并根据当前路由重新渲染页面
     */
    initEvent() {
        window.addEventListener('popstate', () => {
            // 取出当前地址栏中的地址
            this.data.current = window.location.pathname
        })
    }

    /**
     * 1. 在 init 方法内部统一调用
     */
    init() {
        this.createRouterMap()
        this.initComponents(_Vue)
        this.initEvent()
    }
}