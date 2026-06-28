from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from models import User
from schemas import UserResponse, UserUpdate
import crud

router = APIRouter(prefix="/users", tags=["users"])

def map_user_to_response(user: User) -> dict:
    if not user:
        return {}
    memberships_data = []
    active_mem = None
    
    for m in user.workspace_memberships:
        dept_mem = next((dm for dm in user.department_memberships if dm.department.workspace_id == m.workspace_id), None)
        
        dept_data = None
        if dept_mem:
            dept_data = {
                "id": dept_mem.department.id,
                "name": dept_mem.department.name,
                "code": dept_mem.department.code,
                "sort_order": dept_mem.department.sort_order,
                "manager_id": dept_mem.department.manager_id,
                "position": {
                    "name": dept_mem.position.name,
                    "code": dept_mem.position.code,
                    "sort_order": dept_mem.position.sort_order
                } if dept_mem.position else None,
                "duty": {
                    "name": dept_mem.duty.name,
                    "code": dept_mem.duty.code,
                    "sort_order": dept_mem.duty.sort_order
                } if dept_mem.duty else None
            }
            
        mem_item = {
            "workspace_id": m.workspace.id,
            "workspace_name": m.workspace.name,
            "workspace_code": m.workspace.code,
            "workspace_domain": m.workspace.domain,
            "workspace_logo": m.workspace.logo_image_url,
            "zioyou_company_code": m.workspace.zioyou_company_code,
            "member_type": m.member_type,
            "status": m.status,
            "nickname": m.nickname,
            "profile_image_url": m.profile_image_url,
            "status_message": m.status_message,
            "phone_number": m.phone_number,
            "office_phone": m.office_phone,
            "is_representative": m.is_representative,
            "department": dept_data
        }
        memberships_data.append(mem_item)
        if m.is_representative:
            active_mem = mem_item
            
    if not active_mem and memberships_data:
        active_mem = memberships_data[0]
        
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at,
        "memberships": memberships_data,
        "active_membership": active_mem
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Eagerly load relationship tables for mapping
    user = await crud.get_user_by_id(db, current_user.id)
    return map_user_to_response(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    updated_user = await crud.update_user_profile(db, current_user.id, user_in)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return map_user_to_response(updated_user)


@router.get("", response_model=List[UserResponse])
async def list_all_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    users = await crud.get_users_list(db, current_user.id)
    return [map_user_to_response(u) for u in users]
