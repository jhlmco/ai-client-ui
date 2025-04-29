/**
 * @jest-environment jsdom
 */

// Mock the global fetch function
global.fetch = jest.fn();

// Mock the bootstrap.Modal
const mockModal = {
    show: jest.fn(),
    hide: jest.fn(),
};
global.bootstrap = {
    Modal: jest.fn(() => mockModal),
};

// Mock console.log to prevent excessive output during tests
global.console.log = jest.fn();
global.console.error = jest.fn();


describe('Renderer', () => {
    let chatbox;
    let messageInput;
    let sendButton;
    let selectGeminiButton;
    let selectOpenAIButton;
    let apiConfigModalElement;
    let modalApiKeyInput;
    let modalHostnameInput;
    let modalOptionalPathInput;
    let saveApiConfigButton;
    let modelBanner;
    let openaiModelSelect;

    beforeEach(() => {
        // Reset the DOM before each test
        document.body.innerHTML = `
            <div id="chatbox"></div>
            <input id="messageInput" />
            <button id="sendButton"></button>
            <button id="selectGemini"></button>
            <button id="selectOpenAI"></button>
            <div id="apiConfigModal">
                <div class="modal-content">
                    <h5 class="modal-title" id="apiConfigModalLabel"></h5>
                    <input id="modalApiKeyInput" />
                    <input id="modalHostnameInput" />
                    <input id="modalOptionalPathInput" />
                    <select id="openaiModelSelect"></select>
                    <button id="saveApiConfig"></button>
                </div>
            </div>
            <div id="modelBanner"></div>
        `;

        // Get elements after setting innerHTML
        chatbox = document.getElementById('chatbox');
        messageInput = document.getElementById('messageInput');
        sendButton = document.getElementById('sendButton');
        selectGeminiButton = document.getElementById('selectGemini');
        selectOpenAIButton = document.getElementById('selectOpenAI');
        apiConfigModalElement = document.getElementById('apiConfigModal');
        modalApiKeyInput = document.getElementById('modalApiKeyInput');
        modalHostnameInput = document.getElementById('modalHostnameInput');
        modalOptionalPathInput = document.getElementById('modalOptionalPathInput');
        saveApiConfigButton = document.getElementById('saveApiConfig');
        modelBanner = document.getElementById('modelBanner');
        openaiModelSelect = document.getElementById('openaiModelSelect');


        // Clear mocks before each test
        fetch.mockClear();
        mockModal.show.mockClear();
        mockModal.hide.mockClear();
        global.bootstrap.Modal.mockClear();
        global.console.log.mockClear();
        global.console.error.mockClear();

        // Re-require the renderer.js file to re-run the DOMContentLoaded listener
        jest.resetModules();
        require('./renderer.js');

        // Manually trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    test('should update model banner when Gemini is selected', () => {
        selectGeminiButton.click();
        expect(modelBanner.innerText).toBe('Selected Model: Gemini');
    });

    test('should update model banner when OpenAI is selected', () => {
        selectOpenAIButton.click();
        expect(modelBanner.innerText).toBe('Selected Model: OpenAI');
    });

    test('should display user message in chatbox', () => {
        messageInput.value = 'Test message';
        sendButton.click();
        expect(chatbox.innerHTML).toContain('<strong>You:</strong> Test message');
    });

    test('should clear message input after sending', () => {
        messageInput.value = 'Test message';
        sendButton.click();
        expect(messageInput.value).toBe('');
    });

    test('should show API config modal when selecting Gemini', () => {
        selectGeminiButton.click();
        expect(mockModal.show).toHaveBeenCalled();
        expect(document.getElementById('apiConfigModalLabel').innerText).toBe('Configure Gemini API');
    });

    test('should show API config modal when selecting OpenAI', () => {
        selectOpenAIButton.click();
        expect(mockModal.show).toHaveBeenCalled();
        expect(document.getElementById('apiConfigModalLabel').innerText).toBe('Configure OpenAI API');
    });

    test('should save API configuration when save button is clicked', () => {
        selectGeminiButton.click(); // Select Gemini to populate modal inputs
        modalApiKeyInput.value = 'gemini-key';
        modalHostnameInput.value = 'gemini-host';
        modalOptionalPathInput.value = '/gemini-path';
        saveApiConfigButton.click();

        // We can't directly access apiConfigurations, but we can check if the modal is hidden
        expect(mockModal.hide).toHaveBeenCalled();
    });

    // Add tests for fetch calls (sendMessage and fetchOpenAIModels) with mocking
    test('sendMessage should make a fetch call with correct parameters for Gemini', async () => {
        selectGeminiButton.click(); // Select Gemini
        modalApiKeyInput.value = 'gemini-key';
        modalHostnameInput.value = 'localhost:8080';
        modalOptionalPathInput.value = '/chat';
        saveApiConfigButton.click(); // Save config

        messageInput.value = 'Hello Gemini';
        sendButton.click();

        // Wait for the fetch promise to resolve
        await new Promise(process.nextTick);

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/chat',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello Gemini', apiKey: 'gemini-key', apiType: 'Gemini', model: null }),
            }
        );
    });

    test('sendMessage should make a fetch call with correct parameters for OpenAI', async () => {
        selectOpenAIButton.click(); // Select OpenAI
        modalApiKeyInput.value = 'openai-key';
        modalHostnameInput.value = 'openai-host';
        modalOptionalPathInput.value = '/openai-path';
        saveApiConfigButton.click(); // Save config

        // Mock fetch for fetchOpenAIModels first
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ Models: ['model-a', 'model-b'] }),
        });

        // Re-open modal to trigger fetchOpenAIModels and select a model
        selectOpenAIButton.click();
        await new Promise(process.nextTick); // Wait for fetchOpenAIModels to complete

        // Select a model in the mocked dropdown
        openaiModelSelect.value = 'model-b';
        openaiModelSelect.dispatchEvent(new Event('change'));


        messageInput.value = 'Hello OpenAI';
        sendButton.click();

        // Wait for the sendMessage fetch promise to resolve
        await new Promise(process.nextTick);

        expect(fetch).toHaveBeenCalledWith(
            'http://openai-host/openai-path',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello OpenAI', apiKey: 'openai-key', apiType: 'OpenAI', model: 'model-b' }),
            }
        );
    });

    test('fetchOpenAIModels should fetch models and populate dropdown', async () => {
        selectOpenAIButton.click(); // Select OpenAI to trigger modal and fetch

        const mockModels = { Models: ['model1', 'model2', 'model3'] };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockModels),
        });

        // Manually trigger showApiConfigModal after setting up the mock
        const apiConfigModal = new bootstrap.Modal(apiConfigModalElement);
        apiConfigModal.show();


        await new Promise(process.nextTick); // Wait for the fetch promise to resolve

        expect(fetch).toHaveBeenCalledWith('http://openai-host/models?apiKey=', expect.any(Object)); // Check URL and method
        expect(openaiModelSelect.options.length).toBe(mockModels.Models.length);
        expect(openaiModelSelect.options[0].text).toBe('model1');
        expect(openaiModelSelect.options[1].text).toBe('model2');
        expect(openaiModelSelect.options[2].text).toBe('model3');
        expect(openaiModelSelect.value).toBe('model1'); // Check if the first model is selected by default
    });

    test('fetchOpenAIModels should handle fetch error', async () => {
        selectOpenAIButton.click(); // Select OpenAI to trigger modal and fetch

        fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

        // Manually trigger showApiConfigModal after setting up the mock
        const apiConfigModal = new bootstrap.Modal(apiConfigModalElement);
        apiConfigModal.show();

        await new Promise(process.nextTick); // Wait for the fetch promise to reject

        expect(openaiModelSelect.options.length).toBe(1);
        expect(openaiModelSelect.options[0].text).toBe('Error loading models');
        expect(global.console.error).toHaveBeenCalledWith('Error fetching OpenAI models:', expect.any(Error));
    });

    test('sendMessage should display error message on fetch error', async () => {
        selectGeminiButton.click(); // Select Gemini
        modalApiKeyInput.value = 'gemini-key';
        modalHostnameInput.value = 'localhost:8080';
        modalOptionalPathInput.value = '/chat';
        saveApiConfigButton.click(); // Save config

        messageInput.value = 'Hello Gemini';
        fetch.mockRejectedValueOnce(new Error('Network error'));
        sendButton.click();

        await new Promise(process.nextTick); // Wait for the fetch promise to reject

        expect(chatbox.innerHTML).toContain('<strong>System:</strong> Error: Network error');
    });

    test('sendMessage should display error message on non-ok response', async () => {
        selectGeminiButton.click(); // Select Gemini
        modalApiKeyInput.value = 'gemini-key';
        modalHostnameInput.value = 'localhost:8080';
        modalOptionalPathInput.value = '/chat';
        saveApiConfigButton.click(); // Save config

        messageInput.value = 'Hello Gemini';
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        });
        sendButton.click();

        await new Promise(process.nextTick); // Wait for the fetch promise to resolve

        expect(chatbox.innerHTML).toContain('<strong>System:</strong> Error: HTTP error! status: 500');
    });
});
