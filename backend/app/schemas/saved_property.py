from pydantic import BaseModel


class SavedStatus(BaseModel):
    is_saved: bool
