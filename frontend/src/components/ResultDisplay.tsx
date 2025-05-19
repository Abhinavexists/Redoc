import React from 'react';
import { FileText, BookOpen } from 'lucide-react';
import type { DocumentMatch } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';

interface ResultsDisplayProps {
  matches: DocumentMatch[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Matches ({matches.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Document</TableHead>
                <TableHead>Extracted Answer</TableHead>
                <TableHead className="w-[120px]">Citation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[180px]">{match.filename}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {match.page && (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                            Page {match.page}
                          </div>
                        )}
                        {match.paragraph && (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-primary/20 text-foreground">
                            Para {match.paragraph}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-[150px] overflow-auto whitespace-pre-wrap text-sm p-3 bg-muted/20 rounded border">
                      {match.matched_text}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="italic text-muted-foreground">
                      {match.citation}
                    </div>
                    {match.relevance && (
                      <div className="mt-1.5 text-[10px] text-muted-foreground">
                        Relevance: {(match.relevance * 100).toFixed(0)}%
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
