from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Change, Decision, Issue, Risk, User
from app.schemas import DashboardSummary

router = APIRouter(prefix="/projects/{project_id}", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DashboardSummary:
    require_project_access(project_id, user, db)

    open_risks = db.query(func.count(Risk.id)).filter(Risk.project_id == project_id, Risk.status == "open").scalar() or 0
    critical_issues = db.query(func.count(Issue.id)).filter(
        Issue.project_id == project_id,
        Issue.severity == "critical",
    ).scalar() or 0
    overdue_decisions = db.query(func.count(Decision.id)).filter(
        Decision.project_id == project_id,
        Decision.status == "pending",
    ).scalar() or 0
    pending_changes = db.query(func.count(Change.id)).filter(
        Change.project_id == project_id,
        Change.status.in_(["draft", "under_review"]),
    ).scalar() or 0

    return DashboardSummary(
        project_name=f"Project {project_id}",
        status="active",
        progress=31,
        schedule_status="yellow",
        schedule_variance_days=18,
        open_risks=open_risks,
        critical_issues=critical_issues,
        overdue_decisions=overdue_decisions,
        pending_changes=pending_changes,
        total_milestones=0,
    )
