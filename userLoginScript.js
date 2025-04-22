document.addEventListener("DOMContentLoaded", function () {
    // Set initial view to login state
    document.getElementById("registerHeading").innerText = "user login";
    document.getElementById("nameField").style.display = "none";
    document.getElementById("loginButton").innerText = "Log in";
  
    // Handle "Create Account" link click
    const createAccrount1 = document.getElementById("createAccrount1");
    createAccrount1.addEventListener("click", () => {
      document.getElementById("registerHeading").innerText = "Register Your Account";
      document.getElementById("nameField").style.display = "block"; // Show name field
      document.getElementById("createAccount").style.display = "none"; // Hide lower links area
      document.getElementById("loginButton").innerText = "Register";
    });
  
    // Handle button click for registration or login
    document.getElementById("registerBut").addEventListener("click", function (event) {
      event.preventDefault();
      const buttonValue = document.getElementById("loginButton").innerText;
      
      if (buttonValue === "Register") {
        // Registration branch
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        fetch(`${url}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        })
          .then(response => response.json())
          .then(data => {
            console.log("Server Response:", data);
            if (data.message) {
              alert("Registration successful! Please log in.");
              // Reset to login view:
              document.getElementById("registerHeading").innerText = "user login";
              document.getElementById("nameField").style.display = "none";
              document.getElementById("loginButton").innerText = "Log in";
              // Reset lower links area to its original style (flex)
              document.getElementById("createAccount").style.display = "flex";
              // Reset form fields
              document.getElementById("registerForm").reset();
            } else if (data.error) {
              alert("Error: " + data.error);
            }
          })
          .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
          });
      } else {
        // Login branch
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        fetch(`${url}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include" // Include cookies
        })
          .then(response => response.json())
          .then(data => {
            console.log("Server Response:", data);
            if (data.message === "Login successful") {
              // alert("Login Successful");
              // Redirect to shop page
              window.location.href = "index.html";
            } else if (data.error) {
              alert("Error: " + data.error);
            }
          })
          .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong. Please try again.");
          });
      }
    });
  });
  
