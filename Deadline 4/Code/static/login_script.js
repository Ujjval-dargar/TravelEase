// login_script.js

// Toggle panels (your existing code)…
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container    = document.getElementById('container');
signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

// SIGN IN
document.getElementById('signin-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email     = this.querySelector('input[type="email"]').value;
  const password  = this.querySelector('input[type="password"]').value;
  const userType  = document.getElementById('signin-userType').value;

  fetch('/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userType })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.href = data.redirect;
    } else {
      alert('Login failed: ' + data.error);
    }
  });
});

// SIGN UP (for completeness)
document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const name      = this.querySelector('input[placeholder="Full Name"]').value;
  const email     = this.querySelector('input[type="email"]').value;
  const password  = this.querySelector('input[type="password"]').value;
  const userType  = document.getElementById('signup-userType').value;

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, userType })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Account created! Please sign in.');
      container.classList.remove("right-panel-active");
    } else {
      alert('Signup failed: ' + data.error);
    }
  });
});
