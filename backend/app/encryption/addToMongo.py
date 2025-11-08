from pymongo import MongoClient
import time
import os
from dotenv import load_dotenv
load_dotenv()

client = MongoClient(os.getenv("MONGO"))
db = client['mydatabase']

# Choose your collection
collection = db['logs']

def addLogToMongo(API_KEY, uid, logType):
    # start_time = time.time()
    data = {
        "timestamp": time.time(),
        "api_key": API_KEY,
        "uid": uid,
        "logType": logType
    }
    try:
        result = collection.insert_one(data)
    except Exception as e:
        return {"code": 500, "message": e}
    
    # end_time = time.time()  # Record end time
    # execution_time = end_time - start_time
    # print(execution_time, "YAYAYA")
    return {"code": 200, "result": result}