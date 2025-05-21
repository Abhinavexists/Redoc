import React, { useState, useMemo } from 'react';
import { LightbulbIcon, BookmarkIcon, BarChart3, Maximize2, List, Search, FilterIcon, RefreshCw, LinkIcon } from 'lucide-react';
import type { Theme } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import ThemeCitationVisualizer from './ThemeCitationVisualizer';

interface ThemeDisplayProps {
  themes: Theme[];
  onDocumentView?: (documentId: number) => void;
}

const BATCH_SIZE = 5;

const ThemeDisplay: React.FC<ThemeDisplayProps> = ({ themes, onDocumentView }) => {
  const [activeView, setActiveView] = useState<'list' | 'chart'>('list');
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocName, setFilterDocName] = useState('');
  const [visibleThemes, setVisibleThemes] = useState(BATCH_SIZE);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);

  const themeColors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', light: 'bg-blue-50' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', light: 'bg-green-50' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', light: 'bg-purple-50' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', light: 'bg-amber-50' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', light: 'bg-red-50' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', light: 'bg-indigo-50' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', light: 'bg-pink-50' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', light: 'bg-cyan-50' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', light: 'bg-emerald-50' },
  ];

  if (!themes || themes.length === 0) {
    return null;
  }

  const filteredThemes = useMemo(() => {
    return themes.filter(theme => {
      const matchesSearch = !searchTerm || 
        theme.theme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDocFilter = !filterDocName || 
        theme.supporting_documents.some(doc => 
          doc.toLowerCase().includes(filterDocName.toLowerCase())
        );
      
      return matchesSearch && matchesDocFilter;
    });
  }, [themes, searchTerm, filterDocName]);

  const themesToDisplay = filteredThemes.slice(0, visibleThemes);
  
  const getThemeColor = (index: number) => {
    return themeColors[index % themeColors.length];
  };

  const allDocuments = useMemo(() => {
    return Array.from(
      new Set(themes.flatMap(theme => theme.supporting_documents))
    ).sort();
  }, [themes]);

  const toggleThemeExpansion = (themeId: number) => {
    setExpandedTheme(expandedTheme === themeId ? null : themeId);
  };

  const handleLoadMore = () => {
    setVisibleThemes(prev => prev + BATCH_SIZE);
  };

  const toggleThemeCitations = (themeId: number) => {
    setSelectedTheme(selectedTheme === themeId ? null : themeId);
  };

  const getSelectedTheme = () => {
    if (!selectedTheme) return null;
    return themes.find(theme => theme.id === selectedTheme);
  };

  const hasMoreThemesToLoad = filteredThemes.length > visibleThemes;

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5" />
              Identified Themes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={activeView === 'list' ? 'bg-muted' : ''}
                onClick={() => setActiveView('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={activeView === 'chart' ? 'bg-muted' : ''}
                onClick={() => setActiveView('chart')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Chart
              </Button>
            </div>
          </div>
          
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <FilterIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by document..."
                value={filterDocName}
                onChange={(e) => setFilterDocName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {filteredThemes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No themes match your search criteria</p>
          </div>
        ) : activeView === 'list' ? (
          // List View
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {themesToDisplay.map((theme, index) => {
                const themeColor = getThemeColor(index);
                const isExpanded = expandedTheme === theme.id;
                  const isCitationsSelected = selectedTheme === theme.id;
                
                return (
                  <div key={theme.id} className={`p-4 rounded-md border ${themeColor.border} ${themeColor.light}`}>
                    <div className="space-y-4">
                      <div>
                        <h3 className={`text-lg font-semibold flex items-center gap-2 ${themeColor.text}`}>
                          <BookmarkIcon className="h-4 w-4" />
                          Theme {theme.id}: {theme.theme_name}
                        </h3>
                        
                        <p className="mt-2 text-sm">
                          {theme.summary}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                          <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          Supporting Documents:
                        </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleThemeCitations(theme.id)}
                              className={`h-7 text-xs ${isCitationsSelected ? themeColor.bg : ''}`}
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {isCitationsSelected ? 'Hide Citations' : 'View Citations'}
                            </Button>
                          </div>
                        <div className="flex flex-wrap gap-1.5">
                          {theme.supporting_documents.map((doc, idx) => (
                            <Badge key={idx} variant="outline" className={`${themeColor.bg} ${themeColor.text}`}>
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            Evidence:
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleThemeExpansion(theme.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className={`rounded-md border ${themeColor.border} bg-white p-3 text-sm ${isExpanded ? '' : 'max-h-[100px] overflow-hidden'}`}>
                          {theme.evidence}
                        </div>
                        {!isExpanded && theme.evidence.length > 300 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleThemeExpansion(theme.id)}
                            className="w-full text-xs text-muted-foreground"
                          >
                            Show more
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMoreThemesToLoad && (
                <div className="flex justify-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={handleLoadMore}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load More Themes
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          // Chart View
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <ScrollArea className="max-h-[60vh]">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      <th className="bg-muted/50 text-left p-2 border">Document / Theme</th>
                      {filteredThemes.map((theme, index) => (
                        <th key={theme.id} className={`text-center p-2 border ${getThemeColor(index).bg} ${getThemeColor(index).text}`}>
                          <div className="truncate max-w-[100px]" title={theme.theme_name}>
                            {theme.theme_name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allDocuments.map((doc, docIndex) => (
                      <tr key={docIndex} className={docIndex % 2 === 0 ? "bg-muted/20" : ""}>
                        <td className="p-2 border font-medium truncate max-w-[200px]" title={doc}>{doc}</td>
                        {filteredThemes.map((theme, themeIndex) => {
                          const supports = theme.supporting_documents.includes(doc);
                          const themeColor = getThemeColor(themeIndex);
                          return (
                            <td key={themeIndex} className="text-center p-2 border">
                              {supports && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    className="w-4 h-4 p-0 rounded-full mx-auto"
                                    onClick={() => toggleThemeCitations(theme.id)}
                                  >
                                    <div className={`w-4 h-4 rounded-full ${themeColor.bg}`} />
                                  </Button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-md border">
              <h4 className="text-sm font-medium mb-3">Theme Summary</h4>
              <div className="space-y-3">
                {filteredThemes.slice(0, visibleThemes).map((theme, index) => {
                  const themeColor = getThemeColor(index);
                  return (
                    <div key={theme.id} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full mt-1 ${themeColor.bg}`} />
                      <div>
                        <div className={`font-medium ${themeColor.text}`}>{theme.theme_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{theme.summary}</div>
                      </div>
                    </div>
                  );
                })}

                {hasMoreThemesToLoad && (
                  <Button 
                    variant="outline"
                    onClick={handleLoadMore}
                    className="w-full mt-2"
                    size="sm"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Load More Themes
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground pt-2">
        {filteredThemes.length} of {themes.length} themes displayed across {allDocuments.length} documents
      </CardFooter>
    </Card>
      
      {/* Theme Citation Visualizer */}
      {selectedTheme && (
        <div className="mt-4">
          {getSelectedTheme() && (
            <ThemeCitationVisualizer
              themeId={selectedTheme}
              themeName={getSelectedTheme()?.theme_name || ''}
              themeColor={getThemeColor(themes.findIndex(t => t.id === selectedTheme))}
              onDocumentView={onDocumentView}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeDisplay;
