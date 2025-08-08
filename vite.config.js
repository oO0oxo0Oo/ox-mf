import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import  AutoImport  from "unplugin-auto-import/vite"

import {fileURLToPath} from "node:url"

// https://vite.dev/config/
export default defineConfig({
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
  }
})
