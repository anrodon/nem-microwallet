let unconfirmedTransactions = 0;

const nem = require("nem-library");

let initializedLibrary = false;

function initLibrary(network) {
    if (initializedLibrary) return;
    nem.NEMLibrary.bootstrap(network);
    initializedLibrary = true;
}

let getTransactionMessage = function(tx) {
    if (tx.message && tx.message.plain) return fmtHexToUtf8(tx.message.plain());
    else return "";
}

const getTransferTransaction = function (transaction) {
    if (transaction.type === nem.TransactionTypes.MULTISIG) {
        return transaction.otherTransaction;
    } else if (transaction.type === nem.TransactionTypes.TRANSFER) {
        return transaction;
    }
    else return null;
}

const getAllTransactions = function (receiver) {
    const accountHttp = new nem.AccountHttp();
    const pageable = accountHttp.incomingTransactionsPaginated(receiver, {pageSize: 100});
    return pageable
        .map((allTransactions) => {
            pageable.nextPage();
             return allTransactions.filter((t) => (t.type === nem.TransactionTypes.MULTISIG || t.type === nem.TransactionTypes.TRANSFER));
        }).reduce((acc, page) => {
            return acc.concat(page);
        }, []).first().toPromise();
};

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
* createImportKeyWallet() Creates a wallet from an imported private key
*/
function createImportKeyWallet() {
    const walletName = $('#wallet-name').val();
    const walletPrivateKey = $('#wallet-p-key').val();
    const walletPassword = $('#wallet-password').val();
    const network = $('#wallet-network').val()
    if (network == testnetId) {
        initLibrary(nem.NetworTypes.TEST_NET);
    } else {
        initLibrary(nem.NetworTypes.MAIN_NET);
    }

    wallet = nem.SimpleWallet.createWithPrivateKey(walletName, walletPassword, walletPrivateKey);
    // Save it using the Chrome extension storage API.

    chrome.storage.local.clear(() => {
        chrome.storage.local.set({'default_xem_wallet': wallet}, () => {
            exportWallet();
            renderHome();
        });
    });
}

/**
* createPRNG() Creates a PRNG wallet
*
*/
function createPRNG() {
    const walletName = $('#wallet-name').val();
    const walletPassword = $('#wallet-password').val();
    const network = $('#wallet-network').val()

    wallet = nem.SimpleWallet.create(walletName, walletPassword);
    // Save it using the Chrome extension storage API.

    chrome.storage.local.clear(() => {
        chrome.storage.local.set({'default_xem_wallet': wallet}, () => {
            exportWallet();
            renderHome();
        });
    });
}

/**
 * exportWallet() Exports the wallet of the user
 *
 */
function exportWallet() {
    chrome.storage.local.get('default_xem_wallet', function(data) {
        wallet = data.default_xem_wallet;
        const base64 = wallet.writeWLTFile();

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
    // Word array to wallet string
    try {
        wallet = nem.SimpleWallet.readFromWLT(fr.result);
        chrome.storage.local.clear(() => {
            chrome.storage.local.set({'default_xem_wallet': wallet}, function() {console.log("Wallet imported successfully.");});
            clearIntervals();
            renderHome();
        });
    } catch (e) {
        $("#warning-msg").removeClass("hidden");
        $("#warning-msg").addClass("visible");
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
        var transferTransaction = nem.model.objects.create("transferTransaction")(recipient, amount, message);

        chrome.storage.local.get('default_xem_wallet', function(data) {
            if (!isFromNetwork(data.default_xem_wallet.accounts[0].address, data.default_xem_wallet.accounts[0].network)) {
                $('#wrong-amount-error-message').show();
                return;
            }
            let common = getCommon(data.default_xem_wallet, password);
            var transactionEntity = undefined;
            if(data.default_xem_wallet.accounts[0].network === 104) {
                transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.mainnet.id);
            }
            else if(data.default_xem_wallet.accounts[0].network === -104) {
                transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.testnet.id);
            }
            else {
                transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, nem.model.network.data.mijin.id);
            }
            try {
                nem.model.transactions.send(common, transactionEntity, endpoint).then((res) => {
                    console.log(res);
                    if (res.code >= 2) $('#an-error-message').show();
                    else if(res.code == 1) $('#success-message').show();
                    else {
                        $('#recipient').val('');
                        $('#amount').val('');
                        $('#message').val('');
                        $('#password').val('');
                    }
                    return;
                });
            } catch(err) {
                $('#an-error-message').show();
    		};
        });
    }
}

