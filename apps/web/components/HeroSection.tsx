import ThemeToggle from './ThemeToggle';

export default function HeroSection() {
  return (
    <header className="text-center mb-8 relative">
      {/* Theme Toggle in top right */}
      <div className="absolute top-0 right-0">
        <ThemeToggle />
      </div>
      
      <h1 className="text-5xl font-bold text-blue-900 dark:text-blue-400 mb-4 animate-fade-in-up flex items-center justify-center gap-3">
        <img src="/icon.png" alt="AI Lighthouse" className="w-12 h-12" />
        AI Lighthouse
      </h1>
      
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        Analyze how AI systems understand your website.
      </p>
    </header>
  );
}
