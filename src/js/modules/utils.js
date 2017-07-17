const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const _hexEncodeArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
let unconfirmedTransactions = 0;

/**
* b32encode() Encode a string to base32
*
* @param {string} s - A string
*
* @return {string} - The encoded string
*/
let b32encode = function(s) {
    let parts = [];
    let quanta = Math.floor((s.length / 5));
    let leftover = s.length % 5;

    if (leftover != 0) {
        for (let i = 0; i < (5 - leftover); i++) {
            s += '\x00';
        }
        quanta += 1;
    }

    for (let i = 0; i < quanta; i++) {
        parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x3F) >> 1)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 1) & 0x01) << 4) | (s.charCodeAt(i * 5 + 2) >> 4)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 2) & 0x0F) << 1) | (s.charCodeAt(i * 5 + 3) >> 7)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x7F) >> 2)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 3) & 0x03) << 3) | (s.charCodeAt(i * 5 + 4) >> 5)));
        parts.push(alphabet.charAt(((s.charCodeAt(i * 5 + 4) & 0x1F))));
    }

    let replace = 0;
    if (leftover == 1) replace = 6;
    else if (leftover == 2) replace = 4;
    else if (leftover == 3) replace = 3;
    else if (leftover == 4) replace = 1;

    for (let i = 0; i < replace; i++) parts.pop();
    for (let i = 0; i < replace; i++) parts.push("=");

    return parts.join("");
}

/**
* b32decode() Decode a base32 string.
* This is made specifically for our use, deals only with proper strings
*
* @param {string} s - A base32 string
*
* @return {Uint8Array} - The decoded string
*/
let b32decode = function(s) {
    let r = new ArrayBuffer(s.length * 5 / 8);
    let b = new Uint8Array(r);
    for (let j = 0; j < s.length / 8; j++) {
        let v = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 8; ++i) {
            v[i] = alphabet.indexOf(s[j * 8 + i]);
        }
        let i = 0;
        b[j * 5 + 0] = (v[i + 0] << 3) | (v[i + 1] >> 2);
        b[j * 5 + 1] = ((v[i + 1] & 0x3) << 6) | (v[i + 2] << 1) | (v[i + 3] >> 4);
        b[j * 5 + 2] = ((v[i + 3] & 0xf) << 4) | (v[i + 4] >> 1);
        b[j * 5 + 3] = ((v[i + 4] & 0x1) << 7) | (v[i + 5] << 2) | (v[i + 6] >> 3);
        b[j * 5 + 4] = ((v[i + 6] & 0x7) << 5) | (v[i + 7]);
    }
    return b;
}

/**
 * char2Id() Gets the network id from the starting char of an address
 *
 * @param {string} startChar - A starting char from an address
 *
 * @return {number} - The network id
 */
let char2Id = function(startChar) {
    if (startChar === "N") {
        return 104;
    } else if (startChar === "T") {
        return -104;
    } else {
        return 96;
    }
}

var intervals = new Array();
window.oldSetInterval = window.setInterval;
window.setInterval = function(func, interval) {
    intervals.push(oldSetInterval(func, interval));
}

/**
* clearIntervals() Clears all intervals in the extension
*
*/
function clearIntervals() {
    for (let interval in intervals) {
       window.clearInterval(interval);
    }
    intervals = [];
}

/**
* createPRNG() Creates a PRNG wallet
*
*/
function createPRNG() {
    const walletName = $('#wallet-name').val();
    const walletPassword = $('#wallet-password').val();
    const network = $('#wallet-network').val()

    if (walletName == "" || walletPassword == "") {
        $('#error-message').show();
    }
    else {
        const wallet = nem.model.wallet.createPRNG(walletName, walletPassword, parseInt(network));
        // Save it using the Chrome extension storage API.

        chrome.storage.local.clear(() => {
            chrome.storage.local.set({'default_xem_wallet': wallet}, () => {
                exportWallet();
                renderHome();
            });
        });
    }
}

/**
 * exportWallet() Exports the wallet of the user
 *
 */
