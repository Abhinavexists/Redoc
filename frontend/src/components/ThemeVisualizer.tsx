import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Maximize2, Minimize2, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type {Theme} from '../types';
import ForceGraph2D from 'react-force-graph-2d';

interface ThemeVisualizerProps {
  themes: Theme[];
  onDocumentClick?: (documentId: number) => void;
  onThemeClick?: (themeId: number) => void;
}

const ThemeVisualizer: React.FC<ThemeVisualizerProps> = ({
  themes,
  onDocumentClick,
  onThemeClick,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if ForceGraph2D is properly loaded
  useEffect(() => {
    try {
      if (typeof ForceGraph2D !== 'function') {
        setError('Visualization component not loaded properly. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error checking ForceGraph2D component:', err);
      setError('Visualization component not available.');
    }
  }, []);
  
  useEffect(() => {
    try {
      if (themes && themes.length > 0) {
        prepareGraphData(themes);
      }
    } catch (err) {
      console.error('Error preparing graph data:', err);
      setError('Failed to prepare visualization data');
    }
  }, [themes]);
  
  // Handle window resize to adjust graph
  useEffect(() => {
    const handleResize = () => {
      try {
        if (graphRef.current) {
          // Adjust graph on resize with slight delay
          setTimeout(() => {
            graphRef.current?.zoomToFit(400);
          }, 100);
        }
      } catch (err) {
        console.error('Error adjusting graph on resize:', err);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial fit
    setTimeout(() => {
      try {
        if (graphRef.current) {
          graphRef.current.zoomToFit(400);
        }
      } catch (err) {
        console.error('Error in initial graph fit:', err);
      }
    }, 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [graphData]);
  
  const prepareGraphData = (themes: Theme[]) => {
    try {
      const nodes: any[] = [];
      const links: any[] = [];
      const documentNodes = new Set<string>();
      
      themes.forEach((theme) => {
        nodes.push({
          id: `theme-${theme.id}`,
          name: theme.theme_name,
          type: 'theme',
          relevance: theme.relevance || 0.5,
          group: 1,
          val: 20,
        });
        
        if (theme.supporting_documents && Array.isArray(theme.supporting_documents)) {
          theme.supporting_documents.forEach(docId => {
            const documentNumber = docId.match(/\d+/)?.[0] || '0';
            const numericId = parseInt(documentNumber, 10);
            const documentNodeId = `doc-${numericId}`;
            
            if (!documentNodes.has(documentNodeId)) {
              nodes.push({
                id: documentNodeId,
                name: docId,
                type: 'document',
                group: 2,
                val: 10,
              });
              documentNodes.add(documentNodeId);
            }
            
            links.push({
              source: `theme-${theme.id}`,
              target: documentNodeId,
              value: theme.relevance || 0.5,
            });
          });
        }
      });
      
      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error in prepareGraphData:', err);
      setError('Failed to prepare graph data');
    }
  };
  
  const handleNodeClick = (node: any) => {
    try {
      if (node.type === 'theme' && onThemeClick) {
        const themeId = parseInt(node.id.replace('theme-', ''), 10);
        onThemeClick(themeId);
      } else if (node.type === 'document' && onDocumentClick) {
        const docId = parseInt(node.id.replace('doc-', ''), 10);
        onDocumentClick(docId);
      }
    } catch (err) {
      console.error('Error in node click handler:', err);
    }
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
    }, 300);
  };
  
  const downloadGraphImage = () => {
    try {
      if (graphRef.current) {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const link = document.createElement('a');
          link.download = 'theme-document-graph.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }
    } catch (err) {
      console.error('Error downloading graph image:', err);
      setError('Failed to download image');
    }
  };
  
  const resetGraph = () => {
    try {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
    } catch (err) {
      console.error('Error resetting graph:', err);
    }
  };
  
  const nodeColor = (node: any) => {
    if (node.type === 'theme') {
      const relevance = node.relevance || 0.5;
      if (relevance > 0.8) return '#8b5cf6';
      if (relevance > 0.5) return '#a78bfa';
      return '#c4b5fd';
    }
    return '#f97316';
  };
  
  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'relative'} overflow-hidden`}>
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Theme-Document Visualization
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={resetGraph} title="Reset View">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={downloadGraphImage} title="Download Image">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[400px]'}`} ref={containerRef}>
        {error && (
          <div className="h-full flex items-center justify-center text-red-500">
            <p>{error}</p>
          </div>
        )}
        {!error && graphData.nodes.length > 0 && (
          <div className="h-full w-full">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel={node => `${node.name} (${node.type})`}
              nodeColor={nodeColor}
              nodeRelSize={6}
              linkWidth={link => (link.value || 0.5) * 2}
              linkColor={() => '#e2e8f0'}
              onNodeClick={handleNodeClick}
              cooldownTicks={100}
              onEngineStop={() => {
                try {
                  if (graphRef.current) {
                    graphRef.current.zoomToFit(400);
                  }
                } catch (err) {
                  console.error('Error zooming graph:', err);
                }
              }}
            />
          </div>
        )}
        {!error && graphData.nodes.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No visualization data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemeVisualizer; 