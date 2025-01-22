# 架构原理

qiankun 中沙箱的实现有三种。
是否支持 Proxy 代理, 分 2 套方案,分别是 快照模式 SnapshotSandbox 和代理模式,代理模式又根据是否单实例场景实现 LegacySandbox 和 ProxySandbox.
如果一个页面上都多个微前端应用，使用 ProxySandbox，否则使用 LegacySandbox。如果不支持 Proxy，使用 SnapshotSandbox。

qiankun 默认配置 jsSandBox 是启用的,初始化 loadApp 会判断 jsSandbox 生成一个全局对象,通过调用 genSandbox 生成沙箱环境.

```js
// qiankun/src/loader.ts
if (jsSandbox) {
  // appName 注册是传入的子应用 name
  // containerGetter dom 的包装
  // singular 单实例场景
  const sandbox = genSandbox(appName, containerGetter, Boolean(singular));
  // 用沙箱的代理对象作为接下来使用的全局对象
  global = sandbox.sandbox;
  mountSandbox = sandbox.mount;
  unmountSandbox = sandbox.unmount;
}
```

createSandbox 是在 loadApp 的时候执行的。返回值中包含 mount 和 unmount 两个函数，分别在微应用 mount 和 unmount 生命周期执行。

```js
// qiankun/src/sandbox/index.ts
export function createSandbox(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  singular: boolean
) {
  // mounting freers are one-off and should be re-init at every mounting time
  let mountingFreers: Freer[] = [];

  let sideEffectsRebuilders: Rebuilder[] = [];

  let sandbox: SandBox;
  if (window.Proxy) {
    sandbox = singular ? new LegacySandbox(appName) : new ProxySandbox(appName);
  } else {
    sandbox = new SnapshotSandbox(appName);
  }

  // some side effect could be be invoked while bootstrapping, such as dynamic stylesheet injection with style-loader, especially during the development phase
  const bootstrappingFreers = patchAtBootstrapping(
    appName,
    elementGetter,
    sandbox.proxy,
    singular
  );

  return {
    proxy: sandbox.proxy,

    /**
     * 沙箱被 mount
     * 可能是从 bootstrap 状态进入的 mount
     * 也可能是从 unmount 之后再次唤醒进入 mount
     */
    async mount() {
      // bootstrappingFreers 的 length 是 1
      const sideEffectsRebuildersAtBootstrapping = sideEffectsRebuilders.slice(
        0,
        bootstrappingFreers.length
      );
      const sideEffectsRebuildersAtMounting = sideEffectsRebuilders.slice(
        bootstrappingFreers.length
      );

      // must rebuild the side effects which added at bootstrapping firstly to recovery to nature state
      if (sideEffectsRebuildersAtBootstrapping.length) {
        // 执行 rebuild
        sideEffectsRebuildersAtBootstrapping.forEach((rebuild) => rebuild());
      }

      /* ------------------------------------------ 因为有上下文依赖（window），以下代码执行顺序不能变 ------------------------------------------ */

      /* ------------------------------------------ 1. 启动/恢复 沙箱------------------------------------------ */
      sandbox.active();

      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(
        appName,
        elementGetter,
        sandbox.proxy,
        singular
      );

      /* ------------------------------------------ 3. 重置一些初始化时的副作用 ------------------------------------------*/
      // 存在 rebuilder 则表明有些副作用需要重建
      if (sideEffectsRebuildersAtMounting.length) {
        sideEffectsRebuildersAtMounting.forEach((rebuild) => rebuild());
      }

      // clean up rebuilders
      sideEffectsRebuilders = [];
    },

    /**
     * 恢复 global 状态，使其能回到应用加载之前的状态
     */
    async unmount() {
      // record the rebuilders of window side effects (event listeners or timers)
      // note that the frees of mounting phase are one-off as it will be re-init at next mounting

      // 执行 free 操作
      // sideEffectsRebuilders 赋值
      sideEffectsRebuilders = [...bootstrappingFreers, ...mountingFreers].map(
        (free) => free()
      );
      // 激活和卸载时都要用到这个

      sandbox.inactive();
    },
  };
}
```

