import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 确保资源路径正确，特别是部署到GitHub Pages时
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist', // 构建输出目录
    assetsDir: 'assets', // 静态资源输出子目录
    rollupOptions: {
      input: {
        main: './src/main.js' // 入口文件
      }
    }
  },
  publicDir: 'public', // 静态资源目录
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg', '**/*.wav', '**/*.mp3'] // 确保这些类型的文件被视为资源
});