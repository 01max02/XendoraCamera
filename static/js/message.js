document.addEventListener('DOMContentLoaded', function() {
    // Sample messages data
    const messages = [
        {
            id: 1,
            sender: 'John Doe',
            avatar: 'default-avatar.png',
            message: 'Hello, is the camera still available?',
            timestamp: '10:30 AM',
            unread: true
        },
        {
            id: 2,
            sender: 'Jane Smith',
            avatar: 'default-avatar.png',
            message: 'Thank you for the quick delivery!',
            timestamp: '09:15 AM',
            unread: true
        },
        {
            id: 3,
            sender: 'Mike Johnson',
            avatar: 'default-avatar.png',
            message: 'Can you provide more details about the lens?',
            timestamp: 'Yesterday',
            unread: true
        }
    ];

    // Populate messages list
    const messageItems = document.querySelector('.message-items');
    messages.forEach(msg => {
        const messageElement = createMessageElement(msg);
        messageItems.appendChild(messageElement);
    });

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterMessages(searchTerm);
    });

    // Send message functionality
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.btn-send');
    
    sendButton.addEventListener('click', function() {
        sendMessage();
    });

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = `message-item ${msg.unread ? 'unread' : ''}`;
    div.innerHTML = `
        <img src="/static/images/${msg.avatar}" alt="${msg.sender}" class="avatar">
        <div class="message-info">
            <div class="message-header">
                <h4>${msg.sender}</h4>
                <span class="timestamp">${msg.timestamp}</span>
            </div>
            <p class="message-preview">${msg.message}</p>
        </div>
    `;
    
    div.addEventListener('click', () => selectMessage(msg.id));
    return div;
}

function filterMessages(searchTerm) {
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function sendMessage() {
    const chatInput = document.querySelector('.chat-input input');
    const message = chatInput.value.trim();
    
    if (message) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function selectMessage(messageId) {
    // Handle message selection
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(item => item.classList.remove('selected'));
    const selectedItem = document.querySelector(`.message-item[data-id="${messageId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedItem.classList.remove('unread');
        updateUnreadCount();
    }
}

function updateUnreadCount() {
    const unreadMessages = document.querySelectorAll('.message-item.unread').length;
    const badge = document.querySelector('.badge');
    if (badge) {
        badge.textContent = unreadMessages;
        badge.style.display = unreadMessages > 0 ? 'inline' : 'none';
    }
} 