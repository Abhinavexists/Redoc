"""
Theme identification module for the document research and theme identification chatbot.
This module analyzes document matches and identifies common themes across them.
"""

import logging
import os
from typing import List, Dict, Any, Optional
import json
import google.generativeai as genai
from app.config import settings
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(settings.MODEL_NAME)

def identify_themes(matches: List[Dict[str, Any]], theme_count: int = 3) -> List[Dict[str, Any]]:
    """
    Identify common themes across document matches.
    """
    if not matches:
        logger.warning("No matches provided to identify_themes")
        return []
    
    if not settings.GEMINI_API_KEY:
        logger.error("Cannot identify themes: Gemini API key not set")
        return []
    
    logger.info(f"Identifying {theme_count} themes across {len(matches)} document matches")
    
    # Prepare the input data for theme identification
    documents_text = []
    document_ids = []
    
    for match in matches:
        document_ids.append(match.get("filename", f"Doc {match.get('id', 'unknown')}"))
        documents_text.append({
            "id": match.get("filename", f"Doc {match.get('id', 'unknown')}"),
            "content": match.get("matched_text", "")
        })
    
    try:
        prompt = create_theme_identification_prompt(documents_text, theme_count)
        themes = call_gemini_api(prompt)
        
        # Process and format the identified themes
        formatted_themes = format_themes(themes, document_ids)
        logger.info(f"Successfully identified {len(formatted_themes)} themes")
        
        return formatted_themes
    
    except Exception as e:
        logger.error(f"Error in theme identification: {str(e)}")
        return []

def create_theme_identification_prompt(documents: List[Dict[str, str]], theme_count: int) -> str:
    """Create a prompt for the Gemini API to identify themes."""
    
    prompt = f"""Analyze the following document excerpts and identify exactly {theme_count} common themes across them.

For each document excerpt, I've provided:
1. A document identifier
2. The text content from that document

Documents:
"""

    for i, doc in enumerate(documents):
        prompt += f"\nDOCUMENT {i+1} ({doc['id']}):\n{doc['content']}\n"
    
    prompt += f"""
Based on these document excerpts, identify exactly {theme_count} distinct themes that are present across multiple documents.

For each theme:
1. Provide a clear, concise name for the theme
2. Write a brief summary describing the theme (2-3 sentences)
3. List the document IDs that support this theme
4. Include a short evidence quote or explanation from the documents

Format your response as a JSON array with the following structure:
[
  {{
    "theme_name": "Clear Theme Name",
    "summary": "Brief summary of the theme",
    "supporting_documents": ["Doc1", "Doc2"],
    "evidence": "Brief evidence for this theme from the documents"
  }},
  // Additional themes...
]

Ensure you return EXACTLY {theme_count} themes in valid JSON format.
"""
    
    return prompt

def call_gemini_api(prompt: str) -> List[Dict[str, Any]]:
    """Call the Gemini API to process the theme identification."""
    
    logger.info("Calling Gemini API for theme identification")
    
    try:
        response = model.generate_content(prompt)
        content = response.text
        
        # Extract JSON from the response
        themes = json.loads(content)
        return themes
    
    except Exception as e:
        logger.error(f"API request error: {str(e)}")
        raise

def format_themes(themes: List[Dict[str, Any]], document_ids: List[str]) -> List[Dict[str, Any]]:
    """Format the themes data for the API response."""
    
    formatted_themes = []
    
    for i, theme in enumerate(themes):
        formatted_theme = {
            "id": i + 1,
            "theme_name": theme.get("theme_name", f"Theme {i+1}"),
            "summary": theme.get("summary", "No summary provided"),
            "supporting_documents": theme.get("supporting_documents", []),
            "evidence": theme.get("evidence", "No evidence provided")
        }
        
        # Verify supporting documents actually exist in our document set
        valid_docs = [doc for doc in formatted_theme["supporting_documents"] if doc in document_ids]
        formatted_theme["supporting_documents"] = valid_docs
        
        # Only include themes that have supporting documents
        if valid_docs:
            formatted_themes.append(formatted_theme)
    
    return formatted_themes

