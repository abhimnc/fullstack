# backend/main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from uuid import uuid4, UUID # Import UUID for type conversion
from fastapi.middleware.cors import CORSMiddleware
import datetime # Import the datetime module
from db import SessionLocal, init_db, Document, DocumentVersion # Assuming db.py defines these models and SessionLocal
from sqlalchemy.orm import Session

# Initialize FastAPI app
app = FastAPI()

# Initialize the database (create tables if they don't exist)
init_db()

# Add CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_methods=["*"], # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allows all headers
)

# Pydantic model for creating a new document
class CreateDoc(BaseModel):
    content: str

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db # Provide the session to the endpoint
    finally:
        db.close() # Ensure the session is closed after the request

@app.post("/create")
def create_doc(data: CreateDoc, db: Session = Depends(get_db)):
    """
    Creates a new document and its initial version.
    Generates a short_id and a creator_hash.
    """
    # Validate content size
    if len(data.content) > 1_000_000:
        raise HTTPException(status_code=400, detail="Document content too large (max 1MB).")

    now = datetime.datetime.utcnow() # Current UTC time
    short_id = uuid4().hex[:10] # Generate a 10-character short ID
    doc_id = uuid4() # Generate a full UUID for the document ID
    creator_hash_uuid = uuid4() # Generate a full UUID for the creator hash

    # Create a new Document entry in the database
    doc = Document(
        id=doc_id,
        short_id=short_id,
        creator_hash=creator_hash_uuid, # Store the UUID object
        published=True,
        created_at=now,
        expires_at=now + datetime.timedelta(hours=24), # Document expires in 24 hours
    )
    db.add(doc) # Add the document to the session

    # Create the initial version of the document
    version = DocumentVersion(
        id=uuid4(), # Generate a UUID for the version ID
        document_id=doc_id,
        content=data.content,
        creator_hash=creator_hash_uuid, # Associate version with the creator hash
        version_number=1,
        created_at=now,
        is_full_snapshot=True, # This version is a full snapshot
    )
    db.add(version) # Add the version to the session

    db.commit() # Commit the transaction to save changes to the database
    db.refresh(doc) # Refresh the document object to get its latest state from DB
    db.refresh(version) # Refresh the version object

    # Return the short_id and the creator_hash (as a string)
    return {"short_id": short_id, "creator_hash": str(creator_hash_uuid)}

@app.get("/doc/{short_id}")
def get_doc(short_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the latest content of a document by its short ID.
    This is a public read endpoint.
    """
    # Query for the document using its short_id
    doc = db.query(Document).filter(Document.short_id == short_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    # Check if the document has expired
    if datetime.datetime.utcnow() > doc.expires_at:
        raise HTTPException(status_code=403, detail="Document has expired.")

    # Retrieve the latest version of the document
    version = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == doc.id)
        .order_by(DocumentVersion.version_number.desc()) # Get the highest version number
        .first()
    )

    if not version:
        raise HTTPException(status_code=404, detail="No content versions found for this document.")

    return {"content": version.content}

# Pydantic model for fetching a document for editing (requires creator_hash)
class DocumentFetchRequest(BaseModel):
    short_id: str
    creator_hash: str # creator_hash comes as a string from the frontend

# Pydantic model for updating a document (requires creator_hash and content)
class DocumentUpdateRequest(DocumentFetchRequest):
    content: str

@app.post("/get")
def get_document(payload: DocumentFetchRequest, db: Session = Depends(get_db)):
    """
    Retrieves document content for editing, requiring both short_id and creator_hash for authorization.
    """
    try:
        # Convert the incoming creator_hash string to a UUID object for comparison
        creator_hash_uuid = UUID(payload.creator_hash)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid creator_hash format. Must be a valid UUID string.")

    # Query for the document, matching both short_id and creator_hash for security
    doc = db.query(Document).filter(
        Document.short_id == payload.short_id,
        Document.creator_hash == creator_hash_uuid # Compare with the UUID object
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized to access.")

    # Retrieve the latest version of the document associated with this document ID
    latest_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc.id
    ).order_by(DocumentVersion.version_number.desc()).first()

    return {"content": latest_version.content if latest_version else ""}

@app.post("/update")
def update_document(payload: DocumentUpdateRequest, db: Session = Depends(get_db)):
    """
    Updates a document by adding a new version, requiring short_id, creator_hash, and new content for authorization.
    """
    try:
        # Convert the incoming creator_hash string to a UUID object for comparison
        creator_hash_uuid = UUID(payload.creator_hash)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid creator_hash format. Must be a valid UUID string.")

    # Query for the document, matching both short_id and creator_hash for security
    doc = db.query(Document).filter(
        Document.short_id == payload.short_id,
        Document.creator_hash == creator_hash_uuid # Compare with the UUID object
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized to update.")

    # Count existing versions to determine the new version number
    version_count = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc.id
    ).count()

    # Create a new DocumentVersion entry
    new_version = DocumentVersion(
        id=uuid4(), # Assign a new UUID for this version
        document_id=doc.id,
        content=payload.content,
        creator_hash=creator_hash_uuid, # Associate with the creator hash
        version_number=version_count + 1, # Increment version number
        is_full_snapshot=True, # This new version is a full snapshot
        created_at=datetime.datetime.utcnow() # Timestamp for this version
    )

    # Update the document's updated_at timestamp
    doc.updated_at = datetime.datetime.utcnow()

    db.add(new_version) # Add the new version to the session
    db.commit() # Commit the transaction
    db.refresh(new_version) # Refresh to get the latest state of the new version

    return {"message": "Document updated successfully!", "version": new_version.version_number}