patchAtBootstrapping 方法, 该方法会对 document.createElement,HTML DOM appendChild，HTML DOM removeChild，HTML DOM insertBefore 做处理，以便 style 和 script 能顺利的挂载到微应用下面。

```js
import patchDynamicAppend from "./dynamicHeadAppend";

export function patchAtBootstrapping(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  proxy: Window,
  singular: boolean
): Freer[] {
  return [patchDynamicAppend(appName, elementGetter, proxy, false, singular)];
}
```

snapshotSandBox 快照模式沙箱, 整体上看来就是把 window 对象拷贝给一个新对象缓存起来,在退出的时候比对下缓存,然后把变更的数据通过一个 modify 变量存起来,然后通过快照还原 window

```js
    export default class SnapshotSandbox implements SandBox {
        // 代理对象，初始化后这里是指window对象
        proxy: WindowProxy;
        // 沙箱的名字
        name: string;
        // 沙箱是否为激活状态，即运行中
        sandboxRunning = false;
        // 沙箱激活时执行iter拷贝一层window对象到该对象上
        private windowSnapshot!: Window;
        // 记录当前子应用运行时修改了哪些window属性
        private modifyPropsMap: Record<any, any> = {};

        constructor(name: string) {
            // 给沙箱取个名字
            this.name = name;
            // 代理window
            this.proxy = window;
            // 子应用挂载时激活沙箱
            this.active();
        }

        active() {
            // 如果发现沙箱正在运行中 直接返回
            if (this.sandboxRunning) {
                return;
            }

            // 记录当前快照
            // 初始化一个空对象
            this.windowSnapshot = {} as Window;
            // 把window的属性拷贝一层下来
            iter(window, prop => {
                this.windowSnapshot[prop] = window[prop];
            });

            // 恢复之前的变更
            Object.keys(this.modifyPropsMap).forEach((p: any) => {
                window[p] = this.modifyPropsMap[p];
            });
            // 进入沙箱环境立即锁定防止重复执行active
            this.sandboxRunning = true;
        }

        inactive() {
            // 当前子应用退出时记录被变更的属性
            this.modifyPropsMap = {};

            iter(window, prop => {
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 记录变更，恢复环境
                    // 记录变更的window属性，在下次执行active时还原这些属性
                    this.modifyPropsMap[prop] = window[prop];
                    // 当前子应用退出时，比对快照把window恢复当初始状态
                    window[prop] = this.windowSnapshot[prop];
                }
            });

            if (process.env.NODE_ENV === 'development') {
                console.info(`[qiankun:sandbox] ${this.name} origin window restore...`, Object.keys(this.modifyPropsMap));
            }
            // 沙箱状态变更为false，未激活
            this.sandboxRunning = false;
        }
    }





```

ProxSandbox 其实是通过 Object.defineProperty 对 window 对象做了一层代理操作, 定义了一个 Map 对象 updateValueMap,后面操作全局属性优先读取 updateValueMap 上的属性,updateValueMap 是对 window 对象所有可配置属性的一层代理, 在子应用沙箱中修改全局对象属性也是 proxy 到 updateValueMap 对象上,调用 updateValueMap.set(key, value)做临时环境变量存储的映射.

