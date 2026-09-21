from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import EntityLink, User
from app.schemas import EntityLinkOut, LinkCreate

router = APIRouter(prefix="/projects/{project_id}/entities", tags=["entities"])


@router.get("/{entity_type}/{entity_id}/links", response_model=list[EntityLinkOut])
def get_entity_links(
    project_id: int,
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[EntityLink]:
    require_project_access(project_id, user, db)
    return db.query(EntityLink).filter(
        EntityLink.project_id == project_id,
        ((EntityLink.source_type == entity_type) & (EntityLink.source_id == entity_id)) |
        ((EntityLink.target_type == entity_type) & (EntityLink.target_id == entity_id))
    ).all()


@router.post("/{entity_type}/{entity_id}/links", response_model=EntityLinkOut)
def create_entity_link(
    project_id: int,
    entity_type: str,
    entity_id: int,
    payload: LinkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EntityLink:
    require_project_access(project_id, user, db)

    link = EntityLink(
        project_id=project_id,
        source_type=payload.source_type or entity_type,
        source_id=payload.source_id or entity_id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        relation_type=payload.relation_type or "related_to",
        created_by=user.id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link
