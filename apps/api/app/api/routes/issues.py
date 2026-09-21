from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Issue, User
from app.schemas import IssueCreate, IssueOut

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])


@router.get("", response_model=list[IssueOut])
def list_issues(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Issue]:
    require_project_access(project_id, user, db)
    return db.query(Issue).filter(Issue.project_id == project_id).all()


@router.post("", response_model=IssueOut)
def create_issue(
    project_id: int,
    payload: IssueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Issue:
    require_project_access(project_id, user, db)

    issue = Issue(
        project_id=project_id,
        code=f"I-{db.query(Issue).filter(Issue.project_id == project_id).count() + 1:03d}",
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        severity=payload.severity,
        schedule_impact_days=payload.schedule_impact_days,
        cost_impact=payload.cost_impact,
        owner_id=payload.owner_id,
        action_required=payload.action_required,
        status=payload.status,
        identified_at=payload.identified_at,
        due_date=payload.due_date,
        resolved_at=payload.resolved_at,
        created_by=user.id,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(
    project_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Issue:
    require_project_access(project_id, user, db)
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.project_id == project_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.patch("/{issue_id}", response_model=IssueOut)
def update_issue(
    project_id: int,
    issue_id: int,
    payload: IssueCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Issue:
    require_project_access(project_id, user, db)
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.project_id == project_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(issue, field, value)

    db.commit()
    db.refresh(issue)
    return issue
