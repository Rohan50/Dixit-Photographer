from datetime import datetime, timedelta, timezone
import asyncio
import logging
import os
import re
import uuid
from pathlib import Path
from typing import List, Optional

import resend
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = "HS256"

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL")
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\s-]", "", value).strip().lower()
    return re.sub(r"[\s_-]+", "-", normalized)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


async def ensure_unique_slug(collection_name: str, base_slug: str, current_id: Optional[str] = None) -> str:
    slug = base_slug
    suffix = 2

    while True:
        query = {"slug": slug}
        if current_id:
            query["id"] = {"$ne": current_id}

        existing = await db[collection_name].find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    unauthorized_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired admin token.",
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("sub")
        if not admin_id:
            raise unauthorized_error
    except JWTError as exc:
        raise unauthorized_error from exc

    admin = await db.admin_users.find_one({"id": admin_id}, {"_id": 0})
    if not admin:
        raise unauthorized_error

    return admin


class ApiMessage(BaseModel):
    message: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    admin_email: EmailStr


class AdminProfile(BaseModel):
    id: str
    email: EmailStr


class GalleryBase(BaseModel):
    title: str
    category: str
    description: str
    location: Optional[str] = None
    shoot_date: Optional[str] = None
    cover_image: str
    images: List[str] = Field(default_factory=list)
    is_featured: bool = False


class GalleryCreateRequest(GalleryBase):
    pass


class GalleryUpdateRequest(GalleryBase):
    pass


