import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Maximize2, Minimize2, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Theme, DocumentNode, ThemeNode, CitationLink } from '../types';
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
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (themes && themes.length > 0) {
      prepareGraphData(themes);
    }
  }, [themes]);
  
  const prepareGraphData = (themes: Theme[]) => {
    const nodes: any[] = [];
    const links: any[] = [];
    const documentNodes = new Set<string>();
    
    // Create theme nodes
    themes.forEach((theme, index) => {
      nodes.push({
        id: `theme-${theme.id}`,
        name: theme.theme_name,
        type: 'theme',
        relevance: theme.relevance || 0.5,
        group: 1,
        val: 20, // Size for theme nodes
      });
      
      // Create document nodes and links
      theme.supporting_documents.forEach(docId => {
        // Extract document ID from the docId string (usually in format 'Document_1.pdf')
        const documentNumber = docId.match(/\d+/)?.[0] || '0';
        const numericId = parseInt(documentNumber, 10);
        const documentNodeId = `doc-${numericId}`;
        
        // Only add document node if it's not already added
        if (!documentNodes.has(documentNodeId)) {
          nodes.push({
            id: documentNodeId,
            name: docId,
            type: 'document',
            group: 2,
            val: 10, // Size for document nodes
          });
          documentNodes.add(documentNodeId);
        }
        
        // Add link between theme and document
        links.push({
          source: `theme-${theme.id}`,
          target: documentNodeId,
          value: theme.relevance || 0.5,
        });
      });
    });
    
    setGraphData({ nodes, links });
  };
  
  const handleNodeClick = (node: any) => {
    if (node.type === 'theme' && onThemeClick) {
      const themeId = parseInt(node.id.replace('theme-', ''), 10);
      onThemeClick(themeId);
    } else if (node.type === 'document' && onDocumentClick) {
      const docId = parseInt(node.id.replace('doc-', ''), 10);
      onDocumentClick(docId);
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
    if (graphRef.current) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'theme-document-graph.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };
  
  const resetGraph = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };
  
  const nodeColor = (node: any) => {
    if (node.type === 'theme') {
      // Use a color based on theme relevance
      const relevance = node.relevance || 0.5;
      if (relevance > 0.8) return '#8b5cf6'; // Purple for high relevance
      if (relevance > 0.5) return '#a78bfa'; // Lighter purple for medium
      return '#c4b5fd'; // Lightest purple for low relevance
    }
    return '#f97316'; // Orange for documents
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
        {graphData.nodes.length > 0 && (
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
            onEngineStop={() => graphRef.current?.zoomToFit(400)}
          />
        )}
        {graphData.nodes.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No visualization data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThemeVisualizer; 