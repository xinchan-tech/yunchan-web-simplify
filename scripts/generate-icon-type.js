const fs = require('node:fs')
const path = require('node:path')

const iconRoot = path.resolve(__dirname, '../src/assets/icon')
const outputPath = path.resolve(__dirname, '../types/icon.d.ts')

const r = []
// 递归遍历文件夹
const walk = (dir) => {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const filePath = path.join(dir, f)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      walk(filePath)
    } else {
      const ext = path.extname(filePath)
      r.push(f.replace(ext, ''))
    }
  }
}

const writeTypes = () => {
  const content = `
  export type IconName = ${r.map(i => `'${i}'`).join(' | ')}
  `
  fs.writeFileSync(outputPath, content)
}

;(() => {
  walk(iconRoot)
  writeTypes()
})()