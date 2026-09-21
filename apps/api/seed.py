from datetime import date

from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.db.models import Organization, Project, ProjectMember, Risk, Issue, Decision, Change, User
from app.core.security import hash_password


def seed_demo_data() -> None:
    db: Session = SessionLocal()

    org = db.query(Organization).filter_by(slug="tashkent-logistics-center").first()
    if org is None:
        org = Organization(name="Tashkent Logistics Center", slug="tashkent-logistics-center")
        db.add(org)
        db.commit()
        db.refresh(org)

    user = db.query(User).filter_by(email="pm@projectcontrol.local").first()
    if user is None:
        user = User(
            email="pm@projectcontrol.local",
            full_name="Project Manager",
            password_hash=hash_password("password123"),
            role="project_manager",
            organization_id=org.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    project = db.query(Project).filter_by(code="TLC-01").first()
    if project is None:
        project = Project(
            organization_id=org.id,
            code="TLC-01",
            name="Tashkent Logistics Center",
            description="Demo construction project",
            location="Tashkent",
            client_name="City Logistics Group",
            project_manager_id=user.id,
            status="active",
            start_date=date(2026, 1, 10),
            baseline_finish_date=date(2027, 1, 15),
            current_finish_date=date(2027, 2, 5),
            forecast_finish_date=date(2027, 2, 10),
            currency="USD",
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    member = db.query(ProjectMember).filter_by(project_id=project.id, user_id=user.id).first()
    if member is None:
        db.add(ProjectMember(project_id=project.id, user_id=user.id, role="project_manager"))

    if not db.query(Risk).filter_by(project_id=project.id, code="R-021").first():
        db.add(Risk(
            project_id=project.id,
            code="R-021",
            title="Electrical capacity risk",
            description="Insufficient electrical capacity could delay commissioning.",
            category="Technical",
            probability="high",
            impact_level="critical",
            rating="critical",
            schedule_impact_days=45,
            cost_impact=400000,
            owner_id=user.id,
            response_strategy="mitigate",
            mitigation="Install additional transformer station.",
            status="occurred",
            identified_at=date(2026, 9, 12),
            due_date=date(2026, 9, 30),
            created_by=user.id,
        ))

    if not db.query(Issue).filter_by(project_id=project.id, code="I-014").first():
        db.add(Issue(
            project_id=project.id,
            code="I-014",
            title="Insufficient electrical capacity confirmed",
            description="The site load analysis confirmed the existing capacity is insufficient.",
            category="Technical",
            priority="high",
            severity="critical",
            schedule_impact_days=45,
            cost_impact=400000,
            owner_id=user.id,
            action_required="Select and approve electrical solution.",
            status="open",
            identified_at=date(2026, 9, 15),
            due_date=date(2026, 9, 25),
            created_by=user.id,
        ))

    if not db.query(Decision).filter_by(project_id=project.id, code="D-032").first():
        db.add(Decision(
            project_id=project.id,
            code="D-032",
            title="Select electrical supply solution",
            description="Approve transformer station upgrade and revised power distribution design.",
            requested_by=user.id,
            owner_id=user.id,
            required_date=date(2026, 9, 26),
            decision_date=date(2026, 9, 27),
            status="approved",
            decision_text="Proceed with additional transformer station and revised electrical supply strategy.",
            schedule_impact_days=45,
            cost_impact=400000,
        ))

    if not db.query(Change).filter_by(project_id=project.id, code="CH-011").first():
        db.add(Change(
            project_id=project.id,
            code="CH-011",
            title="Additional transformer station",
            description="Change request for transformer station required to satisfy electrical capacity.",
            reason="Electrical capacity shortfall",
            requested_by=user.id,
            owner_id=user.id,
            status="approved",
            schedule_impact_days=45,
            cost_impact=400000,
            requested_at=date(2026, 9, 18),
            required_date=date(2026, 9, 27),
            approved_at=date(2026, 9, 27),
        ))

    db.commit()
    print("Demo data seeded successfully")


if __name__ == "__main__":
    seed_demo_data()
