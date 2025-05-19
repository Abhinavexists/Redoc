import { FileText, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">Document Research & Theme Identification</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">Intelligent Document Analysis</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
