from cryptography.fernet import Fernet
import faiss
import os
from dotenv import load_dotenv
load_dotenv()

def getIndex():
    """decrypts ./faces_encrypted.index and returns index"""

    key = os.getenv("ENCRYPTION_KEY")

    try:
        with open("encryption/faces_encrypted.index", "rb") as f:
            encrypted = f.read()
    except FileNotFoundError:
        return {"code": 404, "message": "Encrypted file is not found."}

    fernet = Fernet(key)
    plainText = fernet.decrypt(encrypted)

    try:
        with open("encryption/temp.index", "wb") as f:
            f.write(plainText)
    except Exception:
        return {"code": 500, "message": "Error while writing index file."}

    index = faiss.read_index("encryption/temp.index")
    os.remove("encryption/temp.index")

    return {"code": 200, "message": "Returned Index file successfully", "index": index}