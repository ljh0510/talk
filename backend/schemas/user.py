from pydantic import BaseModel, Field, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(...)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    nickname: str = Field(..., min_length=2, max_length=50)
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None
    workspace: Optional[str] = None
    workspace_code: Optional[str] = None
    workspace_domain: Optional[str] = None
    workspace_logo: Optional[str] = None
    zioyou_company_code: Optional[str] = None
    member_type: Optional[str] = None
    member_status: Optional[str] = None
    department: Optional[str] = None
    department_code: Optional[str] = None
    department_sort_order: Optional[int] = None
    department_manager_id: Optional[int] = None
    position: Optional[str] = None
    position_code: Optional[str] = None
    position_sort_order: Optional[int] = None
    duty: Optional[str] = None
    duty_code: Optional[str] = None
    duty_sort_order: Optional[int] = None
    phone_number: Optional[str] = None
    office_phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr = Field(...)
    password: str

class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=50)
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None
    workspace: Optional[str] = None
    workspace_code: Optional[str] = None
    workspace_domain: Optional[str] = None
    workspace_logo: Optional[str] = None
    zioyou_company_code: Optional[str] = None
    member_type: Optional[str] = None
    member_status: Optional[str] = None
    department: Optional[str] = None
    department_code: Optional[str] = None
    department_sort_order: Optional[int] = None
    department_manager_id: Optional[int] = None
    position: Optional[str] = None
    position_code: Optional[str] = None
    position_sort_order: Optional[int] = None
    duty: Optional[str] = None
    duty_code: Optional[str] = None
    duty_sort_order: Optional[int] = None
    phone_number: Optional[str] = None
    office_phone: Optional[str] = None

# Structured representations for enterprise memberships
class PositionResponse(BaseModel):
    name: str
    code: str
    sort_order: int
    model_config = ConfigDict(from_attributes=True)

class DutyResponse(BaseModel):
    name: str
    code: str
    sort_order: int
    model_config = ConfigDict(from_attributes=True)

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    sort_order: int
    manager_id: Optional[int] = None
    position: Optional[PositionResponse] = None
    duty: Optional[DutyResponse] = None
    model_config = ConfigDict(from_attributes=True)

class WorkspaceMembershipResponse(BaseModel):
    workspace_id: int
    workspace_name: str
    workspace_code: str
    workspace_domain: Optional[str] = None
    workspace_logo: Optional[str] = None
    zioyou_company_code: Optional[str] = None
    member_type: str
    status: str
    nickname: str
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None
    phone_number: Optional[str] = None
    office_phone: Optional[str] = None
    is_representative: bool
    department: Optional[DepartmentResponse] = None
    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    memberships: List[WorkspaceMembershipResponse] = []
    active_membership: Optional[WorkspaceMembershipResponse] = None
    model_config = ConfigDict(from_attributes=True)

class MemberAdd(BaseModel):
    member_email: EmailStr = Field(...)

class MemberRelationResponse(BaseModel):
    member_id: int
    member: UserResponse
    model_config = ConfigDict(from_attributes=True)
