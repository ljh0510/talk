from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
import models
import schemas
from core.security import get_password_hash

# ==========================================
# Organization structure Master mapping helpers
# ==========================================
async def get_or_create_workspace(db: AsyncSession, code: str, name: str, domain: str | None = None, logo_image_url: str | None = None, zioyou_company_code: str | None = None, owner_id: int | None = None) -> int:
    res = await db.execute(select(models.Workspace).where(models.Workspace.code == code))
    workspace = res.scalars().first()
    if not workspace:
        workspace = models.Workspace(code=code, name=name, domain=domain, logo_image_url=logo_image_url, zioyou_company_code=zioyou_company_code, owner_id=owner_id)
        db.add(workspace)
        await db.flush()
    else:
        changed = False
        if workspace.name != name:
            workspace.name = name
            changed = True
        if workspace.domain != domain:
            workspace.domain = domain
            changed = True
        if workspace.logo_image_url != logo_image_url:
            workspace.logo_image_url = logo_image_url
            changed = True
        if workspace.zioyou_company_code != zioyou_company_code:
            workspace.zioyou_company_code = zioyou_company_code
            changed = True
        if owner_id is not None and workspace.owner_id != owner_id:
            workspace.owner_id = owner_id
            changed = True
        if changed:
            await db.flush()
    return workspace.id

async def get_or_create_department(db: AsyncSession, code: str, name: str, workspace_id: int, sort_order: int = 0, manager_id: int | None = None) -> int:
    res = await db.execute(
        select(models.Department).where(
            and_(
                models.Department.code == code,
                models.Department.workspace_id == workspace_id
            )
        )
    )
    dept = res.scalars().first()
    if not dept:
        dept = models.Department(code=code, name=name, workspace_id=workspace_id, sort_order=sort_order, manager_id=manager_id)
        db.add(dept)
        await db.flush()
    else:
        changed = False
        if dept.name != name:
            dept.name = name
            changed = True
        if dept.sort_order != sort_order:
            dept.sort_order = sort_order
            changed = True
        if dept.manager_id != manager_id:
            dept.manager_id = manager_id
            changed = True
        if changed:
            await db.flush()
    return dept.id

async def get_or_create_position(db: AsyncSession, code: str, name: str, workspace_id: int, sort_order: int = 0) -> int:
    res = await db.execute(
        select(models.Position).where(
            and_(
                models.Position.workspace_id == workspace_id,
                models.Position.code == code
            )
        )
    )
    pos = res.scalars().first()
    if not pos:
        pos = models.Position(workspace_id=workspace_id, code=code, name=name, sort_order=sort_order)
        db.add(pos)
        await db.flush()
    else:
        changed = False
        if pos.name != name:
            pos.name = name
            changed = True
        if pos.sort_order != sort_order:
            pos.sort_order = sort_order
            changed = True
        if changed:
            await db.flush()
    return pos.id

async def get_or_create_duty(db: AsyncSession, code: str, name: str, workspace_id: int, sort_order: int = 0) -> int:
    res = await db.execute(
        select(models.Duty).where(
            and_(
                models.Duty.workspace_id == workspace_id,
                models.Duty.code == code
            )
        )
    )
    duty = res.scalars().first()
    if not duty:
        duty = models.Duty(workspace_id=workspace_id, code=code, name=name, sort_order=sort_order)
        db.add(duty)
        await db.flush()
    else:
        changed = False
        if duty.name != name:
            duty.name = name
            changed = True
        if duty.sort_order != sort_order:
            duty.sort_order = sort_order
            changed = True
        if changed:
            await db.flush()
    return duty.id


