import React, { useState, useEffect } from 'react';
import { Filter, X, Calendar, User, FileType, BarChart3, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { FilterOptions } from '../types';

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  documentMetadata: {
    authors: string[];
    types: string[];
    dateRange: { min: string; max: string };
  };
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilterChange,
  documentMetadata,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [relevanceRange, setRelevanceRange] = useState<[number, number]>([0, 100]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    const filters: FilterOptions = {};
    const active: string[] = [];

    if (selectedAuthors.length > 0) {
      filters.authors = selectedAuthors;
      active.push('authors');
    }

    if (selectedTypes.length > 0) {
      filters.documentTypes = selectedTypes;
      active.push('types');
    }

    if (dateRange.start || dateRange.end) {
      filters.dateRange = dateRange;
      active.push('dates');
    }

    if (relevanceRange[0] > 0 || relevanceRange[1] < 100) {
      filters.relevanceRange = {
        min: relevanceRange[0] / 100,
        max: relevanceRange[1] / 100,
      };
      active.push('relevance');
    }

    setActiveFilters(active);
    onFilterChange(filters);
  }, [selectedAuthors, selectedTypes, dateRange, relevanceRange, onFilterChange]);

  const clearFilters = () => {
    setSelectedAuthors([]);
    setSelectedTypes([]);
    setDateRange({ start: '', end: '' });
    setRelevanceRange([0, 100]);
  };

  const toggleAuthor = (author: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(author)
        ? prev.filter((a) => a !== author)
        : [...prev, author]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const removeFilter = (type: string) => {
    switch (type) {
      case 'authors':
        setSelectedAuthors([]);
        break;
      case 'types':
        setSelectedTypes([]);
        break;
      case 'dates':
        setDateRange({ start: '', end: '' });
        break;
      case 'relevance':
        setRelevanceRange([0, 100]);
        break;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Advanced Filters
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-4 py-3 border-b">
                <CardTitle className="text-sm font-medium">Filter Results</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3 space-y-4">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Label className="text-xs font-medium">Date Range</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground" htmlFor="date-from">
                        From
                      </Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="h-8 text-xs"
                        min={documentMetadata.dateRange.min}
                        max={documentMetadata.dateRange.max}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground" htmlFor="date-to">
                        To
                      </Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="h-8 text-xs"
                        min={documentMetadata.dateRange.min}
                        max={documentMetadata.dateRange.max}
                      />
                    </div>
                  </div>
                </div>

                {/* Author Filter */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Label className="text-xs font-medium">Authors</Label>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {documentMetadata.authors.map((author) => (
                      <div key={author} className="flex items-center space-x-2">
                        <Checkbox
                          id={`author-${author}`}
                          checked={selectedAuthors.includes(author)}
                          onCheckedChange={() => toggleAuthor(author)}
                        />
                        <Label
                          htmlFor={`author-${author}`}
                          className="text-xs cursor-pointer"
                        >
                          {author}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Type Filter */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Label className="text-xs font-medium">Document Types</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {documentMetadata.types.map((type) => (
                      <Badge
                        key={type}
                        variant={selectedTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Relevance Score Filter */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Label className="text-xs font-medium">Relevance Score</Label>
                  </div>
                  <Slider
                    value={relevanceRange}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setRelevanceRange(value as [number, number])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{relevanceRange[0]}%</span>
                    <span>{relevanceRange[1]}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-4 py-3 border-t flex justify-between">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button size="sm" onClick={() => setIsOpen(false)}>
                  Apply Filters
                </Button>
              </CardFooter>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="px-2 py-1 h-8 gap-1"
              >
                {filter === 'authors' && (
                  <>Authors: {selectedAuthors.length}</>
                )}
                {filter === 'types' && (
                  <>Types: {selectedTypes.length}</>
                )}
                {filter === 'dates' && (
                  <>Date Range</>
                )}
                {filter === 'relevance' && (
                  <>Relevance: {relevanceRange[0]}%-{relevanceRange[1]}%</>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => removeFilter(filter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters; 