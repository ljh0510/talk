from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db
from models import User
from core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
        
    # Fetch with eager load relations (workspace_memberships) so we can validate workspace list
    # Use join query or get_user_by_id logic or just selectinload memberships
    import crud
    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
        
    # If client requested specific workspace via X-Workspace-ID header
    if x_workspace_id:
        try:
            target_ws_id = int(x_workspace_id)
            # Verify if user belongs to this workspace
            is_valid_membership = any(m.workspace_id == target_ws_id for m in user.workspace_memberships)
            if is_valid_membership:
                user.workspace_id = target_ws_id
            else:
                # Default to representative or first membership
                rep = next((m for m in user.workspace_memberships if m.is_representative), None)
                if not rep and user.workspace_memberships:
                    rep = user.workspace_memberships[0]
                user.workspace_id = rep.workspace_id if rep else None
        except ValueError:
            # Safe fallback
            rep = next((m for m in user.workspace_memberships if m.is_representative), None)
            if not rep and user.workspace_memberships:
                rep = user.workspace_memberships[0]
            user.workspace_id = rep.workspace_id if rep else None
    else:
        # Default fallback if header not provided
        rep = next((m for m in user.workspace_memberships if m.is_representative), None)
        if not rep and user.workspace_memberships:
            rep = user.workspace_memberships[0]
        user.workspace_id = rep.workspace_id if rep else None
        
    return user
