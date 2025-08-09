import React from 'react';
import { FileText, Search, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Header: React.FC = () => {
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains('dark');
    root.classList.toggle('dark');
    setIsDark(nextIsDark);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Redoc</span>
        </div>

        {/* Minimalist navbar: removed extra nav buttons */}

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 w-44 md:w-64 lg:w-80"
              placeholder="Search documents"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
