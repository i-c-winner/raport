from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import AuditLog, Issue, IssueChange, User
from app.schemas import IssueChangeCreate, IssueChangeOut, IssueCreate, IssueOut, IssueUpdate

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


@router.get("/{issue_id}/changes", response_model=list[IssueChangeOut])
def list_issue_changes(
    project_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[IssueChange]:
    require_project_access(project_id, user, db)
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.project_id == project_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return db.query(IssueChange).filter(IssueChange.issue_id == issue.id).order_by(IssueChange.created_at.desc()).all()


@router.post("/{issue_id}/changes", response_model=IssueChangeOut)
def create_issue_change(
    project_id: int,
    issue_id: int,
    payload: IssueChangeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> IssueChange:
    require_project_access(project_id, user, db)
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.project_id == project_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    current_value = getattr(issue, payload.field_name, None)
    if payload.new_value is not None and current_value == payload.new_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Issue value unchanged")

    change = IssueChange(
        issue_id=issue.id,
        field_name=payload.field_name,
        old_value=payload.old_value,
        new_value=payload.new_value,
        comment=payload.comment,
        changed_by=user.id,
    )
    db.add(change)
    db.add(
        AuditLog(
            project_id=project_id,
            entity_type="issue",
            entity_id=issue.id,
            entity_name=issue.title,
            action="change",
            field_name=payload.field_name,
            old_value=payload.old_value,
            new_value=payload.new_value,
            user_id=user.id,
        )
    )
    db.commit()
    db.refresh(change)
    return change


@router.patch("/{issue_id}", response_model=IssueOut)
def update_issue(
    project_id: int,
    issue_id: int,
    payload: IssueUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Issue:
    require_project_access(project_id, user, db)
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.project_id == project_id).first()
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    changes: list[tuple[str, object, object]] = []
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        old_value = getattr(issue, field)
        if old_value != value:
            changes.append((field, old_value, value))
            setattr(issue, field, value)

    if changes:
        for field_name, old_value, new_value in changes:
            db.add(
                IssueChange(
                    issue_id=issue.id,
                    field_name=field_name,
                    old_value=str(old_value) if old_value is not None else None,
                    new_value=str(new_value) if new_value is not None else None,
                    comment=f"Изменение поля '{field_name}'",
                    changed_by=user.id,
                )
            )
            db.add(
                AuditLog(
                    project_id=project_id,
                    entity_type="issue",
                    entity_id=issue.id,
                    entity_name=issue.title,
                    action="update",
                    field_name=field_name,
                    old_value=str(old_value) if old_value is not None else None,
                    new_value=str(new_value) if new_value is not None else None,
                    user_id=user.id,
                )
            )

    db.commit()
    db.refresh(issue)
    return issue