```js
    export default class ProxySandbox implements SandBox {
        /** window 值变更的记录快照 */
        // 这里定义了Map，后面对代理操作的属性先从这里取
        private updateValueMap = new Map<PropertyKey, any>();
        // 沙箱的名字
        name: string;
        // 代理对象 这里就是window
        proxy: WindowProxy;
        // 默认为运行中，激活状态
        sandboxRunning = true;

        active() {
            // 沙箱激活
            this.sandboxRunning = true;
        }

        inactive() {
            if (process.env.NODE_ENV === 'development') {
                console.info(`[qiankun:sandbox] ${this.name} modified global properties restore...`, [
                    ...this.updateValueMap.keys(),
                ]);
            }
            // 沙箱关闭，退出
            this.sandboxRunning = false;
        }

        constructor(name: string) {
            // 初始化沙箱名字
            this.name = name;
            const { sandboxRunning, updateValueMap } = this;

            const boundValueSymbol = Symbol('bound value');
            // https://github.com/umijs/qiankun/pull/192
            // 缓存一份原始的window对象
            const rawWindow = window;
            // 将configurable为true的可配置window属性代理到fakeWindow上
            const fakeWindow = createFakeWindow(rawWindow);
            // 初始化沙箱抛出proxy提供访问
            const proxy = new Proxy(fakeWindow, {
                set(_: Window, p: PropertyKey, value: any): boolean {
                    if (sandboxRunning) {
                // 在修改全局环境属性的时候实际上是把该属性通过key映射存在我们定义的updateValueMap上，等我们下次访问的时候就从这个对象上优先读取
                        updateValueMap.set(p, value);

                        return true;
                    }

                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`[qiankun] Set window.${p.toString()} while jsSandbox destroyed or inactive in ${name}!`);
                    }

                    // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
                    return true;
                },

                get(_: Window, p: PropertyKey): any {
                    // avoid who using window.window or window.self to escape the sandbox environment to touch the really window
                    // or use window.top to check if an iframe context
                    // see https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js#L13
                    // 访问top window self 即访问代理对象 具体可以控制台输入window.top window.window window.self看一下
                    if (p === 'top' || p === 'window' || p === 'self') {
                        return proxy;
                    }

                    // just for test
                    if (process.env.NODE_ENV === 'test' && p === 'mockTop') {
                        return proxy;
                    }

                    // proxy.hasOwnProperty would invoke getter firstly, then its value represented as rawWindow.hasOwnProperty
                    // 当调用到window.hasOwnProperty时优先去updateValueMap上查找，否则调用window.hasOwnProperty判断
                    if (p === 'hasOwnProperty') {
                        return (key: PropertyKey) => updateValueMap.has(key) || rawWindow.hasOwnProperty(key);
                    }

                    // Take priority from the updateValueMap, or fallback to window
                    // 所有属性优先从updateValueMap上找
                    const value = updateValueMap.get(p) || (rawWindow as any)[p];
                    /*
                    仅绑定 !isConstructable && isCallable 的函数对象，如 window.console、window.atob 这类。目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
                    @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
                    */
                    if (typeof value === 'function' && !isConstructable(value)) {
                        if (value[boundValueSymbol]) {
                            return value[boundValueSymbol];
                        }

                        const boundValue = value.bind(rawWindow);
                        // some callable function has custom fields, we need to copy the enumerable props to boundValue. such as moment function.
                        Object.keys(value).forEach(key => (boundValue[key] = value[key]));
                        Object.defineProperty(value, boundValueSymbol, { enumerable: false, value: boundValue });
                        return boundValue;
                    }

                    return value;
                },

                // trap in operator
                // see https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/constants.js#L12
                has(_: Window, p: string | number | symbol): boolean {
                    // 是否是window的属性
                    return updateValueMap.has(p) || p in rawWindow;
                },

                getOwnPropertyDescriptor(target: Window, p: string | number | symbol): PropertyDescriptor | undefined {
                    if (updateValueMap.has(p)) {
                        // if the property is existed on raw window, use it original descriptor
                        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, p);
                        if (descriptor) {
                            return descriptor;
                        }

                        return { configurable: true, enumerable: true, writable: true, value: updateValueMap.get(p) };
                    }

                    /*
                    as the descriptor of top/self/window/mockTop in raw window are configurable but not in proxy target, we need to get it from target to avoid TypeError
                    see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
                    > A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
                    */
                    if (target.hasOwnProperty(p)) {
                        return Object.getOwnPropertyDescriptor(target, p);
                    }

                    if (rawWindow.hasOwnProperty(p)) {
                        return Object.getOwnPropertyDescriptor(rawWindow, p);
                    }

                    return undefined;
                },

                // trap to support iterator with sandbox
                // 把window的可编辑属性，不可编辑属性全部取出来，调用lodash的uniq愉快的取个重
                ownKeys(): PropertyKey[] {
                    return uniq([...Reflect.ownKeys(rawWindow), ...updateValueMap.keys()]);
                },
                // 有些小伙伴可能会冲动的去删window对象的属性，正常情况下肯定是不能删的了，所以我们就删代理对象上的呗
                deleteProperty(_: Window, p: string | number | symbol): boolean {
                    if (updateValueMap.has(p)) {
                        updateValueMap.delete(p);

                        return true;
                    }

                    return true;
                }
            });

            this.proxy = proxy;
        }
    }
```

