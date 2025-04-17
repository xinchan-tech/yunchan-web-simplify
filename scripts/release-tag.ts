import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { RsbuildPlugin } from '@rsbuild/core'
import dayjs from 'dayjs'
import packageJson from '../package.json'
const c = require('ansi-colors')

export type ReleaseTagOptions = {
  outFile?: boolean
}

export const pluginReleaseTag = (options: ReleaseTagOptions): RsbuildPlugin => ({
  name: 'plugin-release-tag',
  setup(api) {
    let version = 'development'

    if (process.env.NODE_ENV === 'production') {
      const gitVersion = execSync('git rev-parse --short HEAD').toString().trim()
      const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
      const date = dayjs().format('YYYYMMDDHHmmss')
      const gitAuthor = execSync('git log -1 --pretty=format:"%an"').toString().trim()
      version = `${gitBranch}.${gitVersion}.${gitAuthor}.${date}`
    }

    api.modifyRsbuildConfig(config => {
      if (!config.source) {
        config.source = {}
      }

      if (!config.source.define) {
        config.source.define = {}
      }

      config.source.define.__RELEASE_TAG__ = JSON.stringify(version)
      config.source.define.__RELEASE_VERSION__ = JSON.stringify(packageJson.version)
    })

    api.onAfterBuild(() => {
      if (options.outFile) {
        fs.writeFileSync(
          path.resolve(__dirname, '../dist/release-tag.json'),
          JSON.stringify(
            {
              version,
              packageVersion: packageJson.version,
              branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
            },
            null,
            2
          )
        )

        console.log(c.green(`Release tag file generated: dist/release-tag.json from ${version}`))
      }
    })
  }
})
