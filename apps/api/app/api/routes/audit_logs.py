from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/projects/{project_id}", tags=["audit"])


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AuditLog]:
    require_project_access(project_id, user, db)
    return (
        db.query(AuditLog)
        .filter(AuditLog.project_id == project_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
