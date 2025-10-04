// 🔧 DOM Elements
const textInput = document.getElementById('text');
const generateButton = document.getElementById('generate');
const qrCodeDiv = document.getElementById('qrcode');
const foregroundColorInput = document.getElementById('foreground');
const backgroundColorInput = document.getElementById('background');
const sizeInput = document.getElementById('size');
const marginInput = document.getElementById('margin');
const eccSelect = document.getElementById('ecc');
const downloadPngButton = document.getElementById('download-png');
const downloadSvgButton = document.getElementById('download-svg');
const foregroundGradientInput = document.getElementById('foreground-gradient');
const transparentCheckbox = document.getElementById('transparent');
const logoDropArea = document.getElementById('logo-drop-area');
const logoInput = document.getElementById('logo');
const logoSizeInput = document.getElementById('logo-size');
const logoSizeLabel = document.getElementById('logo-size-label');

// 👤 Type-based Sections
const inputTextArea = document.getElementById('input-text-area');
const inputWifiArea = document.getElementById('input-wifi-area');
const inputContactArea = document.getElementById('input-contact-area');
const inputEmailArea = document.getElementById('input-email-area');
const typeRadios = document.getElementsByName('type');

let qrCode = null;

// ✅ Utilities
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 opacity-100 transition-opacity duration-500';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function toggleSection(section, show) {
    if (show) {
        section.classList.remove('hidden', 'opacity-0');
        section.classList.add('opacity-100', 'transition-all', 'duration-300');
    } else {
        section.classList.add('opacity-0');
        setTimeout(() => section.classList.add('hidden'), 300);
    }
}

// 🖼️ Drag-and-Drop Logo Upload
logoDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropArea.style.backgroundColor = '#f0f0f0';
});
logoDropArea.addEventListener('dragleave', () => {
    logoDropArea.style.backgroundColor = '#fff';
});
logoDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropArea.style.backgroundColor = '#fff';
    const file = e.dataTransfer.files[0];
    // Validate file before assigning
    handleLogoFiles(e.dataTransfer.files);
});
logoDropArea.addEventListener('click', () => logoInput.click());
logoInput.addEventListener('change', () => handleLogoFiles(logoInput.files));

let currentLogoUrl = null;
function handleLogoFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    // Only allow images and limit size to 2MB for production safety
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Logo must be PNG, JPG, WEBP, or SVG.');
        return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
        showToast('Logo file must be smaller than 2MB.');
        return;
    }

    // Revoke previous URL if present
    if (currentLogoUrl) {
        URL.revokeObjectURL(currentLogoUrl);
        currentLogoUrl = null;
    }

    // Assign file to input (so downloads/export code can refer to it) and set object URL
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    logoInput.files = dataTransfer.files;
    currentLogoUrl = URL.createObjectURL(file);
    // regenerate preview
    generateQrCode();
}

// 🔄 Type Switching
typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        toggleSection(inputTextArea, radio.value === 'text');
        toggleSection(inputWifiArea, radio.value === 'wifi');
        toggleSection(inputContactArea, radio.value === 'contact');
        toggleSection(inputEmailArea, radio.value === 'email');
        generateQrCode(); // Update QR preview on type switch
    });
});

