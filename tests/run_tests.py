import sys
import os
import subprocess
from dotenv import load_dotenv

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..'))
    backend_path = os.path.join(root_dir, 'backend')
    sys.path.insert(0, backend_path)

    dotenv_path = os.path.join(backend_path, '.env')
    if os.path.exists(dotenv_path):
        print(f"Loading environment from {dotenv_path}")
        load_dotenv(dotenv_path)
    else:
        print("No .env file found, using default test settings")

    os.environ.setdefault("TESTING", "True")

    try:
        import app
        print(f"'app' module found at: {os.path.dirname(app.__file__)}")
    except ImportError as e:
        print("ERROR: Cannot import 'app' module. Make sure the directory structure is correct.")
        print(e)
        return 1

    print("\nRunning tests for Redoc project...\n")
    
    cmd = ["pytest", "-v", current_dir]
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd)

    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
