const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const sendButton = document.getElementById('sendButton');
const buttonText = sendButton.querySelector('.button-text');
const spinner = sendButton.querySelector('.spinner');

// Focus on input when page loads
userInput.focus();

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // Disable input and send button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    try {
        // Send message to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add assistant response to chat
            addMessage(data.response, 'assistant');
        } else {
            // Add error message
            addMessage('Error: ' + (data.error || 'Failed to get response'), 'error');
        }
    } catch (error) {
        // Add error message
        addMessage('Error: ' + error.message, 'error');
    } finally {
        // Re-enable input and send button
        userInput.disabled = false;
        sendButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        userInput.focus();
    }
});

function addMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // For assistant messages, render markdown; for user messages, use plain text
    if (role === 'assistant') {
        const htmlContent = marked.parse(text);
        const cleanHtml = DOMPurify.sanitize(htmlContent);
        contentDiv.innerHTML = cleanHtml;
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Allow Enter key to send (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});
