import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import  AutoImport  from "unplugin-auto-import/vite"

import {fileURLToPath} from "node:url"

// https://vite.dev/config/
export default defineConfig({
  base: '/ox-mf/', // 替换为你的实际仓库名
  plugins: [
    vue(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
      ],
      eslintrc:{
        enabled:true,
      }
    })
  ],
  resolve:{
    alias:{
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分块策略
        manualChunks: {
          // 将Vue相关库单独打包
          'vue-vendor': ['vue', 'pinia'],
          // 将Three.js相关库单独打包
          'three-vendor': ['three'],
          // 将Element Plus单独打包
          'element-vendor': ['element-plus', '@element-plus/icons-vue']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（生产环境建议关闭）
    sourcemap: false,
    // 设置输出目录
    outDir: 'dist',
    // 设置静态资源目录
    assetsDir: 'assets',
    // 启用gzip压缩
    reportCompressedSize: true
  }
})
