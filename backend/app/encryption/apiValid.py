from pymongo import MongoClient
import time
import os
from dotenv import load_dotenv
load_dotenv()

client = MongoClient(os.getenv("MONGO"))
db = client['mydatabase']
collection = db["apikeys"]

def isAPIValid(API_KEY):
    if(API_KEY == None):
        return False
        
    try:
        result = collection.find_one({"key": API_KEY})
        if result is not None:
            return True
        else:
            return False
    except Exception:
        return False