function exportWallet() {
    chrome.storage.local.get('default_xem_wallet', function(data) {
        // Convert stringified wallet object to word array
        var wordArray = nem.crypto.js.enc.Utf8.parse(JSON.stringify(data.default_xem_wallet));

        // Word array to base64
        var base64 = nem.crypto.js.enc.Base64.stringify(wordArray);

        var blob = new Blob([base64], {type: 'text'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, 'wallet.wlt');
        }
        else{
            var elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = `${data.default_xem_wallet.name}.wlt`;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    });
}

/**
 * finishImport() Finishes the import of a wallet
 *
 */
function finishImport() {
    // Wallet base64 to word array
    let parsedWordArray = nem.crypto.js.enc.Base64.parse(fr.result);
    // Word array to wallet string
    let walletStr = parsedWordArray.toString(nem.crypto.js.enc.Utf8);
    // Wallet string to JSON object
    wallet = JSON.parse(walletStr);
    chrome.storage.local.clear(() => {
        chrome.storage.local.set({'default_xem_wallet': wallet}, function() {console.log("Wallet imported successfully.");});
        clearIntervals();
        renderHome();
    });
}

/**
* fmtAddress() Add hyphens to a clean address
*
* @param {string} input - A NEM address
*
* @return {string} -  a formatted NEM address
*/
function fmtAddress(input) {
    return input && input.toUpperCase().replace(/-/g, '').match(/.{1,6}/g).join('-');
}


/**
* fmtHexToUtf8() Convert hex to utf8
*
* @param data: Hex data
*
* @return result: utf8 string
*/
function fmtHexToUtf8(data) {
    if (data === undefined) return data;
    let o = data;
    if (o && o.length > 2 && o[0] === 'f' && o[1] === 'e') {
        return "HEX: " + o.slice(2);
    }
    let result;
    try {
        result = decodeURIComponent(escape(hex2a(o)))
    } catch (e) {
        //result = "Error, message not properly encoded !";
        result = hex2a(o);
        console.log('invalid text input: ' + data);
    }
    //console.log(decodeURIComponent(escape( hex2a(o) )));*/
    //result = hex2a(o);
    return result;
}


/**
* fmtNemValue() Format a NEM Value
*
* @param {number} data - A NEM value
*
* @return {string} - a formatted NEM Value
*/
function fmtNemValue(data) {
    if (data === undefined) return data;
    let o = data;
    if (!o) {
        return ["0", '000000'];
    } else {
        o = o / 1000000;
        let b = o.toFixed(6).split('.');
        let r = b[0].split(/(?=(?:...)*$)/).join(" ");
        return [r, b[1]];
    }
}

/**
* getCommon() Gets the common object of the user
*
* @param {object} wallet - A NEM wallet object
* @param {string} password - A wallet password
*
* @return {object} - a common object
*/
function getCommon(wallet, password) {
    // Create a common object
    const common = nem.model.objects.create("common")(password, "");

    // Get the wallet account to decrypt
    var walletAccount = wallet.accounts[0];

    // Decrypt account private key
    nem.crypto.helpers.passwordToPrivatekey(common, walletAccount, walletAccount.algo);

    // The common object now has a private key
    return common;
}

/**
* hex2a() Converts an hex string to an ASCII string
*
* @param {string} hexx - An hex string
*
* @return {string} the ASCII string conversion of hexx
*/
function hex2a(hexx) {
    if (!hexx) return '';
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

/**
 * Gets the starting char of the addresses of a network id
 *
 * @param {number} id - A network id
 *
 * @return {string} - The starting char of addresses
 */
let id2Char = function(id) {
    if (id === 104) {
        return "N";
    } else if (id === -104) {
        return "T";
    } else {
        return "M";
    }
}

/**
 * Gets a network prefix from network id
 *
 * @param {number} id - A network id
 *
 * @return {string} - The network prefix
 */
let id2Prefix = function(id) {
    if (id === 104) {
        return "68";
    } else if (id === -104) {
        return "98";
    } else {
        return "60";
    }
}

/**
 * importWallet() Imports a wallet from the storage of the user
 *
 */
function importWallet() {
    file = $('#wallet-file')[0].files[0];
    fr = new FileReader();
    fr.onload = finishImport;
    fr.readAsText(file);
}

/**
 * Check if an input amount is valid
 *
 * @param {string} n - The number as a string
 *
 * @return {boolean} - True if valid, false otherwise
 */
let isAmountValid = function(n) {
    // Force n as a string and replace decimal comma by a dot if any
    var nn = Number(n.toString().replace(/,/g, '.'));
    return !Number.isNaN(nn) && Number.isFinite(nn) && nn >= 0;
}

/**
* Check if an address is from a specified network
*
* @param {string} _address - An address
* @param {number} networkId - A network id
*
* @return {boolean} - True if address is from network, false otherwise
*/
let isFromNetwork = function(_address, networkId) {
    let address = _address.toString().toUpperCase().replace(/-/g, '');
    let a = address[0];
    return id2Char(networkId) === a;
};

/**
* Check if an address is valid
*
* @param {string} _address - An address
*
* @return {boolean} - True if address is valid, false otherwise
*/
let isValid = function(_address) {
    let address = _address.toString().toUpperCase().replace(/-/g, '');
    address = _address.toString().toUpperCase().replace(/ /g, '');
    if (!address || address.length !== 40) {
        return false;
    }
    let decoded = ua2hex(b32decode(address));
    let versionPrefixedRipemd160Hash = nem.crypto.js.enc.Hex.parse(decoded.slice(0, 42));
    let tempHash = nem.crypto.js.SHA3(versionPrefixedRipemd160Hash, {
        outputLength: 256
    });
    let stepThreeChecksum = nem.crypto.js.enc.Hex.stringify(tempHash).substr(0, 8);

    return stepThreeChecksum === decoded.slice(42);
};

/**
* logout() Logs the user out of the app
*
*/
function logout() {
    chrome.storage.local.clear();
    renderHome();
}

/**
* sendTransaction() Sends a transaction with the parameters specified by the user
*
*/
function sendTransaction() {
    const recipient = nem.model.address.clean($('#recipient').val());
    const amount = nem.utils.helpers.cleanTextAmount($('#amount').val());
    const message = $('#message').val();
    const password = $('#password').val();

    if (recipient == "" || amount == "") {
        $('#incomplete-error-message').show();
        $('#wrong-address-message').hide();
        $('#wrong-amount-message').hide();
    }
    else if (!isValid(recipient)) {
        $('#incomplete-error-message').hide();
        $('#wrong-amount-message').hide();
        $('#wrong-address-error-message').show();
    }
    else if (!isAmountValid(amount)) {
        $('#incomplete-error-message').hide();
        $('#wrong-address-message').hide();
        $('#wrong-amount-error-message').show();
    }
    else {
        const transferTransaction = nem.model.objects.create("transferTransaction")(recipient, amount, message);

        chrome.storage.local.get('default_xem_wallet', function(data) {
            if (!isFromNetwork(data.default_xem_wallet.accounts[0].address, data.default_xem_wallet.accounts[0].network)) {
                $('#wrong-amount-error-message').show();
                return;
            }
            let common = getCommon(data.default_xem_wallet, password);
            const transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.testnet.id);
            try {
                nem.model.transactions.send(common, transactionEntity, endpoint).then((res) => {
                    if (res.code >= 2) {
                        $('#an-error-message').show();
                    }
                    $('#success-message').show();
                });
            } catch(err) {
                $('#an-error-message').show();
    		};
        });
    }
}

/**
* Convert a public key to a NEM address
*
* @param {string} publicKey - A public key
* @param {number} networkId - A network id
*
* @return {string} - The NEM address
*/
let toAddress = function(publicKey, networkId) {
    let binPubKey = nem.crypto.js.enc.Hex.parse(publicKey);
    let hash = nem.crypto.js.SHA3(binPubKey, {
        outputLength: 256
    });
    let hash2 = nem.crypto.js.RIPEMD160(hash);
    // 98 is for testnet
    let networkPrefix = id2Prefix(networkId);
    let versionPrefixedRipemd160Hash = networkPrefix + nem.crypto.js.enc.Hex.stringify(hash2);
    let tempHash = nem.crypto.js.SHA3(nem.crypto.js.enc.Hex.parse(versionPrefixedRipemd160Hash), {
        outputLength: 256
    });
    let stepThreeChecksum = nem.crypto.js.enc.Hex.stringify(tempHash).substr(0, 8);
    let concatStepThreeAndStepSix = hex2a(versionPrefixedRipemd160Hash + stepThreeChecksum);
    let ret = b32encode(concatStepThreeAndStepSix);
    return ret;
};

/**
* ua2hex() Converts a decoded string to an hex string
*
* @param {Uint8Array} ua - Decoded string
*
* @return {string} - The hex string
*/
function ua2hex(ua) {
    let s = '';
    for (let i = 0; i < ua.length; i++) {
        let code = ua[i];
        s += _hexEncodeArray[code >>> 4];
        s += _hexEncodeArray[code & 0x0F];
    }
    return s;
};
