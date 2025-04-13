// login_script.js

// Toggle panels
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
signUpButton.addEventListener('click', () => container.classList.add("right-panel-active"));
signInButton.addEventListener('click', () => container.classList.remove("right-panel-active"));

// Create popup notification system
function createNotification(message, type) {
  // Remove any existing popups
  const existingPopup = document.querySelector('.notification-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create new popup
  const popup = document.createElement('div');
  popup.className = `notification-popup ${type}`;
  
  // Create content
  const content = document.createElement('div');
  content.className = 'notification-content';
  
  // Create message and icon
  const icon = document.createElement('span');
  icon.className = 'notification-icon';
  
  if (type === 'success') {
    icon.innerHTML = '✓';
  } else if (type === 'error') {
    icon.innerHTML = '✕';
  } else {
    icon.innerHTML = 'ℹ';
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    popup.classList.add('notification-hiding');
    setTimeout(() => {
      popup.remove();
    }, 300);
  };
  
  // Assemble popup
  content.appendChild(icon);
  content.appendChild(text);
  popup.appendChild(content);
  popup.appendChild(closeBtn);
  
  // Add to DOM
  document.body.appendChild(popup);
  
  // Animate in
  setTimeout(() => {
    popup.classList.add('notification-visible');
  }, 10);
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.classList.add('notification-hiding');
      setTimeout(() => {
        if (document.body.contains(popup)) {
          popup.remove();
        }
      }, 300);
    }
  }, 5000);
}

// SIGN IN
document.getElementById('signin-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Signing in...';
  submitBtn.disabled = true;
  
  const email = this.querySelector('input[type="email"]').value;
  const password = this.querySelector('input[type="password"]').value;
  const userType = document.getElementById('signin-userType').value;

  fetch('/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userType })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      createNotification('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 1000);
    } else {
      createNotification(data.error || 'Invalid email or password', 'error');
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  })
  .catch(err => {
    createNotification('An error occurred. Please try again.', 'error');
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  });
});

// SIGN UP
document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Creating account...';
  submitBtn.disabled = true;
  
  const name = this.querySelector('input[placeholder="Full Name"]').value;
  const email = this.querySelector('input[type="email"]').value;
  const password = this.querySelector('input[type="password"]').value;
  const userType = document.getElementById('signup-userType').value;

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, userType })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      createNotification('Account created successfully!', 'success');
      setTimeout(() => {
        container.classList.remove("right-panel-active");
        // Reset form
        document.getElementById('signup-form').reset();
      }, 1000);
    } else {
      createNotification(data.error || 'Registration failed', 'error');
    }
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  })
  .catch(err => {
    createNotification('An error occurred. Please try again.', 'error');
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  });
});

// Add input validation feedback
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
  input.addEventListener('blur', function() {
    if (this.value.trim() === '' && this.hasAttribute('required')) {
      this.classList.add('input-error');
    } else {
      this.classList.remove('input-error');
    }
  });
  
  input.addEventListener('focus', function() {
    this.classList.remove('input-error');
  });
});

// Password strength indicator for signup
const passwordInput = document.querySelector('.sign-up-container input[type="password"]');
if (passwordInput) {
  passwordInput.addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    updatePasswordStrengthIndicator(strength);
  });
}

function checkPasswordStrength(password) {
  if (password.length < 6) return 'weak';
  if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
    return 'strong';
  }
  return 'medium';
}

function updatePasswordStrengthIndicator(strength) {
  // Remove any existing indicator
  const existingIndicator = document.querySelector('.password-strength');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  if (strength === 'weak' || strength === 'medium' || strength === 'strong') {
    const indicator = document.createElement('div');
    indicator.className = `password-strength ${strength}`;
    indicator.textContent = `Password strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
    
    // Insert after password input
    passwordInput.parentNode.insertBefore(indicator, passwordInput.nextSibling);
  }
}