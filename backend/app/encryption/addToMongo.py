from pymongo import MongoClient
import time

client = MongoClient("mongodb+srv://youtubeuser:zeroday@cluster0.7gpxr2s.mongodb.net")
db = client['mydatabase']

# Choose your collection
collection = db['logs']

def addLogToMongo(API_KEY, uid):
    data = {
        "timestamp": time.time(),
        "api_key": API_KEY,
        "uid": uid
    }
    try:
        result = collection.insert_one(data)
    except Exception as e:
        return {"code": 500, "message": e}
    
    return {"code": 200, "result": result}