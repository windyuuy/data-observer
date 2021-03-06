namespace vm {

    const _toString = Object.prototype.toString;
    const hasOwnProperty = Object.prototype.hasOwnProperty;

    export function isObject(obj: any) {
        return obj !== null && typeof obj === 'object'
    }

    export function hasOwn(obj: any, key: string) {
        return hasOwnProperty.call(obj, key)
    }

    export function isPlainObject(obj: any) {
        return _toString.call(obj) === '[object Object]';
    }

    export function def(obj: any, key: string, val: any, enumerable?: boolean) {
        Object.defineProperty(obj, key, {
            value: val,
            enumerable: !!enumerable,
            writable: true,
            configurable: true
        });
    }

    export function isUndef(v: any) {
        return v === undefined || v === null
    }

    export function isDef(v: any) {
        return v !== undefined && v !== null
    }

    export function isTrue(v: any) {
        return v === true
    }

    export function isFalse(v: any) {
        return v === false
    }

    /**
     * 判断是否为单纯的数据类型
     */
    export function isPrimitive(value: any) {
        return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            // $flow-disable-line
            typeof value === 'symbol' ||
            typeof value === 'boolean'
        )
    }

    export function isValidArrayIndex(val: any) {
        var n = parseFloat(String(val));
        return n >= 0 && Math.floor(n) === n && isFinite(val)
    }



    export function remove(arr: any[], item: any) {
        if (arr.length) {
            var index = arr.indexOf(item);
            if (index > -1) {
                return arr.splice(index, 1)
            }
        }
    }


    const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
    // const bailRE = new RegExp("[^" + (unicodeRegExp.source) + ".$_\\d]");

    const pathCacheMap: { [key: string]: (obj: any) => any } = {}

    /**
     * 讲使用.分隔的路径访问转换为函数。
     * @param path 
     */
    export function parsePath(path: string): ((obj: any) => any) {
        let func = pathCacheMap[path]
        if (func) {
            return func;
        }
        // if (bailRE.test(path)) {
            //复杂表达式
            var i = new Interpreter(path)
            func = function (env: any) {
                return i.run(env);
            }
        // } else {
        //     //简单的.属性访问逻辑
        //     var segments = path.split('.');
        //     func = function (obj: any) {
        //         for (var i = 0; i < segments.length; i++) {
        //             if (!obj) { return }
        //             obj = obj[segments[i]];
        //         }
        //         return obj
        //     }
        // }
        pathCacheMap[path] = func;
        return func;
    }

    export function isNative(Ctor: any) {
        return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
    }

}