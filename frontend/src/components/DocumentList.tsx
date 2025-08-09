import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Loader2, FilePlus, TrashIcon, FileIcon, XCircle, Search, CheckSquare, Eye } from 'lucide-react';
import api from '../services/api';
import type { Document } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import DocumentViewer from './DocumentViewer';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useToast } from './ui/use-toast';

interface DocumentListProps {
  refreshTrigger: number;
  onSelectionChange?: (selectedDocs: number[]) => void;
  onDocumentsChange?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  refreshTrigger,
  onSelectionChange,
  onDocumentsChange
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDeleteAllDialog, setOpenDeleteAllDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [_totalDocuments, setTotalDocuments] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreDocuments, setHasMoreDocuments] = useState(true);

  // prevent unnecessary re-renders
  const notifySelectionChange = useCallback((newSelection: number[]) => {
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [onSelectionChange]);

  useEffect(() => {
    fetchDocuments(true);
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = [...documents];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.filename.toLowerCase().includes(term) || 
        doc.id.toString().includes(term)
      );
    }
    
    if (filterType) {
      filtered = filtered.filter(doc => 
        doc.filetype.includes(filterType)
      );
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, filterType]);

  const fetchDocuments = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      
      const response = await api.getDocuments();
      const responseData = response.data.documents;
      
      if (reset) {
        setDocuments(responseData);
        setTotalDocuments(responseData.length);
        setFilteredDocuments(responseData.slice(0, pageSize));
        setHasMoreDocuments(responseData.length > pageSize);
      } else {
        const nextPageStart = currentPage * pageSize;
        const nextPageEnd = nextPageStart + pageSize;
        const newDocs = responseData.slice(nextPageStart, nextPageEnd);
        
        setFilteredDocuments(prevFiltered => [...prevFiltered, ...newDocs]);
        setHasMoreDocuments(nextPageEnd < responseData.length);
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const loadMoreDocuments = () => {
    if (!isLoadingMore && hasMoreDocuments) {
      fetchDocuments(false);
    }
  };

  // find previous/next document for the document viewer navigation
  const getDocumentPosition = useMemo(() => {
    if (viewingDocument === null) return { prev: null, next: null };
    
    const allDocs = [...documents];
    const currentIndex = allDocs.findIndex(doc => doc.id === viewingDocument);
    
    if (currentIndex === -1) return { prev: null, next: null };
    
    const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1].id : null;
    const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1].id : null;
    
    return { prev: prevDoc, next: nextDoc };
  }, [documents, viewingDocument]);

  const handleToggleSelect = (id: number) => {
    setSelectedDocuments(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id];
      
      notifySelectionChange(newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    let newSelection: number[] = [];
    
    if (selectedDocuments.length !== filteredDocuments.length) {
      newSelection = filteredDocuments.map(doc => doc.id);
    }
    
    setSelectedDocuments(newSelection);
    notifySelectionChange(newSelection);
  };

  const handleDeleteClick = (id: number) => {
    setDocumentToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteAllClick = () => {
    setOpenDeleteAllDialog(true);
  };

  const handleViewDocument = (id: number) => {
    setViewingDocument(id);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete === null) return;
    
    try {
      await api.deleteDocument(documentToDelete);
      toast({ title: 'Document deleted', description: `Document #${documentToDelete} was removed.` });
      fetchDocuments(); // Refresh the list
      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Error deleting document' });
      console.error(err);
    } finally {
      setOpenDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await api.deleteAllDocuments();
      toast({ title: 'All documents deleted', description: 'The document list has been cleared.' });
      fetchDocuments(); // Refresh the list
      setSelectedDocuments([]); // Clear selections
      notifySelectionChange([]);
      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Error deleting documents' });
      console.error(err);
    } finally {
      setOpenDeleteAllDialog(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterTypeChange = (type: string | null) => {
    setFilterType(type === filterType ? null : type);
  };

  const getFileTypeBadge = (filetype: string) => {
    let badgeClass = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";
    
    if (filetype.includes('pdf')) {
      badgeClass += " bg-red-100 text-red-800 border-red-200";
      return <div className={badgeClass}>PDF</div>;
    } else if (filetype.includes('image')) {
      badgeClass += " bg-blue-100 text-blue-800 border-blue-200";
      return <div className={badgeClass}>{filetype.split('/')[1].toUpperCase()}</div>;
    }
    
    badgeClass += " bg-gray-100 text-gray-800 border-gray-200";
    return <div className={badgeClass}>{filetype}</div>;
  };

  

  // Find previous/next document for the document viewer navigation
  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex justify-center items-center p-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">
            Documents ({documents.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <>
                <Button 
                  variant="outline"
                  className="text-primary px-3 py-1 rounded text-sm flex items-center gap-1"
                  onClick={handleSelectAll}
                >
                  <CheckSquare className="h-4 w-4" />
                  {selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0 
                    ? "Deselect All" 
                    : "Select All"}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAllClick}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        
        {documents.length > 0 && (
          <CardContent className="pb-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${filterType === 'application/pdf' ? 'bg-red-100 border-red-300' : ''}`}
                  onClick={() => handleFilterTypeChange('application/pdf')}
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${filterType === 'image/jpeg' ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => handleFilterTypeChange('image/jpeg')}
                >
                  JPEG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${filterType === 'image/png' ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => handleFilterTypeChange('image/png')}
                >
                  PNG
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FilePlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No documents uploaded yet.</p>
              <p className="text-sm text-muted-foreground">Upload documents to start analyzing.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                      <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={filteredDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No documents match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow 
                          key={doc.id}
                          className={selectedDocuments.includes(doc.id) ? "bg-muted/50" : ""}
                        >
                          <TableCell className="p-2">
                            <Checkbox
                              checked={selectedDocuments.includes(doc.id)}
                              onCheckedChange={() => handleToggleSelect(doc.id)}
                            />
                          </TableCell>
                          <TableCell>{doc.id}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-primary" />
                              {doc.filename}
                            </div>
                          </TableCell>
                          <TableCell>{getFileTypeBadge(doc.filetype)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(doc.uploaded_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleViewDocument(doc.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                               <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(doc.id)}
                               >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {hasMoreDocuments && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreDocuments}
                    disabled={isLoadingMore}
                    className="w-full"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load More Documents</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {selectedDocuments.length > 0 && (
          <CardFooter className="pt-4 flex justify-between text-sm text-muted-foreground">
            <span>{selectedDocuments.length} document(s) selected for analysis</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedDocuments([]);
                notifySelectionChange([]);
              }}
            >
              Clear selection
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Document Viewer */}
      {viewingDocument !== null && (
        <DocumentViewer
          documentId={viewingDocument}
          onClose={() => setViewingDocument(null)}
          hasPrevious={getDocumentPosition.prev !== null}
          hasNext={getDocumentPosition.next !== null}
          onPrevious={getDocumentPosition.prev !== null ? () => setViewingDocument(getDocumentPosition.prev!) : undefined}
          onNext={getDocumentPosition.next !== null ? () => setViewingDocument(getDocumentPosition.next!) : undefined}
        />
      )}

      {/* Delete document dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all documents dialog */}
      <AlertDialog open={openDeleteAllDialog} onOpenChange={setOpenDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all documents?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all documents from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteAll}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toasts handled via <Toaster /> in App */}
    </>
  );
};

export default DocumentList;