```js
function createFakeWindow(global: Window): Window {
  const fakeWindow = {} as FakeWindow;

  // Object.getOwnPropertyNames()方法返回一个由指定对象的所有自身属性的属性名
  // 包括不可枚举属性但不包括Symbol值作为名称的属性组成的数组。
  Object.getOwnPropertyNames(global)
    // 找到 window 对象中不可改变或不可删除的属性
    .filter(p => {
      // Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。
      // 自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性
      const descriptor = Object.getOwnPropertyDescriptor(global, p);

      // configurable 当且仅当指定对象的属性描述可以被改变或者属性可被删除时，为true
      return !descriptor?.configurable;
    })
    .forEach(p => {
      const descriptor = Object.getOwnPropertyDescriptor(global, p);
      if (descriptor) {

        // 这些属性中找到 top self window 属性，将其配置为 configurable
        if (
          p === 'top' ||
          p === 'self' ||
          p === 'window' ||
          (process.env.NODE_ENV === 'test' && (p === 'mockTop' || p === 'mockSafariTop'))
        ) {
          descriptor.configurable = true;
          /*
           The descriptor of window.window/window.top/window.self in Safari/FF are accessor descriptors, we need to avoid adding a data descriptor while it was
           Example:
            Safari/FF: Object.getOwnPropertyDescriptor(window, 'top') -> {get: function, set: undefined, enumerable: true, configurable: false}
            Chrome: Object.getOwnPropertyDescriptor(window, 'top') -> {value: Window, writable: false, enumerable: true, configurable: false}
           */

          // 如果 descriptor 有 get 方法，将 descriptor 设置为 writable
          if (!Object.prototype.hasOwnProperty.call(descriptor, 'get')) {
            descriptor.writable = true;
          }
        }

        // freeze the descriptor to avoid being modified by zone.js
        // const rawObjectDefineProperty = Object.defineProperty;
        // fakeWindow 中放置这些属性
        rawObjectDefineProperty(fakeWindow, p, Object.freeze(descriptor!));
      }
    });

  return fakeWindow;
}


```

沙箱的实现比较繁琐，首先在初始化阶段，使用 Proxy 生成一个 window 对象的代理，将 windows 上不可改变或不可删除的属性的 configurable 设置为 true，放到代理对象中。然后重写 document.createElement，appendChild，removeChild，insertBefore 方法，改写了 style 和 script 的加载方式，以便 style 和 script 能顺利的挂载到微应用下面。

沙箱初始化完毕后，对外暴露 mount 和 unmount 方法，用于在微应用的同名生命周期中调用。mount 方法修改一些会产生副作用的全局函数，比如 window.setInterval 产生的定时任务，或者是 window.addEventListener 产生的监听，同一个微应用的这些副作用会存储在一些，这样在 unmount 阶段的时候就很容易根据应用进行清理。mount 方法也会对 script 和 style 劫持，和初始化过程基本一致，mount 方法会有一些跟别的框架相关的逻辑，比如 umi，原因是使用 umi 框架会对全局造成影响，qiankun 需要屏蔽这部分变化导致的 bug。 unmount 阶段没什么，就是对 mount 阶段副作用的清理。

## qiankun 沙箱处理原理

qiankun 中沙箱的实现有三种。
是否支持 Proxy 代理, 分 2 套方案,分别是 快照模式 (SnapshotSandbox) 和代理模式,代理模式又根据是否是单实例场景实现 LegacySandbox 和 ProxySandbox.
如果一个页面上有多个微前端应用，使用 ProxySandbox，否则使用 LegacySandbox。如果不支持 Proxy，使用 SnapshotSandbox。

