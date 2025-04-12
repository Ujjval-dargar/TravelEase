const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

// Signup form submission
document.querySelector(".sign-up-container form").addEventListener("submit", function (e) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
  
    fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Account created!");
        } else {
          alert("Signup failed: " + data.error);
        }
      });
  });
  
  // Signin form submission
  document.querySelector(".sign-in-container form").addEventListener("submit", function (e) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    const email = inputs[0].value;
    const password = inputs[1].value;
  
    fetch("/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // redirect to profile
          window.location.href = data.redirect;
        } else {
          alert("Login failed: " + data.error);
        }
      });
  });
  