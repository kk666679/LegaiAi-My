import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import GlassmorphicCard from '@/components/ui/glassmorphic-card';

export { default as GlassmorphicCard } from '@/components/ui/glassmorphic-card';

// Functional AIAnimationCard - wrapper for animations
export function AIAnimationCard({ 
  title, 
  description, 
  icon: Icon, 
  enhanced = false, 
  children 
}: any) {
  return (
    <GlassmorphicCard className="mb-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
        {Icon && <Icon className="w-8 h-8 text-purple-600 flex-shrink-0" />}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {description && <p className="text-gray-600 text-sm">{description}</p>}
          {enhanced && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            <Sparkles className="w-3 h-3" />
            AI Enhanced
          </span>}
        </div>
      </div>
      <div>
        {children}
      </div>
    </GlassmorphicCard>
  );
}

// Functional AIVisualElement
export function AIVisualElement({ 
  title, 
  description, 
  icon: Icon, 
  color = 'purple', 
  delay = 0, 
  interactive = false, 
  onHover 
}: any) {
  const colors = {
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={interactive ? { scale: 1.05, y: -4 } : {}}
      onHoverStart={onHover}
className={`group relative p-4 rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]}/10 backdrop-blur-sm border border-white/20 shadow-lg`}
    >
      {Icon && <Icon className="w-10 h-10 text-gray-900 mb-2" />}
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
      {interactive && (
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}

// Functional AIInteractiveCard - interactive glass card
export function AIInteractiveCard({ 
  title, 
  description, 
  color = 'purple', 
  aiEffect = 'scale', 
  onClick, 
  children 
}: any) {
  const effectVariants = {
    scale: { scale: [1, 1.05, 1] },
    rotate: { rotate: [0, 5, 0] },
    shake: { x: [0, -5, 5, -5, 0] },
    bounce: { y: [0, -10, 0, 5, 0] },
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl cursor-pointer bg-gradient-to-br from-${color}-500/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      animate={effectVariants[aiEffect as keyof typeof effectVariants] ?? {}}
    >
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </motion.div>
  );
}

// Keep existing functional stubs
export function AIMetricCard({ title, value, trend, change, icon: Icon, onClick }: any) {
  return (
    <GlassmorphicCard onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-blue-600" />}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {trend === 'up' && <span className="text-green-600 font-bold">↑{change}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </GlassmorphicCard>
  );
}

export function AIInsightCard({ title, description, icon: Icon, dataPoints, onClick, showAction, actionText }: any) {
  return (
    <GlassmorphicCard onClick={onClick} className="max-w-sm">
      {Icon && <Icon className="w-8 h-8 text-blue-600 mb-4" />}
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {dataPoints && (
        <div className="space-y-2 mb-4">
          {dataPoints.map((dp: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{dp.label}:</span>
              <span className="font-medium">{dp.value}</span>
            </div>
          ))}
        </div>
      )}
      {showAction && (
        <GlassmorphicCard className="w-full">{actionText}</GlassmorphicCard>
      )}
    </GlassmorphicCard>
  );
}

export function AIEventCard({ title, date, type, description, priority, showAI, delay, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay || 0 }}
      onClick={onClick}
      className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border shadow-lg cursor-pointer hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {showAI && <Brain className="w-4 h-4 text-purple-600" />}
      </div>
      <p className="text-sm text-gray-600 mb-2">{date}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      {priority && (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          priority === 'high' ? 'bg-red-100 text-red-800' :
          priority === 'critical' ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-800'
        }`}>
          {priority.toUpperCase()}
        </span>
      )}
    </motion.div>
  );
}

export function AIActionCard({ title, description, icon: Icon, showAction, actionText }: any) {
  return (
    <GlassmorphicCard>
      {Icon && <Icon className="w-6 h-6 text-green-600 mb-2" />}
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </GlassmorphicCard>
  );
}

export function AITrendBadge({ trend, value, change, label }: any) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {label} {value} {change}
    </span>
  );
}

export function AILiveBadge({ status }: any) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold animate-pulse ${
      status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}>
      ● Live
    </span>
  );
}
