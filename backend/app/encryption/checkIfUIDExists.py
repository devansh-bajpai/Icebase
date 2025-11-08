from encryption.getIndex import getIndex

# def checkIfUIDExists(uid):
#     """Checks whether a given UID exists in index or not."""
#     indexResponse = getIndex()
#     if(indexResponse["code"] == 200):
#         index = indexResponse["index"]
#     else:
#         return {"code": 500, "message": "Could not load index"}
    
#     ids = index.id_map
#     if uid in ids:
#         return {"code": 200, "value": True}
#     else:
#         return {"code": 200, "value": False}










# import faiss
# import numpy as np

# def checkIfUIDExists(uid):
#     """Checks whether a given UID exists in the FAISS index or not."""
#     indexResponse = getIndex()
#     if indexResponse["code"] != 200:
#         return {"code": 500, "message": "Could not load index"}
    
#     index = indexResponse["index"]

#     # Ensure it's an IDMap index
#     if not isinstance(index, faiss.IndexIDMap2) and not isinstance(index, faiss.IndexIDMap):
#         return {"code": 400, "message": "Index does not store IDs (not an IndexIDMap)"}

#     # Get all IDs as numpy array
#     ids = faiss.IDSelectorRange(0, index.ntotal)  # alternative way
#     stored_ids = index.id_map.copy() if hasattr(index, "id_map") else None

#     # If id_map exists directly
#     if stored_ids is not None:
#         if isinstance(stored_ids, np.ndarray):
#             exists = uid in stored_ids
#         else:
#             exists = uid in np.array(stored_ids)
#     else:
#         # fallback — if `id_map` is hidden, we can reconstruct
#         stored_ids = faiss.vector_to_array(index.id_map)
#         exists = uid in stored_ids

#     return {"code": 200, "value": bool(exists)}











import faiss
import numpy as np

def checkIfUIDExists(uid):
    """Checks whether a given UID exists in the FAISS index or not."""
    indexResponse = getIndex()
    if indexResponse["code"] != 200:
        return {"code": 500, "message": "Could not load index"}
    
    index = indexResponse["index"]

    # Ensure it's an IDMap index
    if not isinstance(index, faiss.IndexIDMap) and not isinstance(index, faiss.IndexIDMap2):
        return {"code": 400, "message": "Index does not store IDs (not an IndexIDMap)"}

    # Convert FAISS Int64Vector to NumPy array
    stored_ids = faiss.vector_to_array(index.id_map)

    exists = uid in stored_ids
    return {"code": 200, "value": bool(exists)}
