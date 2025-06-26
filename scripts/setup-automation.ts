#!/usr/bin/env bun

/**
 * Setup script for automated blog generation
 * This script guides you through the setup process
 */

import chalk from 'chalk'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

class AutomationSetup {
  async run(): Promise<void> {
    console.log(chalk.bold.blue('🚀 Setting Up Automated Blog Generation\n'))

    // Step 1: Check prerequisites
    await this.checkPrerequisites()

    // Step 2: Test the pipeline
    await this.testPipeline()

    // Step 3: Setup instructions
    await this.showSetupInstructions()

    console.log(
      chalk.green('\n🎉 Setup complete! Your blog automation is ready to go.\n')
    )
  }

  private async checkPrerequisites(): Promise<void> {
    console.log(chalk.yellow('🔧 Checking prerequisites...\n'))

    // Check if API key is set
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log(chalk.red('❌ GOOGLE_AI_API_KEY not found in environment'))
      console.log(chalk.yellow('   Please add it to your .env file:\n'))
      console.log(chalk.gray('   GOOGLE_AI_API_KEY=your_api_key_here\n'))
      process.exit(1)
    }
    console.log(chalk.green('✅ Google AI API key found'))

    // Check git repository
    try {
      await execAsync('git status')
      console.log(chalk.green('✅ Git repository detected'))
    } catch {
      console.log(chalk.red('❌ Not in a Git repository'))
      process.exit(1)
    }

    // Check GitHub CLI (optional but recommended)
    try {
      await execAsync('gh --version')
      console.log(chalk.green('✅ GitHub CLI available'))
    } catch {
      console.log(
        chalk.yellow('⚠️  GitHub CLI not found (optional but recommended)')
      )
      console.log(chalk.gray('   Install with: brew install gh\n'))
    }

    console.log()
  }

  private async testPipeline(): Promise<void> {
    console.log(chalk.yellow('🧪 Testing automation pipeline...\n'))

    try {
      const { stdout } = await execAsync('bun scripts/test-auto-blog.ts -d')
      console.log(stdout)

      if (stdout.includes('✅ PASS')) {
        console.log(chalk.green('✅ Pipeline test passed!'))
      } else {
        console.log(chalk.red('❌ Pipeline test failed'))
        console.log(
          chalk.yellow('   Please fix the issues above before continuing')
        )
        process.exit(1)
      }
    } catch (error) {
      console.log(chalk.red('❌ Pipeline test failed:'), error)
      process.exit(1)
    }
  }

  private async showSetupInstructions(): Promise<void> {
    console.log(chalk.bold.blue('\n📋 Final Setup Steps\n'))

    console.log(chalk.yellow('1. Add GitHub Secret:'))
    console.log(chalk.gray('   Go to your repository settings:'))
    console.log(
      chalk.gray(
        '   Settings > Secrets and variables > Actions > New repository secret'
      )
    )
    console.log(chalk.gray('   Name: GOOGLE_AI_API_KEY'))
    console.log(chalk.gray('   Value: [your Google AI API key]'))
    console.log()

    console.log(chalk.yellow('2. Enable the Workflow:'))
    console.log(chalk.gray('   The workflow is already created at:'))
    console.log(chalk.gray('   .github/workflows/auto-blog-generation.yml'))
    console.log(
      chalk.gray(
        '   It will run automatically on Tuesdays and Fridays at 9 AM PST'
      )
    )
    console.log()

    console.log(chalk.yellow('3. Test Manual Run:'))
    console.log(
      chalk.gray(
        '   Go to Actions tab > Automated Blog Generation > Run workflow'
      )
    )
    console.log(
      chalk.gray(
        '   Leave topic blank for auto-generation, or specify a custom topic'
      )
    )
    console.log()

    console.log(chalk.yellow('4. Monitor Results:'))
    console.log(chalk.gray('   - Check the Actions tab for workflow runs'))
    console.log(chalk.gray('   - Review auto-generated posts in src/posts/'))
    console.log(
      chalk.gray(
        '   - 70% will auto-publish, 30% will stay as drafts for review'
      )
    )
    console.log()

    console.log(chalk.bold.green('🎯 Automation Schedule:'))
    console.log(chalk.gray('   • Tuesdays at 9:00 AM PST (17:00 UTC)'))
    console.log(chalk.gray('   • Fridays at 9:00 AM PST (17:00 UTC)'))
    console.log(
      chalk.gray('   • Manual runs available anytime via GitHub Actions UI')
    )
    console.log()

    console.log(chalk.bold.cyan('📚 Documentation:'))
    console.log(chalk.gray('   • Full guide: docs/AUTOMATED_BLOGGING.md'))
    console.log(chalk.gray('   • Test locally: bun scripts/test-auto-blog.ts'))
    console.log(chalk.gray('   • Generate ideas: bun run ideas -n 10 -f json'))
  }
}

const setup = new AutomationSetup()
await setup.run()