async def identify_themes_across_documents(
    documents: List[Dict[str, Any]],
    max_themes: int = 5,
    relevance_threshold: float = 0.7
) -> List[Dict[str, Any]]:
    """
    Identify themes across multiple documents efficiently
    """
    # Process documents in parallel with a limit
    max_workers = min(settings.MAX_DOCUMENTS_PER_BATCH, len(documents))
    themes = []
    
    async def process_document(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Extract key sections from the document
        sections = extract_key_sections(doc["content"])
        
        # Process each section for themes
        doc_themes = []
        for section in sections:
            section_themes = await identify_themes_in_text(
                section,
                max_themes=2,
                relevance_threshold=relevance_threshold
            )
            doc_themes.extend(section_themes)
        
        return doc_themes

    # Process documents in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(executor, process_document, doc)
            for doc in documents
        ]
        results = await asyncio.gather(*tasks)
    
    # Combine and deduplicate themes
    all_themes = []
    for doc_themes in results:
        all_themes.extend(doc_themes)
    
    # Merge similar themes and sort by relevance
    merged_themes = merge_similar_themes(all_themes)
    return sorted(merged_themes, key=lambda x: x["relevance"], reverse=True)[:max_themes]

def extract_key_sections(content: str, max_sections: int = 5) -> List[str]:
    """Extract key sections from document content"""
    paragraphs = content.split("\n\n")
    sections = []
    if paragraphs:
        sections.append(paragraphs[0])
    
    remaining_paragraphs = sorted(
        paragraphs[1:],
        key=lambda x: len(x),
        reverse=True
    )[:max_sections-1]
    sections.extend(remaining_paragraphs)
    
    return sections

async def identify_themes_in_text(
    text: str,
    max_themes: int = 5,
    relevance_threshold: float = 0.7
) -> List[Dict[str, Any]]:
    """Identify themes in a text using Gemini"""
    try:
        prompt = f"""Identify up to {max_themes} key themes in this text. For each theme, provide:
1. Theme name
2. Brief description
3. Relevance score (0-1)
4. Key supporting evidence

Text: {text[:4000]}"""

        response = model.generate_content(prompt)
        content = response.text
        
        # Parse the response
        themes = []
        theme_blocks = content.split("\n\n")
        for block in theme_blocks:
            if "Theme:" in block:
                lines = block.split("\n")
                theme_name = lines[0].replace("Theme:", "").strip()
                description = lines[1].replace("Description:", "").strip() if len(lines) > 1 else ""
                relevance = float(lines[2].replace("Relevance:", "").strip()) if len(lines) > 2 else 0.5
                evidence = lines[3].replace("Evidence:", "").strip() if len(lines) > 3 else ""
                
                if relevance >= relevance_threshold:
                    themes.append({
                        "name": theme_name,
                        "description": description,
                        "relevance": relevance,
                        "evidence": evidence
                    })
        
        return themes
    
    except Exception as e:
        logger.error(f"Error identifying themes: {str(e)}")
        return []

def merge_similar_themes(themes: List[Dict[str, Any]], similarity_threshold: float = 0.8) -> List[Dict[str, Any]]:
    """Merge similar themes based on name similarity"""
    merged = []
    used = set()
    
    for i, theme1 in enumerate(themes):
        if i in used:
            continue
            
        current_theme = theme1.copy()
        used.add(i)
        
        for j, theme2 in enumerate(themes[i+1:], i+1):
            if j in used:
                continue
                
            if are_themes_similar(theme1["name"], theme2["name"], similarity_threshold):
                current_theme["relevance"] = max(current_theme["relevance"], theme2["relevance"])
                current_theme["evidence"] += f"\n{theme2['evidence']}"
                used.add(j)
        
        merged.append(current_theme)
    
    return merged

def are_themes_similar(theme1: str, theme2: str, threshold: float) -> bool:
    """Check if two themes are similar based on their names"""
    words1 = set(theme1.lower().split())
    words2 = set(theme2.lower().split())
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0 >= threshold 