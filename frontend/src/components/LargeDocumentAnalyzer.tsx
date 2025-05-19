import React, { useState } from 'react';
import { FilesIcon, AlertTriangleIcon, BarChart3, CheckIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { documentProcessor } from '../services/documentProcessor';
import type { Theme } from '../types';
import ThemeDisplay from './ThemeDisplay';

interface LargeDocumentAnalyzerProps {
  documentIds: number[];
  onComplete?: (themes: Theme[]) => void;
  onCancel?: () => void;
}

const LargeDocumentAnalyzer: React.FC<LargeDocumentAnalyzerProps> = ({ 
  documentIds, 
  onComplete,
  onCancel 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>('Preparing');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [maxThemes, setMaxThemes] = useState(10);
  const [relevanceThreshold, setRelevanceThreshold] = useState(0.7);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  const startAnalysis = async () => {
    if (documentIds.length === 0) {
      setError('No documents selected for analysis');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      setProgressStage('Preparing documents');
      setThemes([]);
      setAnalysisComplete(false);

      // Step 1: Load document metadata (if needed)
      setProgressStage('Loading document metadata');
      
      // Step 2: Process documents in batches
      setProgressStage('Processing documents');
      await documentProcessor.processBatches(
        documentIds, 
        'preprocess',
        {},
        (processed, total) => {
          setProgress(Math.floor((processed / total) * 40));
        }
      );
      
      // Step 3: Identify themes across documents
      setProgressStage('Identifying themes');
      const identifiedThemes = await documentProcessor.identifyThemesAcrossDocuments(
        documentIds,
        maxThemes,
        relevanceThreshold,
        (processed, total) => {
          // Scale progress from 40% to 90%
          setProgress(40 + Math.floor((processed / total) * 50));
        }
      );
      
      // Step 4: Finalize results
      setProgressStage('Finalizing results');
      setProgress(100);
      setThemes(identifiedThemes);
      setAnalysisComplete(true);
      setIsAnalyzing(false);
      
      // Notify parent component if callback provided
      if (onComplete) {
        onComplete(identifiedThemes);
      }
      
    } catch (err) {
      console.error('Error analyzing documents:', err);
      setError('Failed to analyze documents. Please try again later.');
      setIsAnalyzing(false);
    }
  };
  
  const handleCancel = () => {
    setIsAnalyzing(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilesIcon className="h-5 w-5" />
            Large Document Set Analysis
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {documentIds.length} documents selected for analysis.
          </p>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!analysisComplete && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-themes">Maximum Themes</Label>
                  <span className="text-sm text-muted-foreground">{maxThemes}</span>
                </div>
                <Slider
                  id="max-themes"
                  min={3}
                  max={25}
                  step={1}
                  value={[maxThemes]}
                  onValueChange={(value: React.SetStateAction<number>[]) => setMaxThemes(value[0])}
                  disabled={isAnalyzing}
                />
                <span className="text-xs text-muted-foreground">
                  Higher values identify more themes but may result in overlapping topics
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="relevance-threshold">Relevance Threshold</Label>
                  <span className="text-sm text-muted-foreground">{relevanceThreshold.toFixed(1)}</span>
                </div>
                <Slider
                  id="relevance-threshold"
                  min={0.5}
                  max={0.9}
                  step={0.1}
                  value={[relevanceThreshold]}
                  onValueChange={(value: React.SetStateAction<number>[]) => setRelevanceThreshold(value[0])}
                  disabled={isAnalyzing}
                />
                <span className="text-xs text-muted-foreground">
                  Higher values ensure stronger evidence but may identify fewer themes
                </span>
              </div>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progressStage}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          )}
          
          {analysisComplete && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckIcon className="h-5 w-5" /> 
              Analysis complete! {themes.length} themes identified.
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-3">
          {isAnalyzing ? (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          ) : (
            !analysisComplete ? (
              <Button onClick={startAnalysis} disabled={documentIds.length === 0}>
                {documentIds.length === 0 ? (
                  'Select documents first'
                ) : (
                  <> 
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Start Theme Analysis
                  </>
                )}
              </Button>
            ) : null
          )}
        </CardFooter>
      </Card>
      
      {analysisComplete && themes.length > 0 && (
        <ThemeDisplay themes={themes} />
      )}
    </div>
  );
};

export default LargeDocumentAnalyzer; 