qiankun 默认配置 jsSandBox 是启用的,初始化 loadApp 会判断 jsSandbox 生成一个全局对象,通过调用 genSandbox 生成沙箱环境.

```js
// qiankun/src/loader.ts
if (jsSandbox) {
  // appName 注册是传入的子应用 name
  // containerGetter dom 的包装
  // singular 单实例场景
  const sandbox = genSandbox(appName, containerGetter, Boolean(singular));
  // 用沙箱的代理对象作为接下来使用的全局对象
  global = sandbox.sandbox;
  mountSandbox = sandbox.mount;
  unmountSandbox = sandbox.unmount;
}
```

createSandbox 是在 loadApp 的时候执行的。返回值中包含 mount 和 unmount 两个函数，分别在微应用 mount 和 unmount 生命周期执行。

```js
// qiankun/src/sandbox/index.ts
export function createSandbox(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  singular: boolean
) {
  // mounting freers are one-off and should be re-init at every mounting time
  let mountingFreers: Freer[] = [];

  let sideEffectsRebuilders: Rebuilder[] = [];

  let sandbox: SandBox;
  if (window.Proxy) {
    sandbox = singular ? new LegacySandbox(appName) : new ProxySandbox(appName);
  } else {
    sandbox = new SnapshotSandbox(appName);
  }

  // some side effect could be be invoked while bootstrapping, such as dynamic stylesheet injection with style-loader, especially during the development phase
  const bootstrappingFreers = patchAtBootstrapping(
    appName,
    elementGetter,
    sandbox.proxy,
    singular
  );

  return {
    proxy: sandbox.proxy,

    /**
     * 沙箱被 mount
     * 可能是从 bootstrap 状态进入的 mount
     * 也可能是从 unmount 之后再次唤醒进入 mount
     */
    async mount() {
      // bootstrappingFreers 的 length 是 1
      const sideEffectsRebuildersAtBootstrapping = sideEffectsRebuilders.slice(
        0,
        bootstrappingFreers.length
      );
      const sideEffectsRebuildersAtMounting = sideEffectsRebuilders.slice(
        bootstrappingFreers.length
      );

      // must rebuild the side effects which added at bootstrapping firstly to recovery to nature state
      if (sideEffectsRebuildersAtBootstrapping.length) {
        // 执行 rebuild
        sideEffectsRebuildersAtBootstrapping.forEach((rebuild) => rebuild());
      }

      /* ------------------------------------------ 因为有上下文依赖（window），以下代码执行顺序不能变 ------------------------------------------ */

      /* ------------------------------------------ 1. 启动/恢复 沙箱------------------------------------------ */
      sandbox.active();

      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(
        appName,
        elementGetter,
        sandbox.proxy,
        singular
      );

      /* ------------------------------------------ 3. 重置一些初始化时的副作用 ------------------------------------------*/
      // 存在 rebuilder 则表明有些副作用需要重建
      if (sideEffectsRebuildersAtMounting.length) {
        sideEffectsRebuildersAtMounting.forEach((rebuild) => rebuild());
      }

      // clean up rebuilders
      sideEffectsRebuilders = [];
    },

    /**
     * 恢复 global 状态，使其能回到应用加载之前的状态
     */
    async unmount() {
      // record the rebuilders of window side effects (event listeners or timers)
      // note that the frees of mounting phase are one-off as it will be re-init at next mounting

      // 执行 free 操作
      // sideEffectsRebuilders 赋值
      sideEffectsRebuilders = [...bootstrappingFreers, ...mountingFreers].map(
        (free) => free()
      );
      // 激活和卸载时都要用到这个

      sandbox.inactive();
    },
  };
}
```

patchAtBootstrapping 方法, 该方法会对 document.createElement,HTML DOM appendChild，HTML DOM removeChild，HTML DOM insertBefore 做处理，以便 style 和 script 能顺利的挂载到微应用下面。

```js
import patchDynamicAppend from "./dynamicHeadAppend";

export function patchAtBootstrapping(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  proxy: Window,
  singular: boolean
): Freer[] {
  return [patchDynamicAppend(appName, elementGetter, proxy, false, singular)];
}
```

