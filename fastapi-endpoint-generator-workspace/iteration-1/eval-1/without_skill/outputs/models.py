from sqlalchemy import Column, Integer, String
from database import Base

class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    note = Column(String)
