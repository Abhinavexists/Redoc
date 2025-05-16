from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    content_path = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.now)