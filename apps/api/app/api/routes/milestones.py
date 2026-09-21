from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Milestone, User
from app.schemas import MilestoneCreate, MilestoneOut

router = APIRouter(prefix="/projects/{project_id}/milestones", tags=["milestones"])


@router.get("", response_model=list[MilestoneOut])
def list_milestones(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Milestone]:
    require_project_access(project_id, user, db)
    return db.query(Milestone).filter(Milestone.project_id == project_id).all()


@router.post("", response_model=MilestoneOut)
def create_milestone(
    project_id: int,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Milestone:
    require_project_access(project_id, user, db)

    milestone = Milestone(
        project_id=project_id,
        code=payload.code,
        title=payload.title,
        description=payload.description,
        baseline_date=payload.baseline_date,
        current_date=payload.current_date,
        forecast_date=payload.forecast_date,
        actual_date=payload.actual_date,
        status=payload.status,
        owner_id=payload.owner_id,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("/{milestone_id}", response_model=MilestoneOut)
def get_milestone(
    project_id: int,
    milestone_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Milestone:
    require_project_access(project_id, user, db)
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.project_id == project_id).first()
    if milestone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return milestone
