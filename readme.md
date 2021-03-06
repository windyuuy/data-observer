本数据绑定库完全参考Vue，并对其进行大量简化。以满足当下需求。
不建议直接使用该库，应配合UI控件一起使用。
用法如下：
```typescript
test("简单数值绑定", () => {
    class Host extends vm.Host {
        testString: string = "a"
        tstNumber: number = 1
    }

    var view = {
        testString: "",
        tstNumber: 0
    }

    var host = new Host()
    vm.observe(host)
    host.$watch("testString", (newVal, oldVal) => {
        view.testString = newVal;
    })
    host.$watch("tstNumber", (newVal, oldVal) => {
        view.tstNumber = newVal;
    })

    host.testString = "哈哈哈"
    vm.Tick.next();
    expect(view.testString).toEqual("哈哈哈")
})

test("深层数据绑定", () => {
    class Host extends vm.Host {
        a = {
            testString: "a",
            tstNumber: 1,
            subObj: {
                testString: "a",
                tstNumber: 1,
            }
        }
    }

    var view = {
        testString: "",
        tstNumber: 0,
        subTestString: "",
        subTstNumber: 0,
        computValue: 0
    }

    var host = new Host()
    vm.observe(host)
    host.$watch("a.testString", (newVal, oldVal) => {
        view.testString = newVal;
    })
    host.$watch("a.tstNumber", (newVal, oldVal) => {
        view.tstNumber = newVal;
    })
    host.$watch("a.subObj.testString", (newVal, oldVal) => {
        view.subTestString = newVal;
    })
    host.$watch("a.subObj.tstNumber", (newVal, oldVal) => {
        view.subTstNumber = newVal;
    })

    var w = host.$watch((host: Host) => {
        return host.a.tstNumber + host.a.subObj.tstNumber
    }, (newVal, oldVal) => {
        view.computValue = newVal;
    })
    view.computValue = w?.value;
    expect(view.computValue).toEqual(2)


    host.a.testString = "哈哈哈"
    vm.Tick.next();
    expect(view.testString).toEqual("哈哈哈")

    host.a.tstNumber = 13
    vm.Tick.next();
    expect(view.tstNumber).toEqual(13)
    expect(view.computValue).toEqual(14)

    host.a.subObj.testString = "哈哈哈2"
    vm.Tick.next();
    expect(view.subTestString).toEqual("哈哈哈2")

    host.a.subObj.tstNumber = 333
    vm.Tick.next();
    expect(view.subTstNumber).toEqual(333)

    host.a.subObj = {
        testString: "测试对象",
        tstNumber: 666,
    }
    vm.Tick.next();
    expect(view.subTestString).toEqual("测试对象")
    expect(view.subTstNumber).toEqual(666)


    host.a = {
        testString: "测试1",
        tstNumber: 3,
        subObj: {
            testString: "测试2",
            tstNumber: 4,
        }
    }
    vm.Tick.next();
    expect(view.testString).toEqual("测试1")
    expect(view.tstNumber).toEqual(3)
    expect(view.subTestString).toEqual("测试2")
    expect(view.subTstNumber).toEqual(4)

})


test("深层数组", () => {
    class Host extends vm.Host {
        list: string[] = []
    }

    var view = {
        length: 0,
        list0: null,
        list1: null,
        list2: null
    }

    var host = new Host()
    vm.observe(host)
    host.$watch("list", (newVal, oldVal) => {
        view.length = newVal.length;
        view.list0 = newVal[0];
        view.list1 = newVal[1];
        view.list2 = newVal[2];
    })

    host.list.push("对象1")
    vm.Tick.next();
    expect(view.length).toEqual(1)
    expect(view.list0).toEqual("对象1")

    host.list.push("对象2")
    vm.Tick.next();
    expect(view.length).toEqual(2)
    expect(view.list1).toEqual("对象2")

    host.list.push("对象3")
    vm.Tick.next();
    expect(view.length).toEqual(3)
    expect(view.list2).toEqual("对象3")

    host.list.push("对象4")
    vm.Tick.next();
    expect(view.length).toEqual(4)


    vm.set(host.list, 1, "修改对象2");
    vm.Tick.next();
    expect(view.list1).toEqual("修改对象2")

    vm.del(host.list, 2);
    vm.Tick.next();
    expect(view.list1).toEqual("修改对象2")


})

test("watch注解", () => {

    var view = {
        testString: "",
        testNum: 0,
        testNum2: 0,
        newValue: ""
    }

    @vm.host
    class TestHost extends vm.Host {
        a = {
            testString: "a",
            tstNumber: 1,
            subObj: {
                tstNumber: 1,
            }
        }

        @vm.watch("a.testString")
        onTestStringChange(newVal: string, oldVal: string) {
            view.testString = newVal;
        }

        @vm.watch((host: TestHost) => host.a.tstNumber + host.a.subObj.tstNumber)
        onTestNumberChange(newVal: number, oldVal: number) {
            view.testNum = newVal
        }

        @vm.watch("a.tstNumber + a.subObj.tstNumber")
        onTestNumber2Change(newVal: number, oldVal: number) {
            view.testNum2 = newVal
        }


        get newTestString() {
            return this.a.testString + "666"
        }

        @vm.watch("newTestString")
        onNewStringChange(newVal: string, oldVal: string) {
            view.newValue = newVal;
        }

    }

    var h = new TestHost();

    h.a.tstNumber = 12
    h.a.testString = "哈哈哈"

    vm.Tick.next();

    expect(view.testString).toBe("哈哈哈")
    expect(view.testNum).toBe(13)
    expect(view.testNum2).toBe(13)
    expect(view.newValue).toBe("哈哈哈666")

})
```