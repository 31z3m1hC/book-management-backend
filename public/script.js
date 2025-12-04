    import router from './router';

    // const API_URL = 'http://localhost:3000/api';
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const modal = document.getElementById('modal');
    
    // Password validation
    const regPassword = document.getElementById('regPassword');
    const passwordRequirements = document.getElementById('passwordRequirements');
    
    regPassword.addEventListener('focus', () => {
        passwordRequirements.classList.add('show');
    });
    
    regPassword.addEventListener('input', (e) => {
        const password = e.target.value;
        
        // Check length
        const lengthReq = document.getElementById('req-length');
        if (password.length >= 6) {
            lengthReq.classList.add('valid');
            lengthReq.textContent = '✓ At least 6 characters';
        } else {
            lengthReq.classList.remove('valid');
            lengthReq.textContent = '✗ At least 6 characters';
        }
        
        // Check letter
        const letterReq = document.getElementById('req-letter');
        if (/[a-zA-Z]/.test(password)) {
            letterReq.classList.add('valid');
            letterReq.textContent = '✓ At least one letter (a-z)';
        } else {
            letterReq.classList.remove('valid');
            letterReq.textContent = '✗ At least one letter (a-z)';
        }
        
        // Check number
        const numberReq = document.getElementById('req-number');
        if (/[0-9]/.test(password)) {
            numberReq.classList.add('valid');
            numberReq.textContent = '✓ At least one number (0-9)';
        } else {
            numberReq.classList.remove('valid');
            numberReq.textContent = '✗ At least one number (0-9)';
        }
        
        // Check special character
        const specialReq = document.getElementById('req-special');
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            specialReq.classList.add('valid');
            specialReq.textContent = '✓ At least one special character (!@#$%^&*)';
        } else {
            specialReq.classList.remove('valid');
            specialReq.textContent = '✗ At least one special character (!@#$%^&*)';
        }
    });
    
    // Toggle between login and register
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        clearErrors();
    });
    
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        clearErrors();
    });
    
    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Password validation
    function isValidPassword(password) {
        const hasLength = password.length >= 6;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasLength && hasLetter && hasNumber && hasSpecial;
    }
    
    // Show custom modal
    function showModal(title, message, type = 'error') {
        //const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        //modalIcon.className = `modal-icon ${type}`;
        //modalIcon.textContent = type === 'error' ? '' : '';
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        modal.classList.add('show');
    }
    
    function closeModal() {
        modal.classList.remove('show');
    }
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Clear previous errors
        clearErrors();
        
        // Validation
        let hasError = false;
        
        if (!username) {
            showError('loginUsername', 'Username is required');
            hasError = true;
        }
        
        if (!password) {
            showError('loginPassword', 'Password is required');
            hasError = true;
        }
        
        if (hasError) return;
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save token to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showModal('Login Successful!', `Welcome back, ${data.user.fullName}!`, 'success');
                
                // Redirect to main page after 2 seconds
                setTimeout(() => {
                    router.push({ name: 'home' });
                    //window.location.href = '/';
                }, 2000);
            } else {
                showModal(
                    'Login Failed', 
                    'Invalid username or password. Please check your credentials and try again.',
                    'error'
                );
            }
        } catch (error) {
            showModal(
                'Connection Error',
                'Unable to connect to the server. Please check your internet connection and try again.',
                'error'
            );
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    // Handle Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('regFullName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const registerBtn = document.getElementById('registerBtn');
        
        // Clear previous errors
        clearErrors();
        
        // Validation
        let hasError = false;
        
        if (!fullName) {
            showError('regFullName', 'Full name is required');
            hasError = true;
        }
        
        if (!username) {
            showError('regUsername', 'Username is required');
            hasError = true;
        }
        
        if (!email) {
            showError('regEmail', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showError('regEmail', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (!password) {
            showError('regPassword', 'Password is required');
            hasError = true;
        } else if (!isValidPassword(password)) {
            showError('regPassword', 'Password must be at least 6 characters with letters, numbers, and special characters');
            hasError = true;
        }
        
        if (hasError) return;
        
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, username, email, password })
            });
            
            const data = await response.json();
            
            console.log('Server response:', data); // Debug log
            
            if (data.success) {
                // Save token to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showModal(
                    'Registration Successful!', 
                    `Welcome, ${data.user.fullName}! Your account has been created.`,
                    'success'
                );
                
                // Redirect to main page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                showModal(
                    'Registration Failed',
                    data.message || data.error || 'Unable to create account. Please try again.',
                    'error'
                );
            }
        } catch (error) {
            console.error('Registration error:', error); // Debug log
            showModal(
                'Connection Error',
                `Unable to connect to the server: ${error.message}`,
                'error'
            );
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    });
    
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    function clearErrors() {
        const errorInputs = document.querySelectorAll('input.error');
        const errorTexts = document.querySelectorAll('.error-text.show');
        
        errorInputs.forEach(input => input.classList.remove('error'));
        errorTexts.forEach(text => text.classList.remove('show'));
    }
