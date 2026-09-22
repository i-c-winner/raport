from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Change, User
from app.schemas import ChangeCreate, ChangeOut, ChangeUpdate

router = APIRouter(prefix="/projects/{project_id}/changes", tags=["changes"])


@router.get("", response_model=list[ChangeOut])
def list_changes(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Change]:
    require_project_access(project_id, user, db)
    return db.query(Change).filter(Change.project_id == project_id).all()


@router.post("", response_model=ChangeOut)
def create_change(
    project_id: int,
    payload: ChangeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Change:
    require_project_access(project_id, user, db)

    change = Change(
        project_id=project_id,
        code=f"CH-{db.query(Change).filter(Change.project_id == project_id).count() + 1:03d}",
        title=payload.title,
        description=payload.description,
        reason=payload.reason,
        requested_by=payload.requested_by,
        owner_id=payload.owner_id,
        status=payload.status,
        schedule_impact_days=payload.schedule_impact_days,
        cost_impact=payload.cost_impact,
        requested_at=payload.requested_at,
        required_date=payload.required_date,
        approved_at=payload.approved_at,
    )
    db.add(change)
    db.commit()
    db.refresh(change)
    return change


@router.get("/{change_id}", response_model=ChangeOut)
def get_change(
    project_id: int,
    change_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Change:
    require_project_access(project_id, user, db)
    change = db.query(Change).filter(Change.id == change_id, Change.project_id == project_id).first()
    if change is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change not found")
    return change


@router.patch("/{change_id}", response_model=ChangeOut)
def update_change(
    project_id: int,
    change_id: int,
    payload: ChangeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Change:
    require_project_access(project_id, user, db)
    change = db.query(Change).filter(Change.id == change_id, Change.project_id == project_id).first()
    if change is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        current_value = getattr(change, field)
        if current_value != value:
            setattr(change, field, value)

    db.commit()
    db.refresh(change)
    return change
