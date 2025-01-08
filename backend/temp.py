# # from pymongo import MongoClient

# # # Replace with your MongoDB Atlas connection string
# # MONGODB_URI = "mongodb+srv://root:Root@cluster0.trkjc.mongodb.net/"

# # # Connect to MongoDB Atlas
# # client = MongoClient(MONGODB_URI)

# # # Access the database
# # db = client.test_results_db

# # # Access the collection
# # collection = db.test_results

# # # List documents
# # documents = collection.find()

# # # Print documents
# # for doc in documents:
# #     print(doc)

# from pymongo import MongoClient


# cluster = MongoClient("mongodb+srv://root:Root@cluster0.trkjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

# db = cluster["test_results_db"]
# collection = db["test_results"]

# collection.insert_one({"_id":0, "user_name":"Soumi"})
# collection.insert_one({"_id":100, "user_name":"Ravi"})

from pymongo.mongo_client import MongoClient

uri = "mongodb+srv://root:JAVA@cluster0.trkjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Create a new client and connect to the server
client = MongoClient(uri)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)