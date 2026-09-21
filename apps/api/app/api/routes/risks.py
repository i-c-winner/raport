from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Issue, Risk, RiskChange, User
from app.schemas import RiskChangeCreate, RiskChangeOut, RiskCreate, RiskOut, RiskUpdate

router = APIRouter(prefix="/projects/{project_id}/risks", tags=["risks"])


def _generate_issue_code(project_id: int, db: Session) -> str:
    count = db.query(Issue).filter(Issue.project_id == project_id).count()
    return f"I-{count + 1:03d}"


def _ensure_occurred_issue(project_id: int, risk: Risk, db: Session, user: User) -> None:
    if risk.status != "occurred":
        return

    issue_title = f"{risk.code}: {risk.title}"
    existing = (
        db.query(Issue)
        .filter(Issue.project_id == project_id, Issue.title == issue_title)
        .first()
    )
    if existing is not None:
        return

    severity = "high" if risk.impact_level in {"high", "critical"} else "medium"
    priority = "high" if risk.rating in {"high", "critical"} else "medium"

    issue = Issue(
        project_id=project_id,
        code=_generate_issue_code(project_id, db),
        title=issue_title,
        description=risk.description or "Автоматически создано после фиксации статуса риска 'occurred'.",
        category=risk.category or "risk",
        priority=priority,
        severity=severity,
        schedule_impact_days=risk.schedule_impact_days,
        cost_impact=risk.cost_impact,
        owner_id=risk.owner_id,
        action_required=risk.response_strategy or "Решение по риску требуется немедленно.",
        status="open",
        identified_at=risk.identified_at or date.today(),
        due_date=risk.due_date,
        created_by=user.id,
    )
    db.add(issue)


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


@router.get("/{risk_id}/changes", response_model=list[RiskChangeOut])
def list_risk_changes(
    project_id: int,
    risk_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[RiskChange]:
    require_project_access(project_id, user, db)
    risk = db.query(Risk).filter(Risk.id == risk_id, Risk.project_id == project_id).first()
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
    return db.query(RiskChange).filter(RiskChange.risk_id == risk.id).order_by(RiskChange.created_at.desc()).all()


@router.post("/{risk_id}/changes", response_model=RiskChangeOut)
def create_risk_change(
    project_id: int,
    risk_id: int,
    payload: RiskChangeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RiskChange:
    require_project_access(project_id, user, db)
    risk = db.query(Risk).filter(Risk.id == risk_id, Risk.project_id == project_id).first()
    if risk is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")

    current_value = getattr(risk, payload.field_name, None)
    if payload.new_value is not None and current_value == payload.new_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Risk value unchanged")

    change = RiskChange(
        risk_id=risk.id,
        field_name=payload.field_name,
        old_value=payload.old_value,
        new_value=payload.new_value,
        comment=payload.comment,
        changed_by=user.id,
    )
    db.add(change)
    db.commit()
    db.refresh(change)
    return change


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

    changes: list[tuple[str, object, object]] = []
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        old_value = getattr(risk, field)
        if old_value != value:
            changes.append((field, old_value, value))
            setattr(risk, field, value)

    if changes:
        for field_name, old_value, new_value in changes:
            db.add(
                RiskChange(
                    risk_id=risk.id,
                    field_name=field_name,
                    old_value=str(old_value) if old_value is not None else None,
                    new_value=str(new_value) if new_value is not None else None,
                    comment=f"Изменение поля '{field_name}'",
                    changed_by=user.id,
                )
            )

    db.commit()
    db.refresh(risk)

    _ensure_occurred_issue(project_id, risk, db, user)
    db.commit()
    db.refresh(risk)
    return risk