class GalleryResponse(GalleryBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    photo_count: int
    created_at: str
    updated_at: str


class BlogBase(BaseModel):
    title: str
    category: str
    excerpt: str
    content: str
    cover_image: str
    embedded_images: List[str] = Field(default_factory=list)
    is_featured: bool = False


class BlogCreateRequest(BlogBase):
    pass


class BlogUpdateRequest(BlogBase):
    pass


class BlogResponse(BlogBase):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    published_at: str
    updated_at: str


class EnquiryCreateRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    event_type: str
    event_date: str
    location: str
    budget_range: str
    message: str


class EnquiryResponse(EnquiryCreateRequest):
    model_config = ConfigDict(extra="ignore")

    id: str
    status: str
    created_at: str


class EnquirySubmissionResponse(BaseModel):
    enquiry: EnquiryResponse
    email_sent: bool


class HomeResponse(BaseModel):
    featured_galleries: List[GalleryResponse]
    latest_posts: List[BlogResponse]


class DashboardSummary(BaseModel):
    galleries: int
    blog_posts: int
    enquiries: int
    pending_enquiries: int


class AboutResponse(BaseModel):
    name: str
    tagline: str
    story: str
    portrait_image: str
    achievements: List[str]
    testimonials: List[str]


SAMPLE_GALLERIES = [
    {
        "title": "Rajasthan Desert Wedding",
        "category": "Weddings",
        "description": "Soft desert light, candid rituals, and timeless black-and-white storytelling.",
        "location": "Jaisalmer",
        "shoot_date": "March 2025",
        "cover_image": "https://images.unsplash.com/photo-1705259633495-eaa27710ad3c?auto=format&fit=crop&w=1600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1614566957872-9548817a3298?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1495042823740-46feea76a69c?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1657533874081-2843ec82572c?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1705259633495-eaa27710ad3c?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": True,
    },
    {
        "title": "Quiet Portrait Studies",
        "category": "Portraits",
        "description": "Intimate portraiture focused on texture, expression, and natural shadow.",
        "location": "Studio Session",
        "shoot_date": "January 2026",
        "cover_image": "https://images.pexels.com/photos/4483620/pexels-photo-4483620.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1600",
        "images": [
            "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
            "https://images.pexels.com/photos/4483620/pexels-photo-4483620.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1600",
            "https://images.unsplash.com/photo-1718123793344-060675cd9eef?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1698250542468-a01762bef483?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": True,
    },
    {
        "title": "Noir Streets",
        "category": "Street Photography",
        "description": "Urban rhythms captured through reflections, silhouettes, and motion.",
        "location": "Tokyo",
        "shoot_date": "August 2025",
        "cover_image": "https://images.unsplash.com/photo-1698938531961-20cd6491b07a?auto=format&fit=crop&w=1600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1698938531961-20cd6491b07a?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1618905647752-459b95199b2c?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1698250542468-a01762bef483?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": True,
    },
    {
        "title": "Monochrome Runway",
        "category": "Fashion",
        "description": "Editorial fashion moments with high contrast and graphic composition.",
        "location": "Paris",
        "shoot_date": "October 2025",
        "cover_image": "https://images.unsplash.com/photo-1698250542468-a01762bef483?auto=format&fit=crop&w=1600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1698250542468-a01762bef483?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1698938531961-20cd6491b07a?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1718123793344-060675cd9eef?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": False,
    },
    {
        "title": "Wind Over The Coast",
        "category": "Nature",
        "description": "Sea, stone, and wind interpreted in quiet grayscale frames.",
        "location": "Devon Coast",
        "shoot_date": "May 2025",
        "cover_image": "https://images.unsplash.com/photo-1660311478699-15e592862c9f?auto=format&fit=crop&w=1600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1660311475895-412529817f5f?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1660311478699-15e592862c9f?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1720642995371-fa32b4dfb9ad?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1650998326967-882f7a0aba90?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": False,
    },
    {
        "title": "Continental Fragments",
        "category": "Travel",
        "description": "A documentary-style journey through railway towns and old cities.",
        "location": "Europe",
        "shoot_date": "November 2025",
        "cover_image": "https://images.unsplash.com/photo-1718123793344-060675cd9eef?auto=format&fit=crop&w=1600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1718123793344-060675cd9eef?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1698938531961-20cd6491b07a?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1660311475895-412529817f5f?auto=format&fit=crop&w=1600&q=80",
        ],
        "is_featured": True,
    },
]

SAMPLE_BLOGS = [
    {
        "title": "How I Compose with Shadow",
        "category": "Insights",
        "excerpt": "A practical breakdown of creating depth in monochrome portrait sessions.",
        "content": "I begin every session by observing where the shadow falls before I place the subject. In black and white, shape matters more than color, so light direction becomes narrative. The frame is built from geometry, pauses, and texture.\n\nWhen possible, I avoid heavy artificial fill and let contrast carve the face naturally. This gives every portrait a cinematic quality that feels timeless rather than trendy.",
        "cover_image": "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
        "embedded_images": [
            "https://images.unsplash.com/photo-1698250542468-a01762bef483?auto=format&fit=crop&w=1600&q=80"
        ],
        "is_featured": True,
    },
    {
        "title": "Behind the Rajasthan Wedding Story",
        "category": "Stories",
        "excerpt": "From first light to final dance — a wedding documented through emotion.",
        "content": "The day started before sunrise in the desert winds. Every ritual had a rhythm, and every glance carried meaning. I shot from a distance early on, letting moments unfold naturally before moving in close for intimate portraits.\n\nBy night, the choreography of movement and torch light created striking frames that translated beautifully in monochrome.",
        "cover_image": "https://images.unsplash.com/photo-1614566957872-9548817a3298?auto=format&fit=crop&w=1600&q=80",
        "embedded_images": [
            "https://images.unsplash.com/photo-1495042823740-46feea76a69c?auto=format&fit=crop&w=1600&q=80"
        ],
        "is_featured": True,
    },
    {
        "title": "Street Frames that Feel Like Cinema",
        "category": "Travel",
        "excerpt": "Small compositional shifts that make city scenes dramatic and clear.",
        "content": "On the street, anticipation matters more than reaction. I pre-frame where movement will happen and wait for gesture to complete the story. Reflections, signs, and backlight become visual anchors.\n\nThe best frame usually happens a second before or after the obvious one — patience is the secret weapon.",
        "cover_image": "https://images.unsplash.com/photo-1698938531961-20cd6491b07a?auto=format&fit=crop&w=1600&q=80",
        "embedded_images": [
            "https://images.unsplash.com/photo-1618905647752-459b95199b2c?auto=format&fit=crop&w=1600&q=80"
        ],
        "is_featured": False,
    },
]

ABOUT_CONTENT = {
    "name": "Shivi Pareek",
    "tagline": "Capturing timeless moments through light and emotion.",
    "story": "I am a documentary and editorial photographer working across weddings, portraits, and travel assignments. My practice is rooted in quiet observation, contrast-driven composition, and human emotion. Every frame is designed to feel honest, cinematic, and enduring.",
    "portrait_image": "https://images.unsplash.com/photo-1702825623787-64cab26698b5?auto=format&fit=crop&w=1600&q=80",
    "achievements": [
        "Featured in Monochrome Journal 2025",
        "Top 30 Wedding Storytellers — Global Frames",
        "Exhibited at Editorial Lens Week, Milan",
    ],
    "testimonials": [
        "Every image felt like a still from a timeless film.",
        "Effortless direction, beautiful storytelling, exceptional result.",
        "A deeply personal and elegant documentation of our day.",
    ],
}


async def send_enquiry_notification(enquiry: EnquiryResponse) -> bool:
    if not (RESEND_API_KEY and SENDER_EMAIL and ADMIN_NOTIFICATION_EMAIL):
        logger.warning(
            "Enquiry email not sent. Missing RESEND_API_KEY, SENDER_EMAIL, or ADMIN_NOTIFICATION_EMAIL."
        )
        return False

    subject = f"New Booking Enquiry: {enquiry.event_type}"
    html_content = f"""
    <table style=\"width:100%;font-family:Arial,sans-serif;border-collapse:collapse;\">
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Name:</strong> {enquiry.name}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Email:</strong> {enquiry.email}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Phone:</strong> {enquiry.phone}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Event Type:</strong> {enquiry.event_type}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Event Date:</strong> {enquiry.event_date}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Location:</strong> {enquiry.location}</td></tr>
      <tr><td style=\"padding:12px;border-bottom:1px solid #ddd;\"><strong>Budget:</strong> {enquiry.budget_range}</td></tr>
      <tr><td style=\"padding:12px;\"><strong>Message:</strong><br/>{enquiry.message}</td></tr>
    </table>
    """

    params = {
        "from": SENDER_EMAIL,
        "to": [ADMIN_NOTIFICATION_EMAIL],
        "subject": subject,
        "html": html_content,
    }

    try:
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as exc:
        logger.error("Failed to send enquiry notification: %s", exc)
        return False


async def seed_admin_user() -> None:
    admin_exists = await db.admin_users.find_one({"email": ADMIN_EMAIL}, {"_id": 0, "id": 1})
    if admin_exists:
        return

    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": ADMIN_EMAIL,
        "password_hash": hash_password(ADMIN_PASSWORD),
        "created_at": now_iso(),
    }
    await db.admin_users.insert_one(admin_doc.copy())


