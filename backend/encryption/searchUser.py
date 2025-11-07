from getIndex import getIndex
import numpy as np

def searchUser(enc):
    enc = enc.astype("float32")
    index = getIndex()["index"]

    k = 1
    D, I = index.search(np.array([enc]), k)

    print("Distance:", D[0][0])
    print("Matched index:", I[0][0])

    threshold = 0.2
    if D[0][0] < threshold:
        print("✅ Match found:", I[0][0])
    else:
        print("❌ No match found")