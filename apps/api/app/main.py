from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.changes import router as changes_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.decisions import router as decisions_router
from app.api.routes.entities import router as entities_router
from app.api.routes.issues import router as issues_router
from app.api.routes.milestones import router as milestones_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.projects import router as projects_router
from app.api.routes.risks import router as risks_router
from app.api.routes.weekly_reports import router as weekly_reports_router
from app.db.base import Base, engine
from seed import seed_demo_data

app = FastAPI(
    title="Project Control API",
    version="0.1.0",
    description="Project Controls MVP backend for construction project management.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_demo_data()


app.include_router(auth_router)
app.include_router(organizations_router)
app.include_router(projects_router)
app.include_router(risks_router)
app.include_router(issues_router)
app.include_router(decisions_router)
app.include_router(changes_router)
app.include_router(milestones_router)
app.include_router(dashboard_router)
app.include_router(weekly_reports_router)
app.include_router(entities_router)


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok", "service": "project-control-api"}


@app.get("/")
def root() -> dict:
    return {"message": "Project Control API"}
