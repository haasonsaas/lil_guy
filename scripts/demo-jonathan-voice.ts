#!/usr/bin/env bun

import chalk from 'chalk'

async function demoJonathanVoice() {
  console.log(chalk.blue('🧠 Jonathan Voice Engine Demo\n'))

  console.log(chalk.cyan('🎯 What is the Jonathan Voice Engine?\n'))
  console.log(
    chalk.white(
      "An AI system that replicates Jonathan Haas's authentic voice, perspectives, and expertise."
    )
  )
  console.log(
    chalk.white(
      'Trained on comprehensive analysis of his blog corpus, frameworks, and thought patterns.\n'
    )
  )

  console.log(chalk.cyan('🚀 Available Commands:\n'))

  console.log(chalk.yellow('Basic Voice Generation:'))
  console.log('  bun run jonathan-voice respond "Your question here"')
  console.log('  bun run jonathan-voice test')
  console.log('  bun run jonathan-voice stats\n')

  console.log(chalk.yellow('Example Questions to Try:'))
  console.log('  "What\'s your take on startup equity compensation?"')
  console.log('  "How should startups approach AI integration?"')
  console.log('  "What\'s wrong with most startup advice?"')
  console.log('  "How should technical founders handle customer development?"')
  console.log('  "What are the biggest mistakes in product management?"')
  console.log('  "How do you evaluate AI vendors?"')
  console.log('  "What\'s your framework for technical hiring?"\n')

  console.log(chalk.green('✅ Jonathan Voice Characteristics Captured:\n'))
  console.log('  📝 Writing Style:')
  console.log('    • Direct, confident communication')
  console.log('    • Short paragraphs (2-4 sentences)')
  console.log('    • Heavy use of contractions')
  console.log(
    '    • Signature phrases ("Here\'s the thing...", "Here\'s what I\'ve learned...")'
  )
  console.log('    • Rhetorical questions for transitions')
  console.log('    • No hedge words\n')

  console.log('  🎯 Core Perspectives:')
  console.log('    • Startup equity system is fundamentally broken')
  console.log('    • Context matters more than best practices')
  console.log('    • Speed of learning > speed of building')
  console.log("    • AI amplifies humans, doesn't replace them")
  console.log('    • Most startup advice is context-dependent and often wrong')
  console.log('    • Technical founders avoid customer conversations\n')

  console.log('  🧠 Expertise Areas:')
  console.log('    • Technical leadership (security background)')
  console.log('    • Startup operations (ThreatKey, Carta experience)')
  console.log('    • AI integration (practical implementation)')
  console.log('    • Founder psychology and organizational dynamics')
  console.log('    • Product-engineering collaboration\n')

  console.log('  🔧 Frameworks Available:')
  console.log('    • The Startup Bargain Framework (equity analysis)')
  console.log('    • Strategic Quality Framework (technical debt management)')
  console.log('    • Practical AI Integration Framework')
  console.log('    • Founder Psychology Framework\n')

  console.log(chalk.magenta('🎪 Live Demo Examples:\n'))

  console.log(chalk.blue('Example 1: Startup Equity Question'))
  console.log(chalk.gray('Question: "Should I take equity or higher salary?"'))
  console.log(
    chalk.white(
      "Jonathan's approach: Challenges equity mythology, references ThreatKey experience,"
    )
  )
  console.log(
    chalk.white(
      'provides specific alternatives like profit sharing and transparent compensation.\n'
    )
  )

  console.log(chalk.blue('Example 2: AI Integration Question'))
  console.log(chalk.gray('Question: "How do we add AI to our product?"'))
  console.log(
    chalk.white(
      "Jonathan's approach: Focus on human workflow first, AI as amplification,"
    )
  )
  console.log(
    chalk.white('implementation quality over model sophistication.\n')
  )

  console.log(chalk.blue('Example 3: Founder Advice Question'))
  console.log(chalk.gray('Question: "What startup advice is most important?"'))
  console.log(
    chalk.white(
      "Jonathan's approach: Contrarian take on generic advice, emphasizes context,"
    )
  )
  console.log(
    chalk.white('provides framework-based thinking over pattern matching.\n')
  )

  console.log(chalk.cyan('🔬 Technical Implementation:\n'))
  console.log('  • Voice profile with 90+ specific characteristics')
  console.log('  • Perspective mapping across 6 core topic domains')
  console.log('  • Authenticity validation with 15+ criteria')
  console.log('  • Response strategy selection based on question analysis')
  console.log('  • Framework integration from blog corpus analysis')
  console.log('  • Real-time confidence scoring\n')

  console.log(chalk.green('🚀 Try it now:'))
  console.log(
    chalk.white(
      '  bun run jonathan-voice respond "What\'s your take on startup equity?"'
    )
  )
  console.log(
    chalk.gray(
      '  (Watch for signature phrases, contrarian perspectives, and ThreatKey references!)\n'
    )
  )

  console.log(chalk.blue('💡 Use Cases:'))
  console.log("  • Scale Jonathan's advisory capacity")
  console.log('  • Generate expert responses while traveling/unavailable')
  console.log("  • Create content in Jonathan's voice")
  console.log('  • Training material for consistent messaging')
  console.log('  • Expert consultation automation')
}

if (import.meta.main) {
  demoJonathanVoice()
}
