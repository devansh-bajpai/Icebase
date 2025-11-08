from cryptography.fernet import Fernet
import faiss
import os
from dotenv import load_dotenv
load_dotenv()

def updateIndex(index):
    key = os.getenv("ENCRYPTION_KEY")
    fernet = Fernet(key)

    faiss.write_index(index, "encryption/temp.index")
    try:
        with open("encryption/temp.index", "rb") as f:
            data = f.read()
    except Exception:
        return {"code": 500, "message": "File IO Exception Occurred."}
    
    os.remove("encryption/temp.index")
    
    encryped = fernet.encrypt(data)

    with open("encryption/faces_encrypted.index", "wb") as f:
        f.write(encryped)

    return {"code": 200, "message": "Updated Index successfully"}