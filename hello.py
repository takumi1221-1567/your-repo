#!/usr/bin/env python3
"""
Simple Python example demonstrating basic functionality
"""

def greet(name):
    """Greet a person by name"""
    return f"Hello, {name}!"

def main():
    """Main function"""
    print(greet("World"))
    print("Welcome to Python programming!")

    # Simple calculation example
    numbers = [1, 2, 3, 4, 5]
    total = sum(numbers)
    print(f"Sum of {numbers} = {total}")

if __name__ == "__main__":
    main()
