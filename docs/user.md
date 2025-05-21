# User Guide

Wasserstoff is a document research and theme identification application that helps you analyze multiple documents, identify common themes, and provide cited responses to your queries.

## Getting Started

### Accessing the Application

You can access the Wasserstoff application at:

- Development: http://localhost:3000
- Production: (Deployed URL)

### Interface Overview

The Wasserstoff interface consists of several key components:

1. **Search Bar**: Enter your queries here
2. **Document List**: View and manage your uploaded documents
3. **Theme Display**: View identified themes across documents
4. **Citation View**: View citations supporting each theme at different levels of granularity

## Features

### 1. Uploading Documents

To upload documents to the system:

1. Click the "Upload" button in the top navigation bar
2. Select one or more PDF files from your computer
3. Wait for the upload to complete

The system supports PDF documents and will process them for analysis.

### 2. Querying Documents

To search across your documents:

1. Type your question in the search bar (e.g., "What are the main policy recommendations?")
2. Click the "Search" button
3. Review the search results and identified themes

### 3. Exploring Themes

After performing a search, the system will automatically identify common themes across the documents:

1. **Theme List View**: Displays each theme with a name, summary, and supporting documents
2. **Theme Chart View**: Visualizes the relationship between themes and documents in a matrix

You can:
- Filter themes by keyword using the search box
- Filter themes by document name
- Switch between list and chart views
- Load more themes if available

### 4. Viewing Theme Citations

To see detailed citations for a theme:

1. Click the "View Citations" button on any theme card
2. The citations panel will appear showing evidence from documents
3. Use the tabs to switch between citation levels:
   - **Document**: Show document-level citations
   - **Paragraph**: Show paragraph-level citations (default)
   - **Sentence**: Show sentence-level citations

Each citation includes:
- The document source
- Page, paragraph, and sentence references (depending on the level)
- The relevant content
- A relevance score

### 5. Filtering and Searching

You can narrow down the displayed themes:

1. Use the "Search themes..." box to filter by theme name or content
2. Use the "Filter by document..." box to show only themes from specific documents

## Citation Levels

The system supports three levels of citation granularity:

1. **Document Level**: 
   - Citations reference only the document name
   - Example: "document1.pdf"

2. **Paragraph Level**:
   - Citations include document name, page, and paragraph
   - Example: "document1.pdf, Page 1, Para 2"

3. **Sentence Level**:
   - Citations include document name, page, paragraph, and sentence
   - Example: "document1.pdf, Page 1, Para 2, Sentence 3"

More granular citation levels provide more precise references but may result in more fragmented themes.

## Tips for Effective Use

1. **Be specific in your queries**: More specific questions tend to yield more focused themes
2. **Use paragraph-level citations**: For a good balance between detail and context
3. **Upload related documents**: The system works best when analyzing documents on similar topics
4. **Try different search terms**: If you don't find what you're looking for, try rephrasing your query
5. **Combine themes**: Look for relationships between different identified themes

## Troubleshooting

### Common Issues

1. **Document upload fails**:
   - Check that your document is in PDF format
   - Ensure the file size is under the limit (typically 10MB)

2. **No themes are identified**:
   - Try a more specific query
   - Ensure you have uploaded relevant documents
   - Check that your documents have sufficient text content (not just images)

3. **Citation view shows "No citations found"**:
   - Try switching to a different citation level
   - The theme might not have strong evidence at the selected granularity level

### Getting Help

If you encounter any issues not covered in this guide, please contact the system administrator or submit a support ticket. 