snapshotSandBox 快照模式沙箱, 整体上看来就是把 window 对象拷贝给一个新对象缓存起来,在退出的时候比对下缓存,然后把变更的数据通过一个 modify 变量存起来,然后通过快照还原 window

```js
    export default class SnapshotSandbox implements SandBox {
        // 代理对象，初始化后这里是指window对象
        proxy: WindowProxy;
        // 沙箱的名字
        name: string;
        // 沙箱是否为激活状态，即运行中
        sandboxRunning = false;
        // 沙箱激活时执行iter拷贝一层window对象到该对象上
        private windowSnapshot!: Window;
        // 记录当前子应用运行时修改了哪些window属性
        private modifyPropsMap: Record<any, any> = {};

        constructor(name: string) {
            // 给沙箱取个名字
            this.name = name;
            // 代理window
            this.proxy = window;
            // 子应用挂载时激活沙箱
            this.active();
        }

        active() {
            // 如果发现沙箱正在运行中 直接返回
            if (this.sandboxRunning) {
                return;
            }

            // 记录当前快照
            // 初始化一个空对象
            this.windowSnapshot = {} as Window;
            // 把window的属性拷贝一层下来
            iter(window, prop => {
                this.windowSnapshot[prop] = window[prop];
            });

            // 恢复之前的变更
            Object.keys(this.modifyPropsMap).forEach((p: any) => {
                window[p] = this.modifyPropsMap[p];
            });
            // 进入沙箱环境立即锁定防止重复执行active
            this.sandboxRunning = true;
        }

        inactive() {
            // 当前子应用退出时记录被变更的属性
            this.modifyPropsMap = {};

            iter(window, prop => {
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 记录变更，恢复环境
                    // 记录变更的window属性，在下次执行active时还原这些属性
                    this.modifyPropsMap[prop] = window[prop];
                    // 当前子应用退出时，比对快照把window恢复当初始状态
                    window[prop] = this.windowSnapshot[prop];
                }
            });

            if (process.env.NODE_ENV === 'development') {
                console.info(`[qiankun:sandbox] ${this.name} origin window restore...`, Object.keys(this.modifyPropsMap));
            }
            // 沙箱状态变更为false，未激活
            this.sandboxRunning = false;
        }
    }





```

ProxSandbox 其实是通过 Object.defineProperty 对 window 对象做了一层代理操作, 定义了一个 Map 对象 updateValueMap,后面操作全局属性优先读取 updateValueMap 上的属性,updateValueMap 是对 window 对象所有可配置属性的一层代理, 在子应用沙箱中修改全局对象属性也是 proxy 到 updateValueMap 对象上,调用 updateValueMap.set(key, value)做临时环境变量存储的映射.

