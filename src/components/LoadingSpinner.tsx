import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  inline?: boolean;
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false, inline = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // For inline use (like in buttons), just show spinning icon
  if (inline || (!text && !fullScreen)) {
    return (
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Trophy className={`${sizeClasses[size]} ${inline ? 'text-current' : 'text-primary'}`} />
      </motion.div>
    );
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Trophy */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Trophy className={`${sizeClasses[size]} text-primary`} />
        </motion.div>
      </motion.div>

      {/* Animated Dots */}
      {text && (
        <div className={`flex items-center gap-2 ${textSizeClasses[size]} text-muted-foreground`}>
          <span>{text}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-primary rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
}