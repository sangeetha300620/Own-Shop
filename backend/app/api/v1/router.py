from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, chat, inquiries, lookups, properties

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(properties.router)
api_router.include_router(inquiries.router)
api_router.include_router(lookups.router)
api_router.include_router(admin.router)
api_router.include_router(chat.router)
