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

let qrCode = null;

const logoDropArea = document.getElementById('logo-drop-area');
const logoInput = document.getElementById('logo');

logoDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropArea.style.backgroundColor = '#f0f0f0';
});

logoDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropArea.style.backgroundColor = '#fff';
    const file = e.dataTransfer.files[0];
    logoInput.files = e.dataTransfer.files;
    generateQrCode();
});

logoDropArea.addEventListener('click', () => {
    logoInput.click();
});


const typeRadios = document.getElementsByName('type');
const inputTextArea = document.getElementById('input-text-area');
const inputWifiArea = document.getElementById('input-wifi-area');
const inputContactArea = document.getElementById('input-contact-area');
const inputEmailArea = document.getElementById('input-email-area');

typeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        inputTextArea.style.display = radio.value === 'text' ? 'block' : 'none';
        inputWifiArea.style.display = radio.value === 'wifi' ? 'block' : 'none';
        inputContactArea.style.display = radio.value === 'contact' ? 'block' : 'none';
        inputEmailArea.style.display = radio.value === 'email' ? 'block' : 'none';
    });
});

generateButton.addEventListener('click', () => {
    const qrCodeOptions = getQrCodeOptions();
    applyQrCodeOptions(qrCodeOptions);
});

function getQrCodeOptions() {
    let text = '';
    let selectedType = document.querySelector('input[name="type"]:checked').value;

    if (selectedType === 'text') {
        text = document.getElementById('text').value;
    } else if (selectedType === 'wifi') {
        const ssid = document.getElementById('ssid').value;
        const password = document.getElementById('password').value;
        text = `WIFI:S:${ssid};T:WPA;P:${password};;`;
    } else if (selectedType === 'contact') {
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        text = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=WORK,VOICE:${phone}\nEMAIL;TYPE=WORK,INTERNET:${email}\nEND:VCARD`;
    } else if (selectedType === 'email') {
        const emailAddress = document.getElementById('email-address').value;
        const phoneNumber = document.getElementById('phone-number').value;
        text = `mailto:${emailAddress}?body=${phoneNumber}`;
    }

    const foregroundColor = document.getElementById('foreground').value;
    const backgroundColor = document.getElementById('background').value;
    const size = parseInt(document.getElementById('size').value);
    const margin = parseInt(document.getElementById('margin').value);
    const ecc = document.getElementById('ecc').value;

    return {
        width: size,
        height: size,
        data: text,
        margin: margin,
        qrOptions: {
            errorCorrectionLevel: ecc
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.2,
            margin: 0,
        },
        dotsOptions: {
            color: document.getElementById('foreground-gradient').value,
            type: 'rounded',
        },
        backgroundOptions: {
            color: document.getElementById('transparent').checked ? 'transparent' : backgroundColor,
        },
        image: logoInput.files && logoInput.files[0] ? URL.createObjectURL(logoInput.files[0]) : null,
    };
}

function applyQrCodeOptions(options) {
    if (qrCode) {
        qrCode.clear();
    }

    qrCode = new QRCodeStyling(options);

    try {
        qrCode.append(qrCodeDiv);
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code. Please check your input.');
    }
}

logoInput.addEventListener('change', () => {
    generateQrCode();
});

function downloadSVG() {
    const text = textInput.value;
    const size = parseInt(sizeInput.value);
    const ecc = eccSelect.value;

    QRCode.toString(text, {
        errorCorrectionLevel: ecc,
        type: 'svg',
        width: size,
    }, function (err, svg) {
        if (err) throw err

        let downloadLink = document.createElement('a');
        downloadLink.href = 'data:image/svg+xml;base64,' + btoa(svg);
        downloadLink.download = 'qrcode.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    })
}

downloadPngButton.addEventListener('click', () => {
    const canvas = qrCodeDiv.querySelector('canvas');
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

const copyClipboardButton = document.getElementById('copy-clipboard');
copyClipboardButton.addEventListener('click', async () => {
    const canvas = qrCodeDiv.querySelector('canvas');
    const image = canvas.toDataURL('image/png');
    const blob = await (await fetch(image)).blob();
    const item = new ClipboardItem({
        'image/png': blob
    });
    await navigator.clipboard.write([item]);
    alert('QR code copied to clipboard!');
});

const shareButton = document.getElementById('share');

if (navigator.share) {
    shareButton.addEventListener('click', async () => {
        const canvas = qrCodeDiv.querySelector('canvas');
        const image = canvas.toDataURL('image/png');
        const blob = await (await fetch(image)).blob();
        const files = [new File([blob], 'qrcode.png', { type: 'image/png' })];
        const shareData = {
            files: files,
            title: 'QR Code',
            text: 'Share your QR code'
        };
        try {
            await navigator.share(shareData);
            console.log('QR code shared successfully');
        } catch (err) {
            console.log('Error sharing QR code:', err);
        }
    });
} else {
    shareButton.style.display = 'none';
}

downloadSvgButton.addEventListener('click', downloadSVG);