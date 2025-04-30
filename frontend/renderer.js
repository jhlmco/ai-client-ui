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
    const modelBanner = document.getElementById('modelBanner');
    console.log('modelBanner element:', modelBanner);

    let currentApi = 'Gemini'; // Default API
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const configFile = 'config.json';

try {
    const configFileContent = fs.readFileSync(configFile, 'utf8');
    var config = JSON.parse(configFileContent);
} catch (error) {
    console.log(error);
    var config = {
        openaiHostname: process.env.OPENAI_HOSTNAME || "localhost:8080",
        openaiPath: process.env.OPENAI_PATH || "/v1",
        apiKey: process.env.OPENAI_API_KEY || ""
    }
}

const apiConfigurations = {
    'Gemini': { apiKey: '', hostname: 'localhost:8080', path: '/chat' }, // Default backend for Gemini
    'OpenAI': { apiKey: config.apiKey, hostname: config.openaiHostname, path: config.openaiPath }
};
console.log('API Configurations:', apiConfigurations);

    // Function to update the model banner
    function updateModelBanner() {
        modelBanner.innerText = `Selected Model: ${currentApi}`;
    }

    // Event listeners for API selection buttons
    selectGeminiButton.addEventListener('click', () => {
        console.log('Gemini button clicked');
        currentApi = 'Gemini';
        updateModelBanner();
        showApiConfigModal();
        openaiModelSelect.style.display = 'none'; // Hide the model select
        openaiModelSelect.value = ''; // Clear the selected model
    });

    selectOpenAIButton.addEventListener('click', () => {
        console.log('OpenAI button clicked');
        currentApi = 'OpenAI';
        updateModelBanner();
        showApiConfigModal();
        if (openaiModelSelect.options.length > 0) {
            openaiModelSelect.style.display = 'block'; // Show the model select
        }
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
    messageInput.addEventListener('input', () => {
        console.log('Input changed');
    });

    function showApiConfigModal() {
        console.log('showApiConfigModal function called');
        const config = apiConfigurations[currentApi];
        modalApiKeyInput.value = config.apiKey;
        modalHostnameInput.value = config.openaiHostname;
        modalOptionalPathInput.value = config.path;
        document.getElementById('apiConfigModalLabel').innerText = `Configure ${currentApi} API`;

        apiConfigModal.show();
    }

    function saveApiConfiguration() {
        const apiKey = modalApiKeyInput.value.trim();
        const hostname = modalHostnameInput.value.trim(); // This will be the OpenAI API hostname for OpenAI
        const path = modalOptionalPathInput.value.trim(); // This will be the OpenAI API path for OpenAI

        if (currentApi === 'OpenAI') {
            apiConfigurations[currentApi] = {
                apiKey: apiKey,
                openaiHostname: hostname, // Store OpenAI API hostname separately
                openaiPath: path, // Store OpenAI API path separately
                model: currentOpenAIModel,
                // Keep the backend hostname and path for OpenAI calls to the backend
                hostname: apiConfigurations[currentApi].hostname || 'localhost:8080', // Default backend hostname
                path: apiConfigurations[currentApi].path || '/chat' // Default backend path
            };
        } else {
             apiConfigurations[currentApi] = {
                apiKey: apiKey,
                hostname: hostname,
                path: path,
                model: currentOpenAIModel // This might not be relevant for Gemini, but keep for consistency
            };
        }

        console.log(`${currentApi} configuration saved:`, apiConfigurations[currentApi]);
        apiConfigModal.hide();
        if (currentApi === 'OpenAI') {
            fetchOpenAIModels();
        }
    }


    function displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to the latest message
    }

    const openaiModelSelect = document.getElementById('openaiModelSelect');
    openaiModelSelect.style.display = 'none'; // Hide the model select until OpenAI is chosen
    let currentOpenAIModel = '';

    // Function to fetch OpenAI models from the backend
    async function fetchOpenAIModels() {
        try {
            const config = apiConfigurations['OpenAI'];
            const url = `http://localhost:8080/models`;

            const requestBody = {
                apiKey: config.apiKey,
                openaiHostname: config.openaiHostname,
                openaiPath: config.openaiPath
            };

            const response = await fetch(url, {
                method: 'POST', // Change to POST to send request body
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.models) {
                console.log('OpenAI models:', data.models);
                // Populate the dropdown with model names
                openaiModelSelect.innerHTML = ''; // Clear existing options
                data.models.sort().forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.text = model;
                    openaiModelSelect.appendChild(option);
                });
                if (data.models.length > 0) {
                    currentOpenAIModel = data.models[0]; // Select the first model by default
                    openaiModelSelect.value = currentOpenAIModel; // Set the selected value
                }
            } else {
                openaiModelSelect.innerHTML = '<option>No models available</option>';
            }
        } catch (error) {
            console.error('Error fetching OpenAI models:', error);
            openaiModelSelect.innerHTML = '<option>Error loading models</option>';
        }
    }

    // Event listener for OpenAI model selection
    openaiModelSelect.addEventListener('change', () => {
        currentOpenAIModel = openaiModelSelect.value;
        console.log('Selected OpenAI model:', currentOpenAIModel);
    });

    // Function to reload OpenAI models
    function reloadOpenAIModels() {
        if (currentApi === 'OpenAI') {
            fetchOpenAIModels();
        }
    }

    // Modify the sendMessage function to include the selected model
    async function sendMessage() {
        try {
            const message = messageInput.value.trim();
            if (message) {
                displayMessage('You', message); // Display user

                const requestBody = {
                    message: message,
                    apiKey: apiConfigurations[currentApi].apiKey,
                    apiType: currentApi,
                    model: currentOpenAIModel
                };

                if (currentApi === 'OpenAI') {
                    requestBody.openaiHostname = apiConfigurations[currentApi].openaiHostname;
                    requestBody.openaiPath = apiConfigurations[currentApi].openaiPath;
                }

                const response = await fetch('http://localhost:8080/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Backend response:', data);
                // Assuming backend response structure is { response: "..." }
                displayMessage('Backend', data.response); // Display backend response
            }
        } catch (error) {
            console.error('Error sending message:', error);
            displayMessage('System', `Error: ${error.message}`); // Display error message
        } finally {
            messageInput.value = ''; // Clear input field
        }
    }
});