# ==========================================
# CRUD Operations
# ==========================================
async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(
        select(models.User)
        .options(
            joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
            joinedload(models.User.department_memberships)
                .joinedload(models.DepartmentMember.department)
                .joinedload(models.Department.manager),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
        )
        .where(models.User.username == username)
    )
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(
        select(models.User)
        .options(
            joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
            joinedload(models.User.department_memberships)
                .joinedload(models.DepartmentMember.department)
                .joinedload(models.Department.manager),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
        )
        .where(models.User.email == email)
    )
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: schemas.UserCreate):
    hashed_pw = get_password_hash(user_in.password)
    
    workspace_id = None
    department_id = None
    position_id = None
    duty_id = None
    
    # 1. Resolve workspace (with optional domain, logo, and zioyou_company_code mapping)
    if user_in.workspace:
        wk_code = user_in.workspace_code or f"WKSP-{user_in.workspace.replace(' ', '').upper()}"
        workspace_id = await get_or_create_workspace(db, wk_code, user_in.workspace, user_in.workspace_domain, user_in.workspace_logo, user_in.zioyou_company_code)
            
        # 2. Resolve department
        if user_in.department:
            dept_code = user_in.department_code or f"DEPT-{user_in.department.replace(' ', '').upper()}"
            dept_sort = user_in.department_sort_order if user_in.department_sort_order is not None else 0
            dept_mgr = user_in.department_manager_id
            department_id = await get_or_create_department(db, dept_code, user_in.department, workspace_id, dept_sort, dept_mgr)
            
        # 3. Resolve Position/Duty (Bound under workspace_id scope)
        if user_in.position:
            pos_code = user_in.position_code or f"POS-{user_in.position.replace(' ', '').upper()}"
            pos_sort = user_in.position_sort_order if user_in.position_sort_order is not None else 0
            position_id = await get_or_create_position(db, pos_code, user_in.position, workspace_id, pos_sort)
            
        if user_in.duty:
            dt_code = user_in.duty_code or f"DUTY-{user_in.duty.replace(' ', '').upper()}"
            dt_sort = user_in.duty_sort_order if user_in.duty_sort_order is not None else 0
            duty_id = await get_or_create_duty(db, dt_code, user_in.duty, workspace_id, dt_sort)
        
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pw,
    )
    db.add(db_user)
    await db.flush()  # Generate db_user.id
    
    # 3. Create Workspace Membership (is_representative defaults to True on representative registration init)
    if workspace_id:
        wk_member = models.WorkspaceMember(
            workspace_id=workspace_id,
            user_id=db_user.id,
            is_representative=True,
            member_type=user_in.member_type or "REGULAR",
            status=user_in.member_status or "ACTIVE",
            nickname=user_in.nickname,
            profile_image_url=user_in.profile_image_url,
            status_message=user_in.status_message,
            phone_number=user_in.phone_number,
            office_phone=user_in.office_phone,
            birthday=user_in.birthday,
            birthday_type=user_in.birthday_type
        )
        db.add(wk_member)
        await db.flush()
    
    # 4. Create Department Membership relations
    if department_id:
        member_rel = models.DepartmentMember(
            department_id=department_id,
            user_id=db_user.id,
            is_representative=True,
            position_id=position_id,
            duty_id=duty_id
        )
        db.add(member_rel)
        await db.flush()
        
    await db.commit()
    
    # Re-fetch with eager loaded relations
    return await get_user_by_id(db, db_user.id)


async def get_users_list(db: AsyncSession, exclude_user_id: int):
    result = await db.execute(
        select(models.User)
        .options(
            joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
            joinedload(models.User.department_memberships)
                .joinedload(models.DepartmentMember.department)
                .joinedload(models.Department.manager),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
        )
        .where(models.User.id != exclude_user_id)
    )
    users = result.scalars().unique().all()
    
    def get_user_sort_key(u):
        rep = next((m for m in u.workspace_memberships if m.is_representative), None)
        if not rep and u.workspace_memberships:
            rep = u.workspace_memberships[0]
        return rep.nickname if rep else u.username
        
    users.sort(key=get_user_sort_key)
    return users


async def get_member_relations_list(db: AsyncSession, user_id: int, workspace_id: int):
    # Bidirectional query gets entries for this specific user
    result = await db.execute(
        select(models.MemberRelation)
        .options(
            joinedload(models.MemberRelation.member).options(
                joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
                joinedload(models.User.department_memberships)
                    .joinedload(models.DepartmentMember.department)
                    .joinedload(models.Department.manager),
                joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
                joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
            )
        )
        .where(
            and_(
                models.MemberRelation.user_id == user_id,
                models.MemberRelation.workspace_id == workspace_id
            )
        )
    )
    return result.scalars().unique().all()


