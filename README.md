# selenium-driver
基于 selenium 框架封装的 copha 驱动模块

# Test
```
npm test
```

# Notice
1. `browser-driver` 用来提供 chrome，firefox 驱动管理

# 去除检测标识
- User-agent
- options excludeSwitches "enable-automation"
- options useAutomationExtension false
- argument --disable-blink-features=AutomationControlled
- set navigator.webdriver = undefined
- navigator.plugins navigator.languages navigator.mimeTypes 有正常数据
- Set window.ScreenY, window.screenTop, window.outerWidth, window.outerHeight to be nonzero
- Set window.chrome == window.navigator.chrome



相关链接
- https://stackoverflow.com/questions/68289474/selenium-headless-bypassing-cloudflare-detection-in-2021