async def seed_galleries() -> None:
    galleries_exist = await db.galleries.count_documents({})
    if galleries_exist > 0:
        return

    for gallery in SAMPLE_GALLERIES:
        timestamp = now_iso()
        base_slug = slugify(gallery["title"])
        generated_slug = await ensure_unique_slug("galleries", base_slug)
        gallery_doc = {
            "id": str(uuid.uuid4()),
            "slug": generated_slug,
            **gallery,
            "photo_count": len(gallery["images"]),
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        await db.galleries.insert_one(gallery_doc.copy())


async def seed_blogs() -> None:
    blog_exists = await db.blog_posts.count_documents({})
    if blog_exists > 0:
        return

    for post in SAMPLE_BLOGS:
        timestamp = now_iso()
        base_slug = slugify(post["title"])
        generated_slug = await ensure_unique_slug("blog_posts", base_slug)
        post_doc = {
            "id": str(uuid.uuid4()),
            "slug": generated_slug,
            **post,
            "published_at": timestamp,
            "updated_at": timestamp,
        }
        await db.blog_posts.insert_one(post_doc.copy())


app = FastAPI(title="Noir Portfolio API")
api_router = APIRouter(prefix="/api")


@api_router.get("/", response_model=ApiMessage)
async def root() -> ApiMessage:
    return ApiMessage(message="Noir portfolio API is running.")


@api_router.get("/public/about", response_model=AboutResponse)
async def get_about_content() -> AboutResponse:
    return AboutResponse(**ABOUT_CONTENT)


@api_router.get("/public/home", response_model=HomeResponse)
async def get_home_data() -> HomeResponse:
    featured_galleries = await db.galleries.find({"is_featured": True}, {"_id": 0}).sort("updated_at", -1).to_list(6)
    latest_posts = await db.blog_posts.find({}, {"_id": 0}).sort("published_at", -1).to_list(3)
    return HomeResponse(featured_galleries=featured_galleries, latest_posts=latest_posts)


@api_router.get("/public/galleries", response_model=List[GalleryResponse])
async def get_public_galleries(category: Optional[str] = Query(default=None)) -> List[GalleryResponse]:
    query = {"category": category} if category else {}
    galleries = await db.galleries.find(query, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return [GalleryResponse(**gallery) for gallery in galleries]


@api_router.get("/public/galleries/{slug}", response_model=GalleryResponse)
async def get_public_gallery_detail(slug: str) -> GalleryResponse:
    gallery = await db.galleries.find_one({"slug": slug}, {"_id": 0})
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found.")

    return GalleryResponse(**gallery)


@api_router.get("/public/blogs", response_model=List[BlogResponse])
async def get_public_blogs() -> List[BlogResponse]:
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("published_at", -1).to_list(200)
    return [BlogResponse(**post) for post in posts]


@api_router.get("/public/blogs/{slug}", response_model=BlogResponse)
async def get_public_blog_detail(slug: str) -> BlogResponse:
    blog = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found.")

    return BlogResponse(**blog)


@api_router.post("/public/enquiries", response_model=EnquirySubmissionResponse)
async def create_public_enquiry(payload: EnquiryCreateRequest) -> EnquirySubmissionResponse:
    enquiry = EnquiryResponse(
        id=str(uuid.uuid4()),
        status="new",
        created_at=now_iso(),
        **payload.model_dump(),
    )
    enquiry_doc = enquiry.model_dump()
    await db.enquiries.insert_one(enquiry_doc.copy())
    email_sent = await send_enquiry_notification(enquiry)
    return EnquirySubmissionResponse(enquiry=enquiry, email_sent=email_sent)


@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    admin = await db.admin_users.find_one({"email": payload.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(admin["id"], admin["email"])
    return AdminLoginResponse(token=token, admin_email=admin["email"])


@api_router.get("/admin/me", response_model=AdminProfile)
async def admin_me(current_admin: dict = Depends(get_current_admin)) -> AdminProfile:
    return AdminProfile(id=current_admin["id"], email=current_admin["email"])


@api_router.get("/admin/dashboard-summary", response_model=DashboardSummary)
async def get_dashboard_summary(_: dict = Depends(get_current_admin)) -> DashboardSummary:
    galleries_count = await db.galleries.count_documents({})
    blog_posts_count = await db.blog_posts.count_documents({})
    enquiries_count = await db.enquiries.count_documents({})
    pending_enquiries_count = await db.enquiries.count_documents({"status": "new"})
    return DashboardSummary(
        galleries=galleries_count,
        blog_posts=blog_posts_count,
        enquiries=enquiries_count,
        pending_enquiries=pending_enquiries_count,
    )


@api_router.get("/admin/galleries", response_model=List[GalleryResponse])
async def get_admin_galleries(_: dict = Depends(get_current_admin)) -> List[GalleryResponse]:
    galleries = await db.galleries.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return [GalleryResponse(**gallery) for gallery in galleries]


@api_router.post("/admin/galleries", response_model=GalleryResponse)
async def create_admin_gallery(payload: GalleryCreateRequest, _: dict = Depends(get_current_admin)) -> GalleryResponse:
    timestamp = now_iso()
    base_slug = slugify(payload.title)
    generated_slug = await ensure_unique_slug("galleries", base_slug)
    payload_dict = payload.model_dump()
    gallery = {
        "id": str(uuid.uuid4()),
        "slug": generated_slug,
        **payload_dict,
        "photo_count": len(payload_dict["images"]),
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    await db.galleries.insert_one(gallery.copy())
    return GalleryResponse(**gallery)


@api_router.put("/admin/galleries/{gallery_id}", response_model=GalleryResponse)
async def update_admin_gallery(
    gallery_id: str,
    payload: GalleryUpdateRequest,
    _: dict = Depends(get_current_admin),
) -> GalleryResponse:
    existing = await db.galleries.find_one({"id": gallery_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Gallery not found.")

    payload_dict = payload.model_dump()
    generated_slug = await ensure_unique_slug("galleries", slugify(payload.title), gallery_id)
    updated_gallery = {
        **existing,
        **payload_dict,
        "slug": generated_slug,
        "photo_count": len(payload_dict["images"]),
        "updated_at": now_iso(),
    }
    await db.galleries.update_one({"id": gallery_id}, {"$set": updated_gallery})
    return GalleryResponse(**updated_gallery)


@api_router.delete("/admin/galleries/{gallery_id}", response_model=ApiMessage)
async def delete_admin_gallery(gallery_id: str, _: dict = Depends(get_current_admin)) -> ApiMessage:
    result = await db.galleries.delete_one({"id": gallery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found.")

    return ApiMessage(message="Gallery deleted successfully.")


@api_router.get("/admin/blogs", response_model=List[BlogResponse])
async def get_admin_blogs(_: dict = Depends(get_current_admin)) -> List[BlogResponse]:
    blogs = await db.blog_posts.find({}, {"_id": 0}).sort("published_at", -1).to_list(200)
    return [BlogResponse(**post) for post in blogs]


@api_router.post("/admin/blogs", response_model=BlogResponse)
async def create_admin_blog(payload: BlogCreateRequest, _: dict = Depends(get_current_admin)) -> BlogResponse:
    timestamp = now_iso()
    payload_dict = payload.model_dump()
    generated_slug = await ensure_unique_slug("blog_posts", slugify(payload.title))
    blog_doc = {
        "id": str(uuid.uuid4()),
        "slug": generated_slug,
        **payload_dict,
        "published_at": timestamp,
        "updated_at": timestamp,
    }
    await db.blog_posts.insert_one(blog_doc.copy())
    return BlogResponse(**blog_doc)


@api_router.put("/admin/blogs/{blog_id}", response_model=BlogResponse)
async def update_admin_blog(
    blog_id: str,
    payload: BlogUpdateRequest,
    _: dict = Depends(get_current_admin),
) -> BlogResponse:
    existing = await db.blog_posts.find_one({"id": blog_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found.")

    payload_dict = payload.model_dump()
    generated_slug = await ensure_unique_slug("blog_posts", slugify(payload.title), blog_id)
    updated_blog = {
        **existing,
        **payload_dict,
        "slug": generated_slug,
        "updated_at": now_iso(),
    }
    await db.blog_posts.update_one({"id": blog_id}, {"$set": updated_blog})
    return BlogResponse(**updated_blog)


@api_router.delete("/admin/blogs/{blog_id}", response_model=ApiMessage)
async def delete_admin_blog(blog_id: str, _: dict = Depends(get_current_admin)) -> ApiMessage:
    result = await db.blog_posts.delete_one({"id": blog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found.")

    return ApiMessage(message="Blog post deleted successfully.")


@api_router.get("/admin/enquiries", response_model=List[EnquiryResponse])
async def get_admin_enquiries(_: dict = Depends(get_current_admin)) -> List[EnquiryResponse]:
    enquiries = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [EnquiryResponse(**enquiry) for enquiry in enquiries]


@api_router.patch("/admin/enquiries/{enquiry_id}/contacted", response_model=EnquiryResponse)
async def mark_enquiry_contacted(enquiry_id: str, _: dict = Depends(get_current_admin)) -> EnquiryResponse:
    enquiry = await db.enquiries.find_one({"id": enquiry_id}, {"_id": 0})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    enquiry["status"] = "contacted"
    await db.enquiries.update_one({"id": enquiry_id}, {"$set": enquiry})
    return EnquiryResponse(**enquiry)


@api_router.delete("/admin/enquiries/{enquiry_id}", response_model=ApiMessage)
async def delete_enquiry(enquiry_id: str, _: dict = Depends(get_current_admin)) -> ApiMessage:
    result = await db.enquiries.delete_one({"id": enquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    return ApiMessage(message="Enquiry deleted successfully.")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_seed_data() -> None:
    await seed_admin_user()
    await seed_galleries()
    await seed_blogs()


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()