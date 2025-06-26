#!/usr/bin/env bun

import { parseArgs } from 'util'
import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'

const execAsync = promisify(exec)

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    check: {
      type: 'boolean',
      short: 'c',
      default: false,
      description: 'Check current secrets without setting them',
    },
    interactive: {
      type: 'boolean',
      short: 'i',
      default: false,
      description: 'Interactive mode to set secrets one by one',
    },
  },
  strict: true,
  allowPositionals: false,
})

interface Secret {
  name: string
  description: string
  example?: string
  required: boolean
}

const requiredSecrets: Secret[] = [
  {
    name: 'CLOUDFLARE_API_TOKEN',
    description:
      'Cloudflare API token with Pages:Edit and Zone:Read permissions',
    example: 'abc123...',
    required: true,
  },
  {
    name: 'CLOUDFLARE_ACCOUNT_ID',
    description: 'Your Cloudflare account ID',
    example: 'f1234567890abcdef1234567890abcdef',
    required: true,
  },
  {
    name: 'CLOUDFLARE_PROJECT_NAME',
    description: 'Your Cloudflare Pages project name',
    example: 'haas-blog',
    required: true,
  },
  {
    name: 'CLOUDFLARE_ZONE_ID',
    description: 'Your domain zone ID in Cloudflare',
    example: 'z1234567890abcdef1234567890abcdef',
    required: true,
  },
  {
    name: 'VITE_RESEND_API_KEY',
    description: 'Resend API key for email subscriptions',
    example: 're_xxxx',
    required: true,
  },
  {
    name: 'VITE_EMAIL_TO',
    description: 'Email address to receive newsletter subscriptions',
    example: 'jonathan@example.com',
    required: true,
  },
  {
    name: 'VITE_EMAIL_FROM',
    description: 'Email address to send from (verified in Resend)',
    example: 'blog@yourdomain.com',
    required: true,
  },
]

// Check current secrets
async function checkSecrets(): Promise<void> {
  console.log(chalk.blue('🔍 Checking current GitHub secrets...\n'))

  try {
    const { stdout } = await execAsync('gh secret list')
    const existingSecrets = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.split('\t')[0])

    console.log(chalk.bold('Current secrets:'))
    for (const secret of requiredSecrets) {
      const exists = existingSecrets.includes(secret.name)
      const icon = exists ? '✅' : '❌'
      const status = exists ? chalk.green('Set') : chalk.red('Missing')

      console.log(`${icon} ${secret.name}: ${status}`)
      if (!exists && secret.required) {
        console.log(chalk.gray(`   📝 ${secret.description}`))
        if (secret.example) {
          console.log(chalk.gray(`   💡 Example: ${secret.example}`))
        }
      }
    }

    const missingRequired = requiredSecrets.filter(
      (secret) => secret.required && !existingSecrets.includes(secret.name)
    )

    if (missingRequired.length > 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  ${missingRequired.length} required secrets are missing`
        )
      )
      console.log(chalk.gray('Run with --interactive to set them up'))
    } else {
      console.log(chalk.green('\n✅ All required secrets are configured!'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to check secrets:'), error)
    process.exit(1)
  }
}

// Set a secret
async function setSecret(name: string, value: string): Promise<boolean> {
  try {
    await execAsync(`gh secret set ${name} --body "${value}"`)
    console.log(chalk.green(`✅ Set ${name}`))
    return true
  } catch (error) {
    console.error(chalk.red(`❌ Failed to set ${name}:`), error)
    return false
  }
}

// Interactive setup
async function interactiveSetup(): Promise<void> {
  console.log(chalk.blue('🚀 Interactive GitHub secrets setup\n'))
  console.log(chalk.yellow('Tip: Press Ctrl+C to skip any secret\n'))

  for (const secret of requiredSecrets) {
    console.log(chalk.bold(`\n📝 ${secret.name}`))
    console.log(chalk.gray(`Description: ${secret.description}`))
    if (secret.example) {
      console.log(chalk.gray(`Example: ${secret.example}`))
    }

    try {
      // Check if secret already exists
      const { stdout } = await execAsync(
        `gh secret list | grep "^${secret.name}\\s" || echo ""`
      )
      if (stdout.trim()) {
        console.log(chalk.yellow('Secret already exists. Overwrite? (y/N)'))
        const input = prompt('')
        if (input?.toLowerCase() !== 'y' && input?.toLowerCase() !== 'yes') {
          console.log(chalk.gray('Skipped.'))
          continue
        }
      }

      const value = prompt(`Enter value for ${secret.name}: `)
      if (!value || value.trim() === '') {
        console.log(chalk.yellow('Skipped (empty value)'))
        continue
      }

      await setSecret(secret.name, value.trim())
    } catch (error) {
      console.error(chalk.red(`Error setting ${secret.name}:`), error)
    }
  }

  console.log(chalk.green('\n✅ Interactive setup complete!'))
  console.log(chalk.gray('Run with --check to verify all secrets are set'))
}

// Test GitHub Actions
async function testActions(): Promise<void> {
  console.log(chalk.blue('\n🧪 Testing GitHub Actions setup...\n'))

  try {
    // Check if workflows directory exists
    const workflowFiles = [
      '.github/workflows/deploy-preview.yml',
      '.github/workflows/deploy-production.yml',
      '.github/workflows/quality-checks.yml',
      '.github/workflows/cleanup-previews.yml',
    ]

    console.log(chalk.bold('Workflow files:'))
    for (const file of workflowFiles) {
      try {
        await execAsync(`test -f ${file}`)
        console.log(chalk.green(`✅ ${file}`))
      } catch {
        console.log(chalk.red(`❌ ${file} (missing)`))
      }
    }

    // Check recent workflow runs
    console.log(chalk.bold('\nRecent workflow runs:'))
    const { stdout } = await execAsync('gh run list --limit 5')
    console.log(stdout || chalk.gray('No recent runs found'))
  } catch (error) {
    console.error(chalk.red('❌ Failed to check GitHub Actions:'), error)
  }
}

// Main function
async function main() {
  if (values.check) {
    await checkSecrets()
    await testActions()
  } else if (values.interactive) {
    await interactiveSetup()
  } else {
    console.log(chalk.blue('GitHub Secrets Setup Tool\n'))
    console.log('Usage:')
    console.log('  --check, -c      Check current secrets')
    console.log('  --interactive, -i Interactive setup')
    console.log('\nExamples:')
    console.log('  bun run scripts/setup-secrets.ts --check')
    console.log('  bun run scripts/setup-secrets.ts --interactive')

    // Show quick status
    await checkSecrets()
  }
}

// Run the script
main().catch(console.error)
