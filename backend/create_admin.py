"""
Script to create an admin user account
Usage: python create_admin.py
"""
import sys
import bcrypt
from app.db import SessionLocal
from app.model import User, RoleEnum

def get_password_hash(password: str) -> str:
    # Use bcrypt directly to avoid passlib compatibility issues
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_admin_user(email: str, password: str):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            # Update to admin if not already
            if existing.role != RoleEnum.admin:
                existing.role = RoleEnum.admin
                existing.hashed_password = get_password_hash(password)
                db.commit()
                print(f"[OK] Updated user {email} to admin role")
            else:
                # Update password
                existing.hashed_password = get_password_hash(password)
                db.commit()
                print(f"[OK] Updated password for admin user {email}")
            return existing
        
        # Create new admin user
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=RoleEnum.admin
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[OK] Created admin user: {email}")
        print(f"  Role: {user.role.value}")
        print(f"  ID: {user.id}")
        return user
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error creating user: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    email = "mampotjemabusela@gmail.com"
    password = "Mampotje"
    
    print(f"Creating admin user...")
    print(f"Email: {email}")
    print(f"Role: admin (full access)")
    print()
    
    try:
        user = create_admin_user(email, password)
        print()
        print("=" * 50)
        print("SUCCESS! Admin user created/updated.")
        print("=" * 50)
        print(f"You can now login with:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print()
    except Exception as e:
        print(f"Failed to create user: {e}")
        sys.exit(1)
