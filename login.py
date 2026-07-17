# login.py

def login(username, password):
    """
    A simple placeholder for login functionality.
    Replace with actual authentication logic.
    """
    print(f"Attempting to log in user: {username}")
    # In a real application, you would hash passwords and compare.
    # This is a highly insecure example for demonstration.
    if username == "testuser" and password == "password123":
        print("Login successful!")
        return True
    else:
        print("Login failed.")
        return False

if __name__ == "__main__":
    # Example usage
    print("Running login examples:")
    login("testuser", "password123")
    login("wronguser", "wrongpass")
