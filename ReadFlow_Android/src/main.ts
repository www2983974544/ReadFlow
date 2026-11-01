import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installNativeTtsShim } from './native/tts-shim'
import './style.css'

// 必须在应用代码执行前安装：安卓 WebView 无可用 speechSynthesis，
// shim 把 Web Speech API 路由到原生 TTS（浏览器环境自动跳过）。
installNativeTtsShim()

createApp(App).use(createPinia()).mount('#app')
