// This file is required for the rendering process.
// All of the Node.js APIs are available in this process.

document.addEventListener('DOMContentLoaded', () => {
    const chatbox = document.getElementById('chatbox');
    console.log('chatbox element:', chatbox);
    const messageInput = document.getElementById('messageInput');
    console.log('messageInput element:', messageInput);
    const sendButton = document.getElementById('sendButton');
    console.log('sendButton element:', sendButton);
    // Removed apiKeyInput as it will be handled by the modal

    const selectGeminiButton = document.getElementById('selectGemini');
    console.log('selectGeminiButton element:', selectGeminiButton);
    const selectOpenAIButton = document.getElementById('selectOpenAI');
    console.log('selectOpenAIButton element:', selectOpenAIButton);
    const apiConfigModalElement = document.getElementById('apiConfigModal');
    console.log('apiConfigModalElement element:', apiConfigModalElement);
    const apiConfigModal = new bootstrap.Modal(apiConfigModalElement);
    console.log('apiConfigModal instance:', apiConfigModal);
    const modalApiKeyInput = document.getElementById('modalApiKeyInput');
    console.log('modalApiKeyInput element:', modalApiKeyInput);
    const modalHostnameInput = document.getElementById('modalHostnameInput');
    console.log('modalHostnameInput element:', modalHostnameInput);
    const modalOptionalPathInput = document.getElementById('modalOptionalPathInput');
    console.log('modalOptionalPathInput element:', modalOptionalPathInput);
    const saveApiConfigButton = document.getElementById('saveApiConfig');
    console.log('saveApiConfigButton element:', saveApiConfigButton);

    let currentApi = 'Gemini'; // Default API
    const apiConfigurations = {
        'Gemini': { apiKey: '', hostname: 'localhost:8080', path: '/chat' }, // Default backend for Gemini
        'OpenAI': { apiKey: '', hostname: '', path: '' }
    };

    // Event listeners for API selection buttons
    selectGeminiButton.addEventListener('click', () => {
        console.log('Gemini button clicked');
        currentApi = 'Gemini';
        showApiConfigModal();
    });

    selectOpenAIButton.addEventListener('click', () => {
        console.log('OpenAI button clicked');
        currentApi = 'OpenAI';
        showApiConfigModal();
    });

    // Event listener for saving API configuration
    saveApiConfigButton.addEventListener('click', () => {
        console.log('Save API Config button clicked');
        saveApiConfiguration();
    });

    // Event listeners for sending messages
    sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        sendMessage();
    });
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            console.log('Enter key pressed in message input');
            sendMessage();
        }
    });

    function showApiConfigModal() {
        console.log('showApiConfigModal function called');
        const config = apiConfigurations[currentApi];
        modalApiKeyInput.value = config.apiKey;
        modalHostnameInput.value = config.hostname;
        modalOptionalPathInput.value = config.path;
        document.getElementById('apiConfigModalLabel').innerText = `Configure ${currentApi} API`;
        apiConfigModal.show();
    }

    function saveApiConfiguration() {
        apiConfigurations[currentApi] = {
            apiKey: modalApiKeyInput.value.trim(),
            hostname: modalHostnameInput.value.trim(),
            path: modalOptionalPathInput.value.trim()
        };
        console.log(`${currentApi} configuration saved:`, apiConfigurations[currentApi]);
        apiConfigModal.hide();
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        const config = apiConfigurations[currentApi];

        if (message) {
            displayMessage('You', message); // Display user message
            console.log('Sending message:', message);

            // Construct the URL based on saved configuration
            const url = `http://${config.hostname}${config.path}`;

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message, apiKey: config.apiKey, apiType: currentApi }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Backend response:', data);
                // Assuming backend response structure is { response: "..." }
                displayMessage('Backend', data.response); // Display backend response
            })
            .catch(error => {
                console.error('Error sending message:', error);
                displayMessage('System', `Error: ${error.message}`); // Display error message
            });

            messageInput.value = ''; // Clear input field
        }
    }

    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to the latest message
    }
});
