import { motion } from 'framer-motion'
import { Subscribe } from './Subscribe'

export default function WeeklyPlaybook() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="max-w-2xl mx-auto p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex flex-col items-center text-center">
        <h3 className="text-xl md:text-2xl font-bold mb-2">
          Get the Weekly Playbook
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
          One tactical post per week on scaling SaaS with AI — zero fluff, all
          signal
        </p>
        <Subscribe />
        <p className="text-xs md:text-sm text-muted-foreground mt-4">
          Join SaaS builders and founders building the future
        </p>
      </div>
    </motion.div>
  )
}
