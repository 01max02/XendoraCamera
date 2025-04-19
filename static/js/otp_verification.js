document.addEventListener('DOMContentLoaded', function() {
    const otpForm = document.getElementById('otpForm');
    const inputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.querySelector('.verify-btn');
    const resendBtn = document.getElementById('resendBtn');
    const timer = document.getElementById('timer');
    let timeLeft = 60; // 60 seconds countdown

    // Handle input behavior
    inputs.forEach((input, index) => {
        // Auto-focus next input
        input.addEventListener('input', function() {
            if (this.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    this.blur();
                }
            }
        });

        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    // Handle form submission
    otpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect OTP from all inputs
        const otp = Array.from(inputs).map(input => input.value).join('');
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
            const response = await fetch('/otp_verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otp: otp })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('success', data.message || 'OTP verified successfully!');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                showMessage('error', data.error || 'Invalid OTP. Please try again.');
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('error', 'An error occurred. Please try again.');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify OTP';
        }
    });

    // Handle resend code
    resendBtn.addEventListener('click', async function() {
        if (this.disabled) return;
        
        try {
            const response = await fetch('/resend_otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('success', 'New OTP sent successfully!');
                startTimer();
            } else {
                showMessage('error', data.error || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('error', 'Failed to resend OTP');
        }
    });

    // Timer function
    function startTimer() {
        resendBtn.disabled = true;
        timeLeft = 60;
        
        const interval = setInterval(() => {
            timeLeft--;
            timer.textContent = `Resend in ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                timer.textContent = '';
                resendBtn.disabled = false;
            }
        }, 1000);
    }

    // Message display function
    function showMessage(type, message) {
        const messageElement = document.querySelector(`.${type}-message`);
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }

    // Start initial timer
    startTimer();
}); 