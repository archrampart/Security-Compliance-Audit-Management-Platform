from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.audit import Audit
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.word_generator import generate_audit_word_report
from datetime import datetime
import os
import tempfile
import uuid

router = APIRouter()

@router.get("/audit/{audit_id}/word")
def generate_word_report(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Word (.docx) report for an audit with cover page"""
    from sqlalchemy.orm import joinedload
    from app.models.finding import Finding, Evidence
    
    # Load audit with all relationships
    from app.models.project import Project
    from app.models.organization import Organization
    
    audit = db.query(Audit).options(
        joinedload(Audit.project).joinedload(Project.organization),
        joinedload(Audit.findings).joinedload(Finding.evidences)
    ).filter(Audit.id == audit_id).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check access (reuse finding access check logic)
    from app.api.v1.endpoints.findings import check_audit_access
    check_audit_access(current_user, audit_id, db)
    
    # Generate Word document
    word_path = generate_audit_word_report(audit, db)
    
    # Generate random filename in English
    random_id = uuid.uuid4().hex[:8]
    filename = f"audit_report_{random_id}.docx"
    
    return FileResponse(
        word_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )
