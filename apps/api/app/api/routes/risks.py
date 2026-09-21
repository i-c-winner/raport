from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Risk, User
from app.schemas import RiskCreate, RiskOut, RiskUpdate

router = APIRouter(prefix="/projects/{project_id}/risks", tags=["risks"])


@router.get("", response_model=list[RiskOut])
def list_risks(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Risk]:
    require_project_access(project_id, user, db)
    return db.query(Risk).filter(Risk.project_id == project_id).all()


@router.post("", response_model=RiskOut)
def create_risk(
    project_id: int,
    payload: RiskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Risk:
    require_project_access(project_id, user, db)
    risk = Risk(
        project_id=project_id,
        code=f"R-{db.query(Risk).filter(Risk.project_id == project_id).count() + 1:03d}",
        title=payload.title,
        description=payload.description,
        category=payload.category,
        probability=payload.probability,
        impact_level=payload.impact_level,
        rating=payload.rating,
        schedule_impact_days=payload.schedule_impact_days,
        cost_impact=payload.cost_impact,
        owner_id=payload.owner_id,
        response_strategy=payload.response_strategy,
        mitigation=payload.mitigation,
        status=payload.status,
        identified_at=payload.identified_at,
        due_date=payload.due_date,
        closed_at=payload.closed_at,
        created_by=user.id,
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk


@router.get("/{risk_id}", response_model=RiskOut)
def get_risk(
    project_id: int,
    risk_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Risk:
    require_project_access(project_id, user, db)
    risk = db.query(Risk).filter(Risk.id == risk_id, Risk.project_id == project_id).first()
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
    return risk


@router.patch("/{risk_id}", response_model=RiskOut)
def update_risk(
    project_id: int,
    risk_id: int,
    payload: RiskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Risk:
    require_project_access(project_id, user, db)
    risk = db.query(Risk).filter(Risk.id == risk_id, Risk.project_id == project_id).first()
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(risk, field, value)

    db.commit()
    db.refresh(risk)
    return risk
