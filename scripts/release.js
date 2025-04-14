const fs = require('node:fs')
const path = require('node:path')
const { NodeSSH } = require('node-ssh')
const cliProgress = require('cli-progress')
const { execSync } = require('node:child_process')
const { createRsbuild, loadConfig } = require('@rsbuild/core')
const c = require('ansi-colors')

const ssh = new NodeSSH()

const progress = new cliProgress.SingleBar(
  {
    format: `上传进度 | ${c.green('{bar}')} | {value}/{total} | {duration_formatted} | {filename}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  },
  cliProgress.Presets.shades_classic
)

const privateKeyPath = '/Users/shipeijun/.ssh/id_ed25519'
const distPath = path.resolve(__dirname, '../dist')
const remotePath = '/home/ec2-user/web'
// 遍历所有文件
const findAllFiles = dir => {
  const files = fs.readdirSync(dir)
  const result = []

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stats = fs.statSync(filePath)

    if (stats.isFile()) {
      result.push(filePath)
    } else if (stats.isDirectory()) {
      result.push(...findAllFiles(filePath))
    }
  })

  return result
}

const preCheckGitBranch = () => {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

  if (currentBranch !== 'release') {
    console.log(c.red('发布请切换到 release 分支'))
    return false
  }

  return true
}

const preCheckBuildOnBranch = () => {
  const releaseFilePath = path.resolve(__dirname, '../dist/release-tag.json')

  if (!fs.existsSync(releaseFilePath)) {
    console.log(c.red('请先执行 build 命令'))
    return false
  }

  const releaseFile = fs.readFileSync(releaseFilePath, 'utf-8')

  const releaseTag = JSON.parse(releaseFile)

  if (releaseTag.branch !== 'release') {
    console.log(c.red('非release分支构建, 请切换到 release 分支'))
    return false
  }

  const currentGitTag = execSync('git describe --tags').toString().trim()
  if( currentGitTag !== releaseTag.packageVersion) {
    console.log(c.red('当前 git tag 与 release-tag.json 中的 tag 不一致'))
    return false
  }

  return true
}


  /**
   * 上传文件
   */
  ; (async () => {

    if (!preCheckGitBranch()) {
      return
    }
    
    execSync('pnpm run build')

    if (!preCheckBuildOnBranch()) {
      return
    }

    const allFiles = findAllFiles(distPath)
    progress.start(allFiles.length - 1, 0, { filename: path.basename(distPath) })

    await ssh.connect({
      host: '18.144.135.209',
      username: 'ec2-user',
      privateKey: fs.readFileSync(privateKeyPath, 'utf8')
    })

    await ssh.putDirectory(distPath, remotePath, {
      recursive: true,
      concurrency: 10,
      tick: (localPath, _, error) => {
        if (error) {
          console.log(`Error: ${error}`)
          return
        }

        progress.increment({ filename: path.basename(localPath) })
      }
    })

    progress.stop()

    console.log(c.green('\n上传成功!\n'))

    ssh.dispose()
  })()



