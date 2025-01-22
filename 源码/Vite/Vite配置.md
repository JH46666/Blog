环境变量配置

使用 loadEnv 加载不同环境的配置文件（.env.development/.env.production）
通过 import.meta.env 在代码中访问环境变量
以 VITE\_ 开头的变量会暴露给客户端代码
路径别名

配置 @ 指向 src 目录，方便导入模块
使用 path.resolve 确保路径正确解析
开发服务器配置

配置端口、自动打开浏览器
设置 CORS 和代理，处理跨域请求
代理配置可以将 API 请求转发到后端服务器
构建优化

build.minify: 使用 terser 进行代码压缩
build.rollupOptions: 配置代码分割
manualChunks: 将第三方库代码分离到 vendor 包中
CSS 配置

支持 CSS Modules
配置预处理器选项（如 Less）
依赖优化

optimizeDeps.include: 预构建依赖
optimizeDeps.exclude: 排除不需要预构建的依赖
插件系统

使用 @vitejs/plugin-react 支持 React
启用 Fast Refresh 实现快速热更新
这些配置涵盖了 Vite 的主要特性，对于面试来说是很好的知识点。我已经创建了一个示例页面来展示这些特性，你可以在浏览器中查看效果。