async def add_member_relation(db: AsyncSession, user_id: int, member_email: str, workspace_id: int):
    member_user = await get_user_by_email(db, member_email)
    if not member_user:
        return None, "존재하지 않는 사용자입니다."
    if member_user.id == user_id:
        return None, "자기 자신은 멤버로 추가할 수 없습니다."
        
    # Check if friend is a member of the workspace
    res_member = await db.execute(
        select(models.WorkspaceMember).where(
            and_(
                models.WorkspaceMember.workspace_id == workspace_id,
                models.WorkspaceMember.user_id == member_user.id
            )
        )
    )
    if not res_member.scalars().first():
        return None, "해당 워크스페이스에 참여하지 않은 사용자입니다."
        
    stmt = select(models.MemberRelation).where(
        and_(
            models.MemberRelation.workspace_id == workspace_id,
            models.MemberRelation.user_id == user_id,
            models.MemberRelation.member_id == member_user.id
        )
    )
    existing_result = await db.execute(stmt)
    existing = existing_result.scalars().first()
    if existing:
        return None, "이미 멤버로 추가된 사용자입니다."
            
    # Insert bidirectional records (2 entries)
    db_member_relation_1 = models.MemberRelation(
        workspace_id=workspace_id,
        user_id=user_id,
        member_id=member_user.id
    )
    db_member_relation_2 = models.MemberRelation(
        workspace_id=workspace_id,
        user_id=member_user.id,
        member_id=user_id
    )
    db.add_all([db_member_relation_1, db_member_relation_2])
    await db.commit()
    
    stmt_reload = select(models.MemberRelation).options(
        joinedload(models.MemberRelation.member).options(
            joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
            joinedload(models.User.department_memberships)
                .joinedload(models.DepartmentMember.department)
                .joinedload(models.Department.manager),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
        )
    ).where(
        and_(
            models.MemberRelation.workspace_id == workspace_id,
            models.MemberRelation.user_id == user_id,
            models.MemberRelation.member_id == member_user.id
        )
    )
    reload_res = await db.execute(stmt_reload)
    return reload_res.scalars().first(), None