```js
    export default class ProxySandbox implements SandBox {
        /** window 值变更的记录快照 */
        // 这里定义了Map，后面对代理操作的属性先从这里取
        private updateValueMap = new Map<PropertyKey, any>();
        // 沙箱的名字
        name: string;
        // 代理对象 这里就是window
        proxy: WindowProxy;
        // 默认为运行中，激活状态
        sandboxRunning = true;

        active() {
            // 沙箱激活
            this.sandboxRunning = true;
        }

        inactive() {
            if (process.env.NODE_ENV === 'development') {
                console.info(`[qiankun:sandbox] ${this.name} modified global properties restore...`, [
                    ...this.updateValueMap.keys(),
                ]);
            }
            // 沙箱关闭，退出
            this.sandboxRunning = false;
        }

        constructor(name: string) {
            // 初始化沙箱名字
            this.name = name;
            const { sandboxRunning, updateValueMap } = this;

            const boundValueSymbol = Symbol('bound value');
            // https://github.com/umijs/qiankun/pull/192
            // 缓存一份原始的window对象
            const rawWindow = window;
            // 将configurable为true的可配置window属性代理到fakeWindow上
            const fakeWindow = createFakeWindow(rawWindow);
            // 初始化沙箱抛出proxy提供访问
            const proxy = new Proxy(fakeWindow, {
                set(_: Window, p: PropertyKey, value: any): boolean {
                    if (sandboxRunning) {
                // 在修改全局环境属性的时候实际上是把该属性通过key映射存在我们定义的updateValueMap上，等我们下次访问的时候就从这个对象上优先读取
                        updateValueMap.set(p, value);

                        return true;
                    }

                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`[qiankun] Set window.${p.toString()} while jsSandbox destroyed or inactive in ${name}!`);
                    }

                    // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
                    return true;
                },

                get(_: Window, p: PropertyKey): any {
                    // avoid who using window.window or window.self to escape the sandbox environment to touch the really window
                    // or use window.top to check if an iframe context
                    // see https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js#L13
                    // 访问top window self 即访问代理对象 具体可以控制台输入window.top window.window window.self看一下
                    if (p === 'top' || p === 'window' || p === 'self') {
                        return proxy;
                    }

                    // just for test
                    if (process.env.NODE_ENV === 'test' && p === 'mockTop') {
                        return proxy;
                    }

                    // proxy.hasOwnProperty would invoke getter firstly, then its value represented as rawWindow.hasOwnProperty
                    // 当调用到window.hasOwnProperty时优先去updateValueMap上查找，否则调用window.hasOwnProperty判断
                    if (p === 'hasOwnProperty') {
                        return (key: PropertyKey) => updateValueMap.has(key) || rawWindow.hasOwnProperty(key);
                    }

                    // Take priority from the updateValueMap, or fallback to window
                    // 所有属性优先从updateValueMap上找
                    const value = updateValueMap.get(p) || (rawWindow as any)[p];
                    /*
                    仅绑定 !isConstructable && isCallable 的函数对象，如 window.console、window.atob 这类。目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
                    @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
                    */
                    if (typeof value === 'function' && !isConstructable(value)) {
                        if (value[boundValueSymbol]) {
                            return value[boundValueSymbol];
                        }

                        const boundValue = value.bind(rawWindow);
                        // some callable function has custom fields, we need to copy the enumerable props to boundValue. such as moment function.
                        Object.keys(value).forEach(key => (boundValue[key] = value[key]));
                        Object.defineProperty(value, boundValueSymbol, { enumerable: false, value: boundValue });
                        return boundValue;
                    }

                    return value;
                },

                // trap in operator
                // see https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/constants.js#L12
                has(_: Window, p: string | number | symbol): boolean {
                    // 是否是window的属性
                    return updateValueMap.has(p) || p in rawWindow;
                },

                getOwnPropertyDescriptor(target: Window, p: string | number | symbol): PropertyDescriptor | undefined {
                    if (updateValueMap.has(p)) {
                        // if the property is existed on raw window, use it original descriptor
                        const descriptor = Object.getOwnPropertyDescriptor(rawWindow, p);
                        if (descriptor) {
                            return descriptor;
                        }

                        return { configurable: true, enumerable: true, writable: true, value: updateValueMap.get(p) };
                    }

                    /*
                    as the descriptor of top/self/window/mockTop in raw window are configurable but not in proxy target, we need to get it from target to avoid TypeError
                    see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
                    > A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
                    */
                    if (target.hasOwnProperty(p)) {
                        return Object.getOwnPropertyDescriptor(target, p);
                    }

                    if (rawWindow.hasOwnProperty(p)) {
                        return Object.getOwnPropertyDescriptor(rawWindow, p);
                    }

                    return undefined;
                },

                // trap to support iterator with sandbox
                // 把window的可编辑属性，不可编辑属性全部取出来，调用lodash的uniq愉快的取个重
                ownKeys(): PropertyKey[] {
                    return uniq([...Reflect.ownKeys(rawWindow), ...updateValueMap.keys()]);
                },
                // 有些小伙伴可能会冲动的去删window对象的属性，正常情况下肯定是不能删的了，所以我们就删代理对象上的呗
                deleteProperty(_: Window, p: string | number | symbol): boolean {
                    if (updateValueMap.has(p)) {
                        updateValueMap.delete(p);

                        return true;
                    }

                    return true;
                }
            });

            this.proxy = proxy;
        }
    }
```

