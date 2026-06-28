from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from models import User
from schemas import MemberRelationResponse, MemberAdd
from routers.users import map_user_to_response
import crud

router = APIRouter(prefix="/members", tags=["members"])

@router.get("", response_model=List[MemberRelationResponse])
async def list_members(
    workspace_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_ws_id = workspace_id or current_user.workspace_id
    if not target_ws_id:
        return []
        
    relations = await crud.get_member_relations_list(db, current_user.id, target_ws_id)
    
    response = []
    for r in relations:
        response.append({
            "member_id": r.member_id,
            "member": map_user_to_response(r.member)
        })
    return response


@router.post("", response_model=MemberRelationResponse)
async def add_member_relation(
    member_add: MemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if member_add.member_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a member"
        )
        
    target_ws_id = current_user.workspace_id
    if not target_ws_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자가 현재 소속된 활성 워크스페이스가 존재하지 않습니다."
        )
        
    relation_record, err = await crud.add_member_relation(db, current_user.id, member_add.member_email, target_ws_id)
    if err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err
        )
        
    return {
        "member_id": relation_record.member_id,
        "member": map_user_to_response(relation_record.member)
    }
