from encryption.getIndex import getIndex
from encryption.updateIndex import updateIndex
import numpy as np

def addToIndex(encodingList, idList):
    embeddings = np.array(encodingList).astype("float32")
    indexResponse = getIndex()
    if(indexResponse["code"] != 200):
        return {"code": 500, "message": "Error while getting index."}
    else:
        index = indexResponse["index"]

    index.add_with_ids(embeddings, idList)
    updateResponse = updateIndex(index)

    if(updateResponse["code"] != 200):
        return {"code": 500, "message": "Internal server error."}
    else:
        return {"code": 200, "message": "Added encoding list to index"}