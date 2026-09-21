from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Decision, User
from app.schemas import DecisionCreate, DecisionOut

router = APIRouter(prefix="/projects/{project_id}/decisions", tags=["decisions"])


@router.get("", response_model=list[DecisionOut])
def list_decisions(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Decision]:
    require_project_access(project_id, user, db)
    return db.query(Decision).filter(Decision.project_id == project_id).all()


@router.post("", response_model=DecisionOut)
def create_decision(
    project_id: int,
    payload: DecisionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Decision:
    require_project_access(project_id, user, db)

    decision = Decision(
        project_id=project_id,
        code=f"D-{db.query(Decision).filter(Decision.project_id == project_id).count() + 1:03d}",
        title=payload.title,
        description=payload.description,
        requested_by=payload.requested_by,
        owner_id=payload.owner_id,
        required_date=payload.required_date,
        decision_date=payload.decision_date,
        status=payload.status,
        decision_text=payload.decision_text,
        comments=payload.comments,
        schedule_impact_days=payload.schedule_impact_days,
        cost_impact=payload.cost_impact,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    project_id: int,
    decision_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Decision:
    require_project_access(project_id, user, db)
    decision = db.query(Decision).filter(Decision.id == decision_id, Decision.project_id == project_id).first()
    if decision is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")
    return decision
