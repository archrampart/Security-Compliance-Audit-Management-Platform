from fastapi import APIRouter
from app.api.v1.endpoints import auth, organizations, users, projects, audits, templates, findings, reports, activity, notifications, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(audits.router, prefix="/audits", tags=["audits"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(findings.router, prefix="/findings", tags=["findings"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

