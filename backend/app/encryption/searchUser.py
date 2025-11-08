from encryption.getIndex import getIndex
import numpy as np

def searchUser(enc):
    enc = enc.astype("float32")
    
    indexResponse = getIndex()
    if(indexResponse["code"] != 200):
        return {"code": 500, "message": "Error while getting index."}
    else:
        index = indexResponse["index"]

    k = 1
    D, I = index.search(np.array([enc]), k)
    print("distance = ", D[0][0])

    threshold = 0.2
    if D[0][0] < threshold:
        return {"code": 200, "message": "Match found", "uid": int(I[0][0])}
    else:
        return {"code": 404, "message": "No match found"}