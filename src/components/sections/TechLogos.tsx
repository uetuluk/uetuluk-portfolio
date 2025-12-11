import { useState } from 'react';
import { cn } from '@/lib/utils';
import portfolioContent from '@/content/portfolio.json';

interface TechLogosProps {
  title: string;
  technologies?: string[];
  style?: 'grid' | 'marquee';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Map technology names to Simple Icons slug
// https://simpleicons.org/
const techIconMap: Record<string, string> = {
  // Languages
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  SQL: 'postgresql',
  Go: 'go',
  Rust: 'rust',
  Java: 'openjdk',

  // Frontend
  React: 'react',
  Vue: 'vuedotjs',
  Angular: 'angular',
  Svelte: 'svelte',
  'Next.js': 'nextdotjs',
  Tailwind: 'tailwindcss',
  'Tailwind CSS': 'tailwindcss',

  // Backend
  NestJS: 'nestjs',
  Express: 'express',
  FastAPI: 'fastapi',
  Django: 'django',
  Flask: 'flask',
  Node: 'nodedotjs',
  'Node.js': 'nodedotjs',

  // Databases
  PostgreSQL: 'postgresql',
  MySQL: 'mysql',
  MongoDB: 'mongodb',
  Redis: 'redis',
  SQLite: 'sqlite',

  // DevOps & Cloud
  Docker: 'docker',
  Kubernetes: 'kubernetes',
  Terraform: 'terraform',
  AWS: 'amazonaws',
  GCP: 'googlecloud',
  Azure: 'microsoftazure',
  Cloudflare: 'cloudflare',

  // AI/ML
  LangChain: 'langchain',
  OpenAI: 'openai',
  PyTorch: 'pytorch',
  TensorFlow: 'tensorflow',
  'Hugging Face': 'huggingface',

  // Tools
  Git: 'git',
  GitHub: 'github',
  GitLab: 'gitlab',
  VSCode: 'visualstudiocode',
  'VS Code': 'visualstudiocode',
  Figma: 'figma',

  // Desktop/Mobile
  Electron: 'electron',
  'React Native': 'react',
  Flutter: 'flutter',

  // Misc
  RAG: 'openai', // Using OpenAI as proxy for RAG
  'Vector Databases': 'pinecone',
  'Real-time Processing': 'apachekafka',
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const containerSizeClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

function TechLogo({ tech, size }: { tech: string; size: 'sm' | 'md' | 'lg' }) {
  const [hasError, setHasError] = useState(false);
  const iconSlug = techIconMap[tech];

  // If no mapping or error loading, show text badge
  if (!iconSlug || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted',
          containerSizeClasses[size],
        )}
        title={tech}
      >
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[60px]">
          {tech}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-card border transition-all hover:shadow-md hover:scale-105',
        containerSizeClasses[size],
      )}
      title={tech}
    >
      <img
        src={`https://cdn.simpleicons.org/${iconSlug}`}
        alt={tech}
        className={cn(sizeClasses[size], 'dark:invert dark:opacity-80')}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}

export function TechLogos({
  title,
  technologies = portfolioContent.skills,
  style = 'grid',
  size = 'md',
  className,
}: TechLogosProps) {
  if (style === 'marquee') {
    return (
      <section className={cn('py-8 overflow-hidden', className)}>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>

        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

          {/* Marquee container */}
          <div className="flex animate-marquee">
            {/* First set */}
            <div className="flex gap-4 shrink-0">
              {technologies.map((tech, index) => (
                <TechLogo key={`${tech}-${index}`} tech={tech} size={size} />
              ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div className="flex gap-4 shrink-0 ml-4">
              {technologies.map((tech, index) => (
                <TechLogo key={`${tech}-dup-${index}`} tech={tech} size={size} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Grid style (default)
  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="flex flex-wrap gap-4">
        {technologies.map((tech, index) => (
          <TechLogo key={`${tech}-${index}`} tech={tech} size={size} />
        ))}
      </div>
    </section>
  );
}
