from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "viewer"


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    organization_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrganizationBase(BaseModel):
    name: str
    slug: str


class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None
    status: str = "active"
    currency: str = "USD"
    start_date: Optional[date] = None
    baseline_finish_date: Optional[date] = None
    current_finish_date: Optional[date] = None
    forecast_finish_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    organization_id: int
    project_manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RiskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    probability: str = "medium"
    impact_level: str = "medium"
    rating: str = "medium"
    schedule_impact_days: Optional[int] = None
    cost_impact: Optional[Decimal] = None
    owner_id: Optional[int] = None
    response_strategy: Optional[str] = None
    mitigation: Optional[str] = None
    status: str = "open"
    identified_at: Optional[date] = None
    due_date: Optional[date] = None
    closed_at: Optional[date] = None


class RiskCreate(RiskBase):
    pass


class RiskUpdate(RiskBase):
    title: Optional[str] = None
    status: Optional[str] = None


class RiskOut(RiskBase):
    id: int
    project_id: int
    code: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RiskChangeBase(BaseModel):
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    comment: Optional[str] = None


class RiskChangeCreate(RiskChangeBase):
    pass


class RiskChangeOut(RiskChangeBase):
    id: int
    risk_id: int
    changed_by: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: str = "medium"
    severity: str = "medium"
    schedule_impact_days: Optional[int] = None
    cost_impact: Optional[Decimal] = None
    owner_id: Optional[int] = None
    action_required: Optional[str] = None
    status: str = "open"
    identified_at: Optional[date] = None
    due_date: Optional[date] = None
    resolved_at: Optional[date] = None


class IssueCreate(IssueBase):
    pass


class IssueOut(IssueBase):
    id: int
    project_id: int
    code: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DecisionBase(BaseModel):
    title: str
    description: Optional[str] = None
    requested_by: Optional[int] = None
    owner_id: Optional[int] = None
    required_date: Optional[date] = None
    decision_date: Optional[date] = None
    status: str = "pending"
    decision_text: Optional[str] = None
    comments: Optional[str] = None
    schedule_impact_days: Optional[int] = None
    cost_impact: Optional[Decimal] = None


class DecisionCreate(DecisionBase):
    pass


class DecisionOut(DecisionBase):
    id: int
    project_id: int
    code: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ChangeBase(BaseModel):
    title: str
    description: Optional[str] = None
    reason: Optional[str] = None
    requested_by: Optional[int] = None
    owner_id: Optional[int] = None
    status: str = "draft"
    schedule_impact_days: Optional[int] = None
    cost_impact: Optional[Decimal] = None
    requested_at: Optional[date] = None
    required_date: Optional[date] = None
    approved_at: Optional[date] = None


class ChangeCreate(ChangeBase):
    pass


class ChangeOut(ChangeBase):
    id: int
    project_id: int
    code: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    project_name: str
    status: str
    progress: int = 0
    schedule_status: str = "on_track"
    schedule_variance_days: int = 0
    open_risks: int = 0
    critical_issues: int = 0
    overdue_decisions: int = 0
    pending_changes: int = 0
    total_milestones: int = 0


class LinkCreate(BaseModel):
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relation_type: str


class EntityLinkOut(BaseModel):
    id: int
    project_id: int
    source_type: str
    source_id: int
    target_type: str
    target_id: int
    relation_type: str
    created_by: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MilestoneBase(BaseModel):
    code: Optional[str] = None
    title: str
    description: Optional[str] = None
    baseline_date: Optional[date] = None
    current_date: Optional[date] = None
    forecast_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: str = "planned"
    owner_id: Optional[int] = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(MilestoneBase):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    baseline_date: Optional[date] = None
    current_date: Optional[date] = None
    forecast_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None


class MilestoneOut(MilestoneBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class WeeklyReportCreate(BaseModel):
    reporting_date: date
    executive_summary: Optional[str] = None
    key_achievements: Optional[str] = None
    next_week_activities: Optional[str] = None
    management_comments: Optional[str] = None


class WeeklyReportOut(WeeklyReportCreate):
    id: int
    project_id: int
    status: str
    published_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str
