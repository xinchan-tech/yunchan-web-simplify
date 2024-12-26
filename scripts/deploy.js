const fs = require('node:fs')
const path = require('node:path')
const {NodeSSH} = require('node-ssh')

const ssh = new NodeSSH()

const privateKeyPath = '/Users/shipeijun/.ssh/id_ed25519'

console.log(path.resolve(__dirname, '../dist'))

;(async () => {
  await ssh.connect({
    host: '18.144.135.209',
    username: 'ec2-user',
    privateKey: fs.readFileSync(privateKeyPath, 'utf8')
  })

  await ssh.putDirectory(path.resolve(__dirname, '../dist'), '/home/ec2-user/web', {
    recursive: true,
    concurrency: 10,
    tick: (localPath, remotePath, error) => {
      if (error) {
        console.log(`Error: ${error}`)
      } else {
        console.log(`Uploaded ${localPath} to ${remotePath}`)
      }
    }
  })

  ssh.dispose()
})()