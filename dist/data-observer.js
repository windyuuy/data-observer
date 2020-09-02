"use strict";
var vm;
(function (vm) {
    vm.uid = 0;
    /**
     * 递归遍历数组，进行ob对象的依赖记录。
     */
    function dependArray(value) {
        var obj = null;
        for (let i = 0, l = value.length; i < l; i++) {
            obj = value[i];
            if (obj && obj.__ob__) {
                obj.__ob__.dep.depend();
            }
            if (Array.isArray(obj)) {
                dependArray(obj);
            }
        }
    }
    vm.dependArray = dependArray;
    class Dependency {
        constructor() {
            /**
             * 唯一id，方便hashmap判断是否存在
             */
            this.id = vm.uid++;
            /**
             * 侦听者
             */
            this.watcherList = [];
        }
        static pushCollectTarget(target) {
            this.collectTargetStack.push(target);
            Dependency.collectTarget = target;
        }
        static popCollectTarget() {
            this.collectTargetStack.pop();
            Dependency.collectTarget = this.collectTargetStack[this.collectTargetStack.length - 1];
        }
        add(sub) {
            this.watcherList.push(sub);
        }
        /*移除一个观察者对象*/
        remove(sub) {
            vm.remove(this.watcherList, sub);
        }
        /**
         * 收集依赖
         */
        depend() {
            if (Dependency.collectTarget) {
                // Dep.target指向的是一个watcher
                Dependency.collectTarget.addDep(this);
            }
        }
        /**
         * 通知所有侦听者
         */
        notify() {
            const ws = this.watcherList.slice();
            for (let i = 0, l = ws.length; i < l; i++) {
                ws[i].update();
            }
        }
    }
    /**
     * 当前正在收集依赖的对象
     */
    Dependency.collectTarget = null;
    /**
     * 当前正在收集以来的列队
     */
    Dependency.collectTargetStack = [];
    vm.Dependency = Dependency;
})(vm || (vm = {}));
var vm;
(function (vm) {
    class Host {
        constructor() {
            this._watcherList = [];
        }
    }
    vm.Host = Host;
})(vm || (vm = {}));
var vm;
(function (vm) {
    var _Set;
    if (typeof Set !== 'undefined' && vm.isNative(Set)) {
        _Set = Set;
    }
    else {
        class _IdMap {
            constructor() {
                this.set = Object.create(null);
            }
            has(key) {
                return this.set[key] === true;
            }
            add(key) {
                this.set[key] = true;
            }
            clear() {
                this.set = Object.create(null);
            }
        }
        _Set = _IdMap;
    }
    vm.IdMap = _Set;
})(vm || (vm = {}));
var vm;
(function (vm) {
    //创建数组的函数代理
    var arrayProto = Array.prototype;
    var arrayMethods = Object.create(arrayProto);
    var methodsToPatch = [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice',
        'sort',
        'reverse'
    ];
    methodsToPatch.forEach(function (method) {
        var original = arrayProto[method]; //缓存原始方法
        vm.def(arrayMethods, method, function () {
            var args = [], len = arguments.length;
            while (len--)
                args[len] = arguments[len];
            var result = original.apply(this, args);
            var ob = this.__ob__;
            var inserted;
            switch (method) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break;
            }
            if (inserted) {
                ob.observeArray(inserted);
            }
            //通知刷新
            ob.dep.notify();
            return result;
        });
    });
    /**
     * 将对象处理为可观察对象
     */
    function observe(value) {
        if (!vm.isObject(value)) {
            return;
        }
        let ob;
        if (value.__ob__ instanceof Observer) {
            //对象已经绑定
            ob = value.__ob__;
        }
        else if (Object.isExtensible(value) && (Array.isArray(value) || vm.isPlainObject(value))) {
            //只有普通的对象才可以进行观察
            return new Observer(value);
        }
        return ob;
    }
    vm.observe = observe;
    /**
     * 拦截对象所有的key和value
     */
    function defineReactive(obj, key, 
    /**
     * 对象的默认值，也就是 obj[key]
     */
    val) {
        //必包的中依赖，相当于是每一个属性的附加对象，用于记录属性的所有以来侦听。
        const dep = new vm.Dependency();
        const property = Object.getOwnPropertyDescriptor(obj, key);
        if (property && property.configurable === false) {
            return;
        }
        const getter = property && property.get;
        const setter = property && property.set;
        let valOb = observe(val);
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter() {
                const value = getter ? getter.call(obj) : val;
                //进行依赖收集，依赖收集前 Dependency.collectTarget 会被赋值，收集完成后会置空。
                if (vm.Dependency.collectTarget) {
                    dep.depend(); //自身的依赖
                    if (valOb) {
                        valOb.dep.depend(); //属性值依赖
                    }
                    if (Array.isArray(value)) {
                        vm.dependArray(value);
                    }
                }
                return value;
            },
            set: function reactiveSetter(newVal) {
                const value = getter ? getter.call(obj) : val;
                if (newVal === value || (newVal !== newVal && value !== value)) {
                    return; //相等则无需进行后续处理
                }
                if (setter) {
                    setter.call(obj, newVal);
                }
                else {
                    val = newVal;
                }
                valOb = observe(newVal); //如果是普通对象需要处理成可观察的
                dep.notify(); //触发刷新
            }
        });
    }
    vm.defineReactive = defineReactive;
    class Observer {
        constructor(value) {
            this.value = value;
            this.dep = new vm.Dependency();
            //实现双向绑定
            vm.def(value, '__ob__', this);
            if (Array.isArray(value)) {
                //覆盖所有函数
                value.__proto__ = arrayMethods;
                this.observeArray(value);
            }
            else {
                /*如果是对象则直接walk进行绑定*/
                this.walk(value);
            }
        }
        /**
         * 遍历所有属性，拦截get set
         */
        walk(obj) {
            const keys = Object.keys(obj);
            for (let i = 0; i < keys.length; i++) {
                defineReactive(obj, keys[i], obj[keys[i]]);
            }
        }
        /**
         * 所以成员都替换成observe
         */
        observeArray(items) {
            for (let i = 0, l = items.length; i < l; i++) {
                observe(items[i]);
            }
        }
    }
    vm.Observer = Observer;
})(vm || (vm = {}));
var vm;
(function (vm) {
    class Tick {
        static add(w) {
            if (!this.queueMap.has(w.id)) {
                this.queueMap.add(w.id);
                this.queue.push(w);
            }
        }
        static next() {
            this.queueMap.clear();
            const temp = this.queue;
            this.queue = this.temp;
            this.temp = temp;
            for (let w of temp) {
                w.run();
            }
            temp.length = 0;
        }
    }
    Tick.temp = [];
    Tick.queue = [];
    Tick.queueMap = new vm.IdMap();
    vm.Tick = Tick;
})(vm || (vm = {}));
var vm;
(function (vm) {
    class Watcher {
        constructor(host, expOrFn, cb, options) {
            this.host = host;
            // options
            if (options) {
                this.sync = !!options.sync;
            }
            else {
                this.sync = false;
            }
            this.cb = cb;
            this.id = ++vm.uid;
            this.active = true;
            this.deps = [];
            this.newDeps = [];
            this.depIds = new vm.IdMap();
            this.newDepIds = new vm.IdMap();
            if (typeof expOrFn === 'function') {
                this.getter = expOrFn;
            }
            else {
                this.getter = vm.parsePath(expOrFn);
                if (!this.getter) {
                    this.getter = function () { };
                    console.warn(`expOrFn 路径异常: "${expOrFn}" `);
                }
            }
            this.value = this.get();
        }
        /**
         * 获取值，并重新收集依赖
         */
        get() {
            /*开始收集依赖*/
            vm.Dependency.pushCollectTarget(this);
            let value;
            value = this.getter.call(this.host, this.host);
            /*结束收集*/
            vm.Dependency.popCollectTarget();
            this.cleanupDeps();
            return value;
        }
        /**
         * 添加依赖
         * 在收集依赖的时候，触发 Dependency.collectTarget.addDep
         */
        addDep(dep) {
            const id = dep.id;
            if (!this.newDepIds.has(id)) {
                this.newDepIds.add(id);
                this.newDeps.push(dep);
                //向dep添加自己，实现双向访问，depIds用作重复添加的缓存
                if (!this.depIds.has(id)) {
                    dep.add(this);
                }
            }
        }
        /**
         * 清理依赖收集
         */
        cleanupDeps() {
            //移除本次收集后，不需要的依赖（通过差异对比）
            let i = this.deps.length;
            while (i--) {
                const dep = this.deps[i];
                if (!this.newDepIds.has(dep.id)) {
                    dep.remove(this);
                }
            }
            //让new作为当前记录的依赖，并清空旧的
            this.depIds = this.newDepIds;
            this.newDepIds.clear();
            let tmp = this.deps;
            this.deps = this.newDeps;
            this.newDeps = tmp;
            this.newDeps.length = 0;
        }
        /**
         * 当依赖发生变化就会被执行
         */
        update() {
            if (this.sync) {
                //立即渲染
                this.run();
            }
            else {
                //下一帧渲染，可以降低重复渲染的概率
                vm.Tick.add(this);
            }
        }
        /**
         * 执行watch
         */
        run() {
            if (this.active) {
                const value = this.get();
                //如果数值不想等，或者是复杂对象就需要更新视图
                if (value !== this.value || vm.isObject(value)) {
                    const oldValue = this.value;
                    this.value = value;
                    /*触发回调渲染视图*/
                    this.cb.call(value, oldValue);
                }
            }
        }
        /**
         * 收集该watcher的所有deps依赖
         */
        depend() {
            let i = this.deps.length;
            while (i--) {
                this.deps[i].depend();
            }
        }
        /**
         * 将自身从所有依赖收集订阅列表删除
         */
        teardown() {
            if (this.active) {
                vm.remove(this.host._watcherList, this);
                let i = this.deps.length;
                while (i--) {
                    this.deps[i].remove(this);
                }
                this.active = false;
            }
        }
    }
    vm.Watcher = Watcher;
})(vm || (vm = {}));
var vm;
(function (vm) {
    const _toString = Object.prototype.toString;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    vm.isObject = isObject;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key);
    }
    vm.hasOwn = hasOwn;
    function isPlainObject(obj) {
        return _toString.call(obj) === '[object Object]';
    }
    vm.isPlainObject = isPlainObject;
    function def(obj, key, val, enumerable) {
        Object.defineProperty(obj, key, {
            value: val,
            enumerable: !!enumerable,
            writable: true,
            configurable: true
        });
    }
    vm.def = def;
    function remove(arr, item) {
        if (arr.length) {
            var index = arr.indexOf(item);
            if (index > -1) {
                return arr.splice(index, 1);
            }
        }
    }
    vm.remove = remove;
    const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
    const bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
    /**
     * 讲使用.分隔的路径访问转换为函数。
     * @param path
     */
    function parsePath(path) {
        if (bailRE.test(path)) {
            return;
        }
        var segments = path.split('.');
        return function (obj) {
            for (var i = 0; i < segments.length; i++) {
                if (!obj) {
                    return;
                }
                obj = obj[segments[i]];
            }
            return obj;
        };
    }
    vm.parsePath = parsePath;
    function isNative(Ctor) {
        return typeof Ctor === 'function' && /native code/.test(Ctor.toString());
    }
    vm.isNative = isNative;
})(vm || (vm = {}));