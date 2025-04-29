const { app, BrowserWindow, session } = require('electron');

app.disableHardwareAcceleration()

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Configure proxy settings
    const ses = session.defaultSession;
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const noProxy = process.env.NO_PROXY;

    let proxyRules = '';
    if (proxy) {
        proxyRules = proxy;
        if (noProxy) {
            proxyRules += `,bypass=${noProxy}`;
        }
    }

    ses.setProxy({
        proxyRules: proxyRules,
        proxyBypassRules: noProxy // This might be redundant with bypass in proxyRules, but good to be explicit
    }).then(() => {
        console.log('Proxy settings applied:', proxyRules);
        win.loadFile('index.html');
    }).catch((err) => {
        console.error('Error setting proxy:', err);
        win.loadFile('index.html'); // Load even if proxy setting fails
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