```js
function createFakeWindow(global: Window): Window {
  const fakeWindow = {} as FakeWindow;

  // Object.getOwnPropertyNames()方法返回一个由指定对象的所有自身属性的属性名
  // 包括不可枚举属性但不包括Symbol值作为名称的属性组成的数组。
  Object.getOwnPropertyNames(global)
    // 找到 window 对象中不可改变或不可删除的属性
    .filter(p => {
      // Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。
      // 自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性
      const descriptor = Object.getOwnPropertyDescriptor(global, p);

      // configurable 当且仅当指定对象的属性描述可以被改变或者属性可被删除时，为true
      return !descriptor?.configurable;
    })
    .forEach(p => {
      const descriptor = Object.getOwnPropertyDescriptor(global, p);
      if (descriptor) {

        // 这些属性中找到 top self window 属性，将其配置为 configurable
        if (
          p === 'top' ||
          p === 'self' ||
          p === 'window' ||
          (process.env.NODE_ENV === 'test' && (p === 'mockTop' || p === 'mockSafariTop'))
        ) {
          descriptor.configurable = true;
          /*
           The descriptor of window.window/window.top/window.self in Safari/FF are accessor descriptors, we need to avoid adding a data descriptor while it was
           Example:
            Safari/FF: Object.getOwnPropertyDescriptor(window, 'top') -> {get: function, set: undefined, enumerable: true, configurable: false}
            Chrome: Object.getOwnPropertyDescriptor(window, 'top') -> {value: Window, writable: false, enumerable: true, configurable: false}
           */

          // 如果 descriptor 有 get 方法，将 descriptor 设置为 writable
          if (!Object.prototype.hasOwnProperty.call(descriptor, 'get')) {
            descriptor.writable = true;
          }
        }

        // freeze the descriptor to avoid being modified by zone.js
        // const rawObjectDefineProperty = Object.defineProperty;
        // fakeWindow 中放置这些属性
        rawObjectDefineProperty(fakeWindow, p, Object.freeze(descriptor!));
      }
    });

  return fakeWindow;
}


```

沙箱的实现比较繁琐，首先在初始化阶段，使用 Proxy 生成一个 window 对象的代理，将 windows 上不可改变或不可删除的属性的 configurable 设置为 true，放到代理对象中。然后重写 document.createElement，appendChild，removeChild，insertBefore 方法，改写了 style 和 script 的加载方式，以便 style 和 script 能顺利的挂载到微应用下面。

沙箱初始化完毕后，对外暴露 mount 和 unmount 方法，用于在微应用的同名生命周期中调用。mount 方法修改一些会产生副作用的全局函数，比如 window.setInterval 产生的定时任务，或者是 window.addEventListener 产生的监听，同一个微应用的这些副作用会存储在一些，这样在 unmount 阶段的时候就很容易根据应用进行清理。mount 方法也会对 script 和 style 劫持，和初始化过程基本一致，mount 方法会有一些跟别的框架相关的逻辑，比如 umi，原因是使用 umi 框架会对全局造成影响，qiankun 需要屏蔽这部分变化导致的 bug。 unmount 阶段没什么，就是对 mount 阶段副作用的清理。

## qiankun 主基座样式会影响到子基座样式吗

qiankun 才用了动态样式隔离(dynamic stylesheet)
动态样式表。当你从子应用 A 切换到子应用 B 的时候，这个时候需要把子应用的样式表 A 的样式给删除，把子应用 B 的样式表给挂载。这样就避免了子应用 A 的样式和子应用 B 的样式同时存在于这个项目中，就做到了最基本的隔离.

当主应用和子应用出现样式冲突. 我们可以采用 bem 或者 css-in-js , css module 等处理.来避免冲突.

还有一种样式隔离方案: shadow Dom
shadow Dom, 真正可以做到 css 之间完全隔离的.在 shadow Boundary 这个阴影边界阻隔下.说你在使用一些弹窗组件的时候（弹窗很多情况下都是默认添加到了 document.body ）这个时候它就跳过了阴影边界，跑到了主应用里面，样式就丢了。又比方说你子应用使用的是 React 技术栈，而 React 事件代理其实是挂在 document 上的，它也会出一些问题。
