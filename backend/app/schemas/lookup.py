from pydantic import BaseModel, ConfigDict


class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    state: str | None


class LocalityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    city_id: int


class ShopCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
