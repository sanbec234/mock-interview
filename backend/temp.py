import os

def get_directory_structure(base_path):
    for root, dirs, files in os.walk(base_path):
        print(f"Root: {root}")
        for directory in dirs:
            print(f"  Directory: {os.path.join(root, directory)}")
        for file in files:
            print(f"  File: {os.path.join(root, file)}")

# Replace 'your_directory_path' with the path of the directory you want to traverse
base_directory = r'C:\Users\mohan\Downloads\mock-interview-main (2)\mock-interview-main'
get_directory_structure(base_directory)
