import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, and_, text
from core.database import Base, engine, AsyncSessionLocal
import models
import crud
import schemas

async def seed_data():
    print("Initializing Database Schemas...")
    async with engine.begin() as conn:
        # Safe cascade drops for PostgreSQL to bypass schema locks
        for tbl in ["workspace_members", "department_members", "member_relations", "messages", "chat_room_members", "chat_rooms", "users", "departments", "workspaces", "positions", "duties"]:
            await conn.execute(text(f"DROP TABLE IF EXISTS {tbl} CASCADE"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database Schemas Initialized.")
    db = AsyncSessionLocal()
    
    try:
        # Create users
        print("Seeding Users...")
        u1 = schemas.UserCreate(
            username="hong",
            email="hong@zioyou.com",
            password="password",
            nickname="홍길동",
            profile_image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            status_message="오늘도 힘차게! 😊",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="ADMIN",
            member_status="ACTIVE",
            department="플랫폼 개발부/UI개발팀",
            department_code="DEPT-PLAT-UI",
            department_sort_order=4,
            position="대리",
            position_code="POS-ASST",
            position_sort_order=4,
            duty="풀스택 개발자",
            duty_code="DUTY-FULL",
            duty_sort_order=3
        )
        u2 = schemas.UserCreate(
            username="lee",
            email="lee@zioyou.com",
            password="password",
            nickname="이순신",
            profile_image_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            status_message="필사즉생 필생즉사",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="해상물류 지원실",
            department_code="DEPT-LOGI",
            department_sort_order=2,
            position="부장",
            position_code="POS-DIR",
            position_sort_order=2,
            duty="총괄 사령관",
            duty_code="DUTY-GEN",
            duty_sort_order=1
        )
        u3 = schemas.UserCreate(
            username="sejong",
            email="sejong@zioyou.com",
            password="password",
            nickname="세종대왕",
            profile_image_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
            status_message="랏트말싸미 듕귁에 달아...",
            workspace="한글문화재단",
            workspace_code="WKSP-HK",
            workspace_logo="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-HK",
            member_type="ADMIN",
            member_status="ACTIVE",
            department="언어문화연구소",
            department_code="DEPT-LANG",
            department_sort_order=1,
            position="이사장",
            position_code="POS-CHAIR",
            position_sort_order=1,
            duty="문화 콘텐츠 기획",
            duty_code="DUTY-DIR",
            duty_sort_order=1
        )
        u4 = schemas.UserCreate(
            username="kim",
            email="kim@zioyou.com",
            password="password",
            nickname="김유신",
            profile_image_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
            status_message="말과 함께 달린다 🐴",
            workspace="화랑 스포테인먼트",
            workspace_code="WKSP-WR",
            workspace_logo="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-WR",
            member_type="REGULAR",
            member_status="LEAVE",
            department="마사승마 사업부",
            department_code="DEPT-SPRT",
            department_sort_order=3,
            position="과장",
            position_code="POS-MGR",
            position_sort_order=3,
            duty="승마 훈련 코치",
            duty_code="DUTY-COACH",
            duty_sort_order=2
        )
        
        u5 = schemas.UserCreate(
            username="hwang",
            email="hwang@zioyou.com",
            password="password",
            nickname="황희",
            profile_image_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            status_message="정사를 돌보는 중... ⚖️",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="재무회계실",
            department_code="DEPT-FIN",
            department_sort_order=10,
            position="영의정",
            position_code="POS-PM",
            position_sort_order=1,
            duty="국정 감사 및 재무",
            duty_code="DUTY-FIN",
            duty_sort_order=10
        )
        
        u7 = schemas.UserCreate(
            username="ryu",
            email="ryu@zioyou.com",
            password="password",
            nickname="류성룡",
            profile_image_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
            status_message="나라의 기강을 바로세운다",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="인사조직부",
            department_code="DEPT-HR",
            department_sort_order=5,
            position="실장",
            position_code="POS-HDIR",
            position_sort_order=3,
            duty="인사 기획 및 노무",
            duty_code="DUTY-HR",
            duty_sort_order=5
        )

        u8 = schemas.UserCreate(
            username="jang",
            email="jang@zioyou.com",
            password="password",
            nickname="장영실",
            profile_image_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
            status_message="하늘의 별을 관측하는 시간 🌠",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="R&D 기술연구소/코어개발팀",
            department_code="DEPT-RD-CORE",
            department_sort_order=6,
            position="책임연구원",
            position_code="POS-PR",
            position_sort_order=2,
            duty="엔진 설계 개발",
            duty_code="DUTY-RD",
            duty_sort_order=6
        )

        u9 = schemas.UserCreate(
            username="heo",
            email="heo@zioyou.com",
            password="password",
            nickname="허준",
            profile_image_url="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&auto=format&fit=crop&q=80",
            status_message="사내 복지와 건강 예방 🩺",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="의무실/보건실",
            department_code="DEPT-MED",
            department_sort_order=7,
            position="원장",
            position_code="POS-MED",
            position_sort_order=4,
            duty="사내 헬스 케어",
            duty_code="DUTY-MED",
            duty_sort_order=7
        )

        u10 = schemas.UserCreate(
            username="nong",
            email="nong@zioyou.com",
            password="password",
            nickname="신농씨",
            profile_image_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
            status_message="약초 분석 중... 🌱",
            workspace="카카오 엔터프라이즈",
            workspace_code="WKSP-KE",
            workspace_logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-KE",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="의무실/보건실/약제개발팀",
            department_code="DEPT-MED-PHARM",
            department_sort_order=7,
            position="연구원",
            position_code="POS-MEDR",
            position_sort_order=5,
            duty="보건 약제 기획",
            duty_code="DUTY-MED",
            duty_sort_order=8
        )

        # User 6: Saimdang in WKSP-HK (Hangul Cultural Foundation)
        u6 = schemas.UserCreate(
            username="sin",
            email="sin@zioyou.com",
            password="password",
            nickname="신사임당",
            profile_image_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
            status_message="초충도를 그리는 시간 🎨",
            workspace="한글문화재단",
            workspace_code="WKSP-HK",
            workspace_logo="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&auto=format&fit=crop&q=80",
            zioyou_company_code="ZIO-HK",
            member_type="REGULAR",
            member_status="ACTIVE",
            department="문화예술학부",
            department_code="DEPT-ART",
            department_sort_order=5,
            position="수석연구원",
            position_code="POS-SR",
            position_sort_order=2,
            duty="한글 서체 미술 기획",
            duty_code="DUTY-ART",
            duty_sort_order=5
        )
        
        db_u1 = await crud.create_user(db, u1)
        db_u2 = await crud.create_user(db, u2)
        db_u3 = await crud.create_user(db, u3)
        db_u4 = await crud.create_user(db, u4)
        db_u5 = await crud.create_user(db, u5)
        db_u6 = await crud.create_user(db, u6)
        db_u7 = await crud.create_user(db, u7)
        db_u8 = await crud.create_user(db, u8)
        db_u9 = await crud.create_user(db, u9)
        db_u10 = await crud.create_user(db, u10)
        
        def get_nickname(user):
            rep = next((m for m in user.workspace_memberships if m.is_representative), None)
            if not rep and user.workspace_memberships:
                rep = user.workspace_memberships[0]
            return rep.nickname if rep else user.username

        def get_dept_id(user):
            rep = next((m for m in user.department_memberships if m.is_representative), None)
            if not rep and user.department_memberships:
                rep = user.department_memberships[0]
            return rep.department_id if rep else None

        print(f"Users created: {get_nickname(db_u1)}, {get_nickname(db_u2)}, {get_nickname(db_u3)}, {get_nickname(db_u4)}, {get_nickname(db_u5)}, {get_nickname(db_u6)}, {get_nickname(db_u7)}, {get_nickname(db_u8)}, {get_nickname(db_u9)}, {get_nickname(db_u10)}")

        def get_workspace_id(user):
            rep = next((m for m in user.workspace_memberships if m.is_representative), None)
            if not rep and user.workspace_memberships:
                rep = user.workspace_memberships[0]
            return rep.workspace_id if rep else None

        w1 = get_workspace_id(db_u1)
        w3 = get_workspace_id(db_u3)

        # 1. First insert secondary memberships to avoid ForeignKey constraint check issues during chat room creation
        if w1:
            print("Creating secondary workspace memberships for Sejong and Kim...")
            m_sejong = models.WorkspaceMember(
                workspace_id=w1,
                user_id=db_u3.id,
                is_representative=False,
                nickname="이도 상무",
                profile_image_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                status_message="한글 서비스 고도화 기획 중 💻"
            )
            m_kim = models.WorkspaceMember(
                workspace_id=w1,
                user_id=db_u4.id,
                is_representative=False,
                nickname="유신 전무",
                profile_image_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
                status_message="스마트 오피스 겸직 업무 🐴"
            )
            db.add_all([m_sejong, m_kim])
            await db.flush()

        # Update Workspace owner_ids to resolve user-workspace circular dependency
        print("Setting Workspace owners...")
        if w1:
            res = await db.execute(select(models.Workspace).where(models.Workspace.id == w1))
            wk = res.scalars().first()
            if wk:
                wk.owner_id = db_u1.id
        if w3:
            res = await db.execute(select(models.Workspace).where(models.Workspace.id == w3))
            wk = res.scalars().first()
            if wk:
                wk.owner_id = db_u3.id

        # Update Department managers to resolve user-department circular dependency
        print("Setting Department managers...")
        for u in [db_u1, db_u2, db_u3, db_u4, db_u5, db_u6, db_u7, db_u8, db_u9, db_u10]:
            d_id = get_dept_id(u)
            if d_id:
                res = await db.execute(select(models.Department).where(models.Department.id == d_id))
                dept = res.scalars().first()
                if dept:
                    dept.manager_id = u.id

        await db.commit()
        
        # Create a 1:1 chat between Hong and Lee inside w1
        print("Creating 1:1 Chat Room...")
        r1_in = schemas.ChatRoomCreate(
            name="이순신 장군님",
            is_group=False,
            member_ids=[db_u2.id] # creator db_u1 will be auto added
        )
        r1 = await crud.create_chat_room(db, r1_in, db_u1.id, w1)
        
        # Add messages for r1
        print("Adding messages to 1:1 Chat...")
        m1 = models.Message(
            room_id=r1.id,
            sender_id=db_u2.id,
            created_at=datetime.now(timezone.utc) - timedelta(hours=2)
        )
        m1.content = "길동아, 금일 플랫폼 개발 건 진척은 어찌 되어가는가?"
        m2 = models.Message(
            room_id=r1.id,
            sender_id=db_u1.id,
            created_at=datetime.now(timezone.utc) - timedelta(hours=1, minutes=45)
        )
        m2.content = "장군님! 다중 테넌트 계층형 부서/직급 매핑 리팩토링이 최종 완료 단계에 있습니다."
        m3 = models.Message(
            room_id=r1.id,
            sender_id=db_u2.id,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=10)
        )
        m3.content = "훌륭하군. 수고가 많네!"
        db.add_all([m1, m2, m3])
        await db.flush()
        
        # Mark as read for Hong
        stmt1 = select(models.ChatRoomMember).where(
            and_(
                models.ChatRoomMember.room_id == r1.id,
                models.ChatRoomMember.user_id == db_u1.id
            )
        )
        hong_member = (await db.execute(stmt1)).scalars().first()
        if hong_member:
            hong_member.last_read_at = datetime.now(timezone.utc) - timedelta(minutes=20)
            
        # Create a group chat (Hong, Lee, Sejong) inside w1
        print("Creating Group Chat Room...")
        r2_in = schemas.ChatRoomCreate(
            name="Zioyou 스마트오피스 TF",
            is_group=True,
            member_ids=[db_u2.id, db_u3.id]
        )
        r2 = await crud.create_chat_room(db, r2_in, db_u1.id, w1)
        
        # Add messages for r2
        print("Adding messages to Group Chat...")
        gm1 = models.Message(
            room_id=r2.id,
            sender_id=db_u3.id,
            content="과인도 이 테넌트 격리 메신저가 마음에 드는구나. 실시간 한글 타이핑 성능이 좋구려.",
            created_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        gm2 = models.Message(
            room_id=r2.id,
            sender_id=db_u2.id,
            content="세종대왕 전하, 기업용 스마트오피스에 걸맞게 부서 및 직위 체계가 완벽히 동작합니다.",
            created_at=datetime.now(timezone.utc) - timedelta(hours=5)
        )
        gm3 = models.Message(
            room_id=r2.id,
            sender_id=db_u1.id,
            content="저도 동감합니다! 메신저에도 한글을 아주 잘 활용하고 있습니다.",
            created_at=datetime.now(timezone.utc) - timedelta(hours=4)
        )
        gm4 = models.Message(
            room_id=r2.id,
            sender_id=db_u3.id,
            content="조선 메신저 최고로다! 다들 주말 잘 보내거라.",
            created_at=datetime.now(timezone.utc) - timedelta(hours=1)
        )
        db.add_all([gm1, gm2, gm3, gm4])
        await db.flush()
        
        # Keep Hong updated with r2, so 0 unreads
        stmt2 = select(models.ChatRoomMember).where(
            and_(
                models.ChatRoomMember.room_id == r2.id,
                models.ChatRoomMember.user_id == db_u1.id
            )
        )
        hong_member_r2 = (await db.execute(stmt2)).scalars().first()
        if hong_member_r2:
            hong_member_r2.last_read_at = datetime.now(timezone.utc)
            
        # Create a new demo 1:1 chat room between Hong and Hwang inside w1
        print("Creating 1:1 Chat between Hong and Hwang...")
        r3_in = schemas.ChatRoomCreate(
            name="황희 정승님",
            is_group=False,
            member_ids=[db_u5.id]
        )
        r3 = await crud.create_chat_room(db, r3_in, db_u1.id, w1)
        
        # Add messages for r3
        hm1 = models.Message(
            room_id=r3.id,
            sender_id=db_u5.id,
            content="길동아, 예산 심의 건에 대해 기획서 초안이 작성되었느냐?",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=45)
        )
        hm2 = models.Message(
            room_id=r3.id,
            sender_id=db_u1.id,
            content="예! 방금 전송 완료해드렸습니다.",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=30)
        )
        db.add_all([hm1, hm2])
        await db.flush()

        # Seed MemberRelations (Isolated inside Kakao Enterprise workspace)
        if w1:
            print("Seeding MemberRelations...")
            f1 = models.MemberRelation(workspace_id=w1, user_id=db_u1.id, member_id=db_u2.id)
            f2 = models.MemberRelation(workspace_id=w1, user_id=db_u1.id, member_id=db_u3.id)
            f3 = models.MemberRelation(workspace_id=w1, user_id=db_u1.id, member_id=db_u4.id)
            f4 = models.MemberRelation(workspace_id=w1, user_id=db_u1.id, member_id=db_u5.id) # Hong - Hwang
            
            f5 = models.MemberRelation(workspace_id=w1, user_id=db_u2.id, member_id=db_u1.id)
            f6 = models.MemberRelation(workspace_id=w1, user_id=db_u2.id, member_id=db_u3.id)
            f7 = models.MemberRelation(workspace_id=w1, user_id=db_u2.id, member_id=db_u5.id) # Lee - Hwang
            
            f8 = models.MemberRelation(workspace_id=w1, user_id=db_u3.id, member_id=db_u1.id)
            f9 = models.MemberRelation(workspace_id=w1, user_id=db_u4.id, member_id=db_u1.id)
            f10 = models.MemberRelation(workspace_id=w1, user_id=db_u3.id, member_id=db_u2.id)
            f11 = models.MemberRelation(workspace_id=w1, user_id=db_u5.id, member_id=db_u1.id) # Hwang - Hong
            f12 = models.MemberRelation(workspace_id=w1, user_id=db_u5.id, member_id=db_u2.id) # Hwang - Lee
            
            db.add_all([f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12])

        # Seed MemberRelations (Isolated inside 한글문화재단 workspace)
        if w3:
            # Sejong - Saimdang
            f13 = models.MemberRelation(workspace_id=w3, user_id=db_u3.id, member_id=db_u6.id)
            f14 = models.MemberRelation(workspace_id=w3, user_id=db_u6.id, member_id=db_u3.id)
            db.add_all([f13, f14])

        await db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        await db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