// 📦 QR Code Options
function getQrCodeOptions() {
    const selectedType = document.querySelector('input[name="type"]:checked').value;
    let text = '';

    if (selectedType === 'text') {
        text = textInput.value.trim();
        if (!text) {
            showToast("Please enter text or URL.");
            return null;
        }
    } else if (selectedType === 'wifi') {
        const ssid = document.getElementById('ssid').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!ssid || !password) {
            showToast("WiFi SSID and password are required.");
            return null;
        }
        text = `WIFI:S:${ssid};T:WPA;P:${password};;`;
    } else if (selectedType === 'contact') {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        if (!name || !phone || !email) {
            showToast("Contact info incomplete.");
            return null;
        }
        text = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=WORK,VOICE:${phone}\nEMAIL;TYPE=WORK,INTERNET:${email}\nEND:VCARD`;
    } else if (selectedType === 'email') {
        const emailAddress = document.getElementById('email-address').value.trim();
        const phoneNumber = document.getElementById('phone-number').value.trim();
        if (!emailAddress) {
            showToast("Email address is required.");
            return null;
        }
        text = `mailto:${emailAddress}?body=${phoneNumber}`;
    }

    // Validate and clamp size/margin inputs to sane production values
    const rawSize = parseInt(sizeInput.value, 10) || 256;
    const size = Math.min(Math.max(rawSize, 64), 4096); // clamp between 64 and 4096
    const rawMargin = parseInt(marginInput.value, 10) || 0;
    const margin = Math.min(Math.max(rawMargin, 0), 200);

    return {
        // width/height control export dimensions. The on-screen preview is constrained by CSS (#qrcode 300x300).
        width: size,
        height: size,
        data: text,
        margin: margin,
        qrOptions: {
            errorCorrectionLevel: eccSelect.value
        },
        imageOptions: {
            hideBackgroundDots: true,
            // imageSize is a fraction (0.0 - 1.0). Use logo-size slider if present.
            imageSize: (logoSizeInput ? Math.min(Math.max(parseInt(logoSizeInput.value, 10), 5), 50) : 30) / 100,
            margin: 0,
        },
        dotsOptions: {
            color: foregroundGradientInput.value,
            type: 'rounded',
        },
        backgroundOptions: {
            color: transparentCheckbox.checked ? 'transparent' : backgroundColorInput.value,
        },
        image: logoInput.files && logoInput.files[0] ? URL.createObjectURL(logoInput.files[0]) : null,
    };
}

// ⚙️ QR Code Generator
function generateQrCode() {
    const options = getQrCodeOptions();
    if (!options) return;

    qrCodeDiv.innerHTML = ''; // clear previous
    qrCode = new QRCodeStyling(options);

    try {
        qrCode.append(qrCodeDiv);
    } catch (err) {
        console.error('Error generating QR code:', err);
        showToast("Failed to generate QR code.");
    }
}

// ⏩ Generate on button click
generateButton.addEventListener('click', generateQrCode);

// Generate an initial preview on page load so the fixed-size preview/CSS behavior is visible immediately.
window.addEventListener('load', () => {
    // If there's any pre-filled text, generate; otherwise leave blank until user clicks Generate.
    if (textInput.value.trim()) generateQrCode();
});

// 🔁 Live Preview (Debounced)
[
    textInput,
    document.getElementById('ssid'),
    document.getElementById('password'),
    document.getElementById('name'),
    document.getElementById('phone'),
    document.getElementById('email'),
    document.getElementById('email-address'),
    document.getElementById('phone-number'),
    foregroundGradientInput,
    backgroundColorInput,
    sizeInput,
    marginInput,
    eccSelect,
    transparentCheckbox
].forEach(input => {
    input.addEventListener('input', debounce(generateQrCode, 300));
});

// Logo size slider behaviour
if (logoSizeInput && logoSizeLabel) {
    logoSizeLabel.textContent = logoSizeInput.value + '%';
    logoSizeInput.addEventListener('input', () => {
        logoSizeLabel.textContent = logoSizeInput.value + '%';
        debounce(generateQrCode, 150)();
    });
}


function revokeLogoUrl() {
    try {
        if (currentLogoUrl) {
            URL.revokeObjectURL(currentLogoUrl);
            currentLogoUrl = null;
        }
    } catch (e) {
    }
}
window.addEventListener('pagehide', revokeLogoUrl, {capture: true});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') revokeLogoUrl();
});

// 💾 Download PNG
downloadPngButton.addEventListener('click', () => {
    const canvas = qrCodeDiv.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("QR code downloaded as PNG.");
});

// 💾 Download SVG
function downloadSVG() {
    // Try to use the QRCodeStyling instance to get SVG directly
    if (qrCode && typeof qrCode.getRawData === 'function') {
        qrCode.getRawData('svg').then(svg => {
            const link = document.createElement('a');
            link.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
            link.download = 'qrcode.svg';
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('QR code downloaded as SVG.');
        }).catch(err => {
            console.error('SVG export error:', err);
            showToast('SVG export failed.');
        });
        return;
    }

    // Fallback: try to export from a canvas if present
    const canvas = qrCodeDiv.querySelector('canvas');
    if (canvas) {
        // Convert canvas to PNG and embed in SVG wrapper as a fallback (not ideal but functional)
        const png = canvas.toDataURL('image/png');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${png}" width="100%" height="100%"/></svg>`;
        const link = document.createElement('a');
        link.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('QR code downloaded as SVG (raster fallback).');
        return;
    }

    showToast('No QR data available to export as SVG. Generate a QR code first.');
}
downloadSvgButton.addEventListener('click', downloadSVG);

// 📋 Copy to Clipboard
const copyClipboardButton = document.getElementById('copy-clipboard');
copyClipboardButton.addEventListener('click', async () => {
    const canvas = qrCodeDiv.querySelector('canvas');
    if (!canvas) return;

    const image = canvas.toDataURL('image/png');
    const blob = await (await fetch(image)).blob();
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    showToast("QR code copied to clipboard!");
});

// 📤 Web Share API
const shareButton = document.getElementById('share');
if (navigator.share) {
    shareButton.addEventListener('click', async () => {
        const canvas = qrCodeDiv.querySelector('canvas');
        if (!canvas) return;

        const image = canvas.toDataURL('image/png');
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });

        try {
            await navigator.share({
                files: [file],
                title: 'QR Code',
                text: 'Here is your QR code!',
            });
            showToast("QR code shared successfully!");
        } catch (err) {
            console.error('Error sharing QR code:', err);
            showToast("Sharing failed.");
        }
    });
} else {
    shareButton.style.display = 'none';
}