async def update_user_profile(db: AsyncSession, user_id: int, user_update: schemas.UserUpdate):
    stmt = select(models.User).where(models.User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        # Resolve representative WorkspaceMember to update profiles inside workspace scope
        rep_member = next((m for m in user.workspace_memberships if m.is_representative), None)
        if not rep_member and user.workspace_memberships:
            rep_member = user.workspace_memberships[0]
            
        if rep_member:
            if user_update.nickname is not None:
                rep_member.nickname = user_update.nickname
            if user_update.status_message is not None:
                rep_member.status_message = user_update.status_message
            if user_update.profile_image_url is not None:
                rep_member.profile_image_url = user_update.profile_image_url
            if user_update.phone_number is not None:
                rep_member.phone_number = user_update.phone_number
            if user_update.office_phone is not None:
                rep_member.office_phone = user_update.office_phone
            if user_update.birthday is not None:
                rep_member.birthday = user_update.birthday
            if user_update.birthday_type is not None:
                rep_member.birthday_type = user_update.birthday_type
            await db.flush()
            
        # Resolve dynamic Master Keys if updated (with sort order support)
        if user_update.workspace is not None:
            if user_update.workspace:
                wk_code = user_update.workspace_code or f"WKSP-{user_update.workspace.replace(' ', '').upper()}"
                workspace_id = await get_or_create_workspace(db, wk_code, user_update.workspace, user_update.workspace_domain, user_update.workspace_logo, user_update.zioyou_company_code)
                
                # Eagerly update workspace memberships
                stmt_del = select(models.WorkspaceMember).where(models.WorkspaceMember.user_id == user.id)
                res_del = await db.execute(stmt_del)
                for m in res_del.scalars().all():
                    await db.delete(m)
                await db.flush()
                
                # Manual profile migration during dynamic workspace recreation
                wk_member = models.WorkspaceMember(
                    workspace_id=workspace_id,
                    user_id=user.id,
                    is_representative=True,
                    member_type=user_update.member_type or "REGULAR",
                    status=user_update.member_status or "ACTIVE",
                    nickname=user_update.nickname or user.username,
                    profile_image_url=user_update.profile_image_url,
                    status_message=user_update.status_message,
                    phone_number=user_update.phone_number or (rep_member.phone_number if rep_member else None),
                    office_phone=user_update.office_phone or (rep_member.office_phone if rep_member else None),
                    birthday=user_update.birthday or (rep_member.birthday if rep_member else None),
                    birthday_type=user_update.birthday_type or (rep_member.birthday_type if rep_member else None)
                )
                db.add(wk_member)
                await db.flush()
            else:
                # Remove workspace memberships
                stmt_del = select(models.WorkspaceMember).where(models.WorkspaceMember.user_id == user.id)
                res_del = await db.execute(stmt_del)
                for m in res_del.scalars().all():
                    await db.delete(m)
                await db.flush()
                
        elif user_update.member_type is not None or user_update.member_status is not None:
            if rep_member:
                if user_update.member_type is not None:
                    rep_member.member_type = user_update.member_type
                if user_update.member_status is not None:
                    rep_member.status = user_update.member_status
                await db.flush()
                
        if user_update.department is not None:
            # We need workspace_id to resolve department
            wk_id = user.workspace_id
            if user_update.department and wk_id:
                dept_code = user_update.department_code or f"DEPT-{user_update.department.replace(' ', '').upper()}"
                dept_sort = user_update.department_sort_order if user_update.department_sort_order is not None else 0
                dept_mgr = user_update.department_manager_id
                department_id = await get_or_create_department(db, dept_code, user_update.department, wk_id, dept_sort, dept_mgr)
                
                # Fetch/Create position & duty for this assignment (Scoped under wk_id)
                position_id = None
                duty_id = None
                if user_update.position:
                    pos_code = user_update.position_code or f"POS-{user_update.position.replace(' ', '').upper()}"
                    pos_sort = user_update.position_sort_order if user_update.position_sort_order is not None else 0
                    position_id = await get_or_create_position(db, pos_code, user_update.position, wk_id, pos_sort)
                if user_update.duty:
                    dt_code = user_update.duty_code or f"DUTY-{user_update.duty.replace(' ', '').upper()}"
                    dt_sort = user_update.duty_sort_order if user_update.duty_sort_order is not None else 0
                    duty_id = await get_or_create_duty(db, dt_code, user_update.duty, wk_id, dt_sort)
                
                # Eagerly update department membership mappings
                stmt_del = select(models.DepartmentMember).where(models.DepartmentMember.user_id == user.id)
                res_del = await db.execute(stmt_del)
                for m in res_del.scalars().all():
                    await db.delete(m)
                await db.flush()
                
                member_rel = models.DepartmentMember(
                    department_id=department_id,
                    user_id=user.id,
                    is_representative=True,
                    position_id=position_id,
                    duty_id=duty_id
                )
                db.add(member_rel)
                await db.flush()
            else:
                # Remove memberships if department is cleared
                stmt_del = select(models.DepartmentMember).where(models.DepartmentMember.user_id == user.id)
                res_del = await db.execute(stmt_del)
                for m in res_del.scalars().all():
                    await db.delete(m)
                await db.flush()
                
        else:
            # If department itself did not change, but position or duty did
            rep_dept = next((m for m in user.department_memberships if m.is_representative), None)
            if not rep_dept and user.department_memberships:
                rep_dept = user.department_memberships[0]
            if rep_dept:
                wk_id = user.workspace_id
                if wk_id:
                    if user_update.position is not None:
                        if user_update.position:
                            pos_code = user_update.position_code or f"POS-{user_update.position.replace(' ', '').upper()}"
                            pos_sort = user_update.position_sort_order if user_update.position_sort_order is not None else 0
                            rep_dept.position_id = await get_or_create_position(db, pos_code, user_update.position, wk_id, pos_sort)
                        else:
                            rep_dept.position_id = None
                    if user_update.duty is not None:
                        if user_update.duty:
                            dt_code = user_update.duty_code or f"DUTY-{user_update.duty.replace(' ', '').upper()}"
                            dt_sort = user_update.duty_sort_order if user_update.duty_sort_order is not None else 0
                            rep_dept.duty_id = await get_or_create_duty(db, dt_code, user_update.duty, wk_id, dt_sort)
                        else:
                            rep_dept.duty_id = None
                    await db.flush()
                
        await db.commit()
        return await get_user_by_id(db, user_id)
    return None


async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.User)
        .options(
            joinedload(models.User.workspace_memberships).joinedload(models.WorkspaceMember.workspace),
            joinedload(models.User.department_memberships)
                .joinedload(models.DepartmentMember.department)
                .joinedload(models.Department.manager),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.position),
            joinedload(models.User.department_memberships).joinedload(models.DepartmentMember.duty)
        )
        .where(models.User.id == user_id)
    )
    return result.scalars().first()
