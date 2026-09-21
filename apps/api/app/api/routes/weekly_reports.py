from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_project_access
from app.db.models import User, WeeklyReport, WeeklyReportSnapshot
from app.schemas import WeeklyReportCreate, WeeklyReportOut

router = APIRouter(prefix="/projects/{project_id}/weekly-reports", tags=["weekly-reports"])


@router.get("", response_model=list[WeeklyReportOut])
def list_weekly_reports(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[WeeklyReport]:
    require_project_access(project_id, user, db)
    return db.query(WeeklyReport).filter(WeeklyReport.project_id == project_id).all()


@router.post("", response_model=WeeklyReportOut)
def create_weekly_report(
    project_id: int,
    payload: WeeklyReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WeeklyReport:
    require_project_access(project_id, user, db)

    weekly_report = WeeklyReport(
        project_id=project_id,
        reporting_date=payload.reporting_date,
        executive_summary=payload.executive_summary,
        key_achievements=payload.key_achievements,
        next_week_activities=payload.next_week_activities,
        management_comments=payload.management_comments,
        status="draft",
        created_by=user.id,
    )
    db.add(weekly_report)
    db.commit()
    db.refresh(weekly_report)
    return weekly_report


@router.post("/{report_id}/publish", response_model=WeeklyReportOut)
def publish_weekly_report(
    project_id: int,
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WeeklyReport:
    require_project_access(project_id, user, db)

    report = db.query(WeeklyReport).filter(WeeklyReport.id == report_id, WeeklyReport.project_id == project_id).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly report not found")

    report.status = "published"
    report.published_at = datetime.utcnow()

    snapshot = {
        "project_id": project_id,
        "reporting_date": str(report.reporting_date),
        "status": report.status,
        "executive_summary": report.executive_summary,
        "key_achievements": report.key_achievements,
        "next_week_activities": report.next_week_activities,
        "management_comments": report.management_comments,
    }

    db.add(WeeklyReportSnapshot(weekly_report_id=report.id, snapshot_json=str(snapshot)))
    db.commit()
    db.refresh(report)
    return report
