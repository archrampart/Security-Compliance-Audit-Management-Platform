from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.finding import Finding
from app.models.audit import Audit, AuditStatus
from app.models.project import Project
from app.models.template import Severity, Status
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    from app.models.project import ProjectUser
    
    # Filter accessible projects
    if current_user.role == UserRole.PLATFORM_ADMIN:
        accessible_project_ids = None  # All projects
    elif current_user.role == UserRole.ORG_ADMIN:
        projects = db.query(Project).filter(Project.organization_id == current_user.organization_id).all()
        accessible_project_ids = [p.id for p in projects]
    else:
        project_users = db.query(ProjectUser).filter(ProjectUser.user_id == current_user.id).all()
        accessible_project_ids = [pu.project_id for pu in project_users]
    
    # Base queries
    audits_query = db.query(Audit)
    findings_query = db.query(Finding).join(Audit)
    
    if accessible_project_ids is not None:
        audits_query = audits_query.filter(Audit.project_id.in_(accessible_project_ids))
        findings_query = findings_query.filter(Audit.project_id.in_(accessible_project_ids))
    
    if project_id:
        audits_query = audits_query.filter(Audit.project_id == project_id)
        findings_query = findings_query.filter(Audit.project_id == project_id)
    
    # Get counts
    total_projects = db.query(Project).count() if current_user.role == UserRole.PLATFORM_ADMIN else len(accessible_project_ids or [])
    total_audits = audits_query.count()
    total_findings = findings_query.count()
    
    # Status distribution
    audit_status_dist = {}
    for status in AuditStatus:
        count = audits_query.filter(Audit.status == status).count()
        audit_status_dist[status.value] = count
    
    # Severity distribution
    severity_dist = {}
    for severity in Severity:
        count = findings_query.filter(Finding.severity == severity).count()
        severity_dist[severity.value] = count
    
    # Status distribution
    finding_status_dist = {}
    for status in Status:
        count = findings_query.filter(Finding.status == status).count()
        finding_status_dist[status.value] = count
    
    # Open findings count
    open_findings = findings_query.filter(
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS])
    ).count()
    
    # Urgent findings (critical/high, open/in_progress)
    urgent_findings = findings_query.filter(
        Finding.severity.in_([Severity.CRITICAL, Severity.HIGH]),
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS])
    ).count()
    
    # Assigned findings count for current user
    my_findings = findings_query.filter(Finding.assigned_to_user_id == current_user.id).count()
    
    # Overdue findings
    now = datetime.now()
    overdue_findings = findings_query.filter(
        Finding.due_date.isnot(None),
        Finding.due_date < now,
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS])
    ).count()
    
    # Due soon (next 3 days)
    three_days_later = now + timedelta(days=3)
    due_soon_findings = findings_query.filter(
        Finding.due_date.isnot(None),
        Finding.due_date <= three_days_later,
        Finding.due_date > now,
        Finding.status.in_([Status.OPEN, Status.IN_PROGRESS])
    ).count()
    
    # Completion rate
    total_findings_for_completion = total_findings
    completed_findings = findings_query.filter(Finding.status == Status.RESOLVED).count()
    completion_rate = (completed_findings / total_findings_for_completion * 100) if total_findings_for_completion > 0 else 0
    
    return {
        "total_projects": total_projects,
        "total_audits": total_audits,
        "total_findings": total_findings,
        "open_findings": open_findings,
        "urgent_findings": urgent_findings,
        "my_findings": my_findings,
        "overdue_findings": overdue_findings,
        "due_soon_findings": due_soon_findings,
        "completion_rate": round(completion_rate, 2),
        "audit_status_distribution": audit_status_dist,
        "severity_distribution": severity_dist,
        "status_distribution": finding_status_dist
    }

@router.get("/findings-timeline")
def get_findings_timeline(
    days: int = Query(30, ge=1, le=365),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get findings created over time"""
    from app.models.project import ProjectUser
    
    # Filter accessible projects
    if current_user.role == UserRole.PLATFORM_ADMIN:
        accessible_project_ids = None
    elif current_user.role == UserRole.ORG_ADMIN:
        projects = db.query(Project).filter(Project.organization_id == current_user.organization_id).all()
        accessible_project_ids = [p.id for p in projects]
    else:
        project_users = db.query(ProjectUser).filter(ProjectUser.user_id == current_user.id).all()
        accessible_project_ids = [pu.project_id for pu in project_users]
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        func.date(Finding.created_at).label('date'),
        func.count(Finding.id).label('count')
    ).join(Audit)
    
    if accessible_project_ids is not None:
        query = query.filter(Audit.project_id.in_(accessible_project_ids))
    
    if project_id:
        query = query.filter(Audit.project_id == project_id)
    
    query = query.filter(Finding.created_at >= start_date).group_by(func.date(Finding.created_at)).order_by('date')
    
    results = query.all()
    
    return [{"date": str(result.date), "count": result.count} for result in results]





