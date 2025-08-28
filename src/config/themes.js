// 魔方主题配置
export const themes = {
  // 经典主题 - 标准魔方颜色
  classic: {
    name: '经典',
    colors: {
      U: 0xffff00, // 黄色 - 上
      D: 0xffffff, // 白色 - 下
      F: 0xff0000, // 红色 - 前
      B: 0xff8c00, // 橙色 - 后
      L: 0x00ff00, // 绿色 - 左
      R: 0x0000ff  // 蓝色 - 右
    },
    background: '#FFB1A4', // 中灰色背景，突出魔方颜色
    blob:  "#46717dab"// 中灰色blob，与背景形成层次'#023F92'
  },
  
  // 炫酷蓝主题 - 六种色阶蓝色
  coolBlue: {
    name: '炫酷蓝',
    colors: {
      U: 0x000066, // 深蓝色 - 上（最深）
      D: 0x87CEEB, // 天蓝色 - 下（最浅）
      F: 0x0066CC, // 中蓝色 - 前
      B: 0x8A2BE2, // 紫罗兰色 - 后（更偏紫，与蓝色区别明显）
      L: 0x1E90FF, // 道奇蓝 - 左
      R: 0x00BFFF  // 深天蓝 - 右
    },
    background: '#789ac7', // 深蓝灰色背景，营造深邃科技感
    blob: '#1a1a5a' // 深蓝灰色blob，更偏蓝色，与背景形成渐变
  },
  
  // 闪亮橙主题 - 真正闪亮的橙色#E8C013 #F28116
  warmOrange: {
    name: '闪亮橙',
    colors: {
      U: 0xBE0A00, // 橙红色 - 上（最深的闪亮橙）
      D: 0xFFEB99, // 浅黄色 - 下（最浅，接近白色但带暖调）
      F: 0xFF4500, // 深橙色 - 前（经典闪亮橙）
      B: 0xFF5349, // 番茄红 - 后（红橙，与橙色形成对比）
      L: 0xFFA500, // 标准橙色 - 左（最经典的闪亮橙）
      R: 0xFFE013  // 金黄色 - 右（明亮的金色，接近橙色）
    },
    background: '#d57474', // 中米色背景，突出暖色调
    blob: '#ca2e2ee6' 
  },
  
  // 森林渐变主题 - 清新绿色渐变
  forest: {
    name: '森林绿',
    colors: {
      U: 0x006400, // 深绿色 - 上（深林树冠）
      D: 0xB8F5B8, // 极淡绿色 - 下（嫩草，更淡更清新）
      F: 0x00FF7F, // 春绿色 - 前（新芽）
      B: 0x228B22, // 森林绿 - 后（中等深度）
      L: 0x7FFF00, // 酸橙绿 - 左（明亮新叶） 
      R: 0x32CD32  // 酸橙绿 - 右（清新绿叶）
    },
    background: '#a0c0a0', // 深绿灰色背景，营造深邃森林氛围
    blob: '#1a3a1acf' // 深绿灰色blob，与背景形成自然层次
  },
}

// 获取主题颜色
export function getThemeColors(themeName = 'classic') {
  return themes[themeName]?.colors || themes.classic.colors
}

// 获取所有可用主题
export function getAvailableThemes() {
  return Object.keys(themes).map(key => ({
    key,
    ...themes[key]
  }))
}

// 默认主题
export const defaultTheme = 'classic'
