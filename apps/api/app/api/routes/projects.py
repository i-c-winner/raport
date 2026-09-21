from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import Organization, Project, ProjectMember, User
from app.schemas import ProjectCreate, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Project]:
    if user.role == "admin":
        return db.query(Project).all()

    project_ids = [
        row.project_id for row in db.query(ProjectMember.project_id).filter(ProjectMember.user_id == user.id).all()
    ]
    return db.query(Project).filter(Project.id.in_(project_ids)).all()


@router.post("", response_model=ProjectOut)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    if user.organization_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not attached to an organization")

    organization = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    project = Project(
        organization_id=user.organization_id,
        code=payload.code,
        name=payload.name,
        description=payload.description,
        location=payload.location,
        client_name=payload.client_name,
        status=payload.status,
        currency=payload.currency,
        start_date=payload.start_date,
        baseline_finish_date=payload.baseline_finish_date,
        current_finish_date=payload.current_finish_date,
        forecast_finish_date=payload.forecast_finish_date,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    membership = ProjectMember(project_id=project.id, user_id=user.id, role="project_manager")
    db.add(membership)
    db.commit()
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    require_project_access(project_id, user, db)
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
