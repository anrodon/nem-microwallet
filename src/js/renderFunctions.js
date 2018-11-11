'use strict';

let unconfirmedTransactions = 0;

const nem = require("nem-library");
const trezor = require("nem-trezor");

const trezorNetwork = nem.NetworkTypes.TEST_NET;
let initializedLibrary = false;
let trezorAccount;
let wallet;
let isTrezor = false;

function initLibrary(network) {
    if (initializedLibrary) return;
    nem.NEMLibrary.bootstrap(Number(network));
    initializedLibrary = true;
}

let getTransactionMessage = function(tx) {
    if (tx.message && tx.message.plain) return tx.message.plain();
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
    const pageable = accountHttp.allTransactionsPaginated(receiver, {pageSize: 100});
    const all = [];
    return new Promise((resolve, reject) => {
        pageable.subscribe(x => {
            all.push(x.filter((t) => (t.type === nem.TransactionTypes.MULTISIG || t.type === nem.TransactionTypes.TRANSFER)));
            pageable.nextPage();
        }, err => {
            reject(err);
        }, () => {
            resolve(all);
        });
    });
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
        initLibrary(nem.NetworkTypes.TEST_NET);
    } else {
        initLibrary(nem.NetworkTypes.MAIN_NET);
    }

    const wlt = nem.SimpleWallet.createWithPrivateKey(walletName, new nem.Password(walletPassword), walletPrivateKey);
    // Save it using the Chrome extension storage API.

    chrome.storage.local.clear(() => {
        chrome.storage.local.set({'default_xem_wallet': wlt.writeWLTFile()}, () => {
            exportWallet();
            renderHome();
        });
    });
}

function readWalletFile(wlt) {
    try {
        return nem.SimpleWallet.readFromWLT(wlt);
    } catch (err) {
        return nem.SimpleWallet.readFromNanoWalletWLF(wlt);
    }
}

/**
* createPRNG() Creates a PRNG wallet
*
*/
function createPRNG() {
    const walletName = $('#wallet-name').val();
    const walletPassword = $('#wallet-password').val();
    const network = $('#wallet-network').val()
    if (network == testnetId) {
        initLibrary(nem.NetworkTypes.TEST_NET);
    } else {
        initLibrary(nem.NetworkTypes.MAIN_NET);
    }

    const wlt = nem.SimpleWallet.create(walletName, new nem.Password(walletPassword));
    // Save it using the Chrome extension storage API.

    chrome.storage.local.clear(() => {
        chrome.storage.local.set({'default_xem_wallet': wlt.writeWLTFile()}, () => {
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
        const wlt = data.default_xem_wallet;
        const wallet = readWalletFile(wlt);

        var blob = new Blob([wlt], {type: 'text'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, 'wallet.wlt');
        }
        else{
            var elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = `${wallet.name}.wlt`;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    });
}

function trezorLogin() {
    try {
        initLibrary(trezorNetwork);
        isTrezor = true;
        trezor.TrezorAccount.getAccount(0).toPromise()
        .then((account) => {
          trezorAccount = account;
          renderHome();
        }).catch((e) => {
            // TODO: warning
            console.log(e);
            console.log("error logging in with trezor");
        })
    } catch (e) {
        // TODO: warning
        console.log(e);
        console.log("error logging in with trezor");
    }
}

/**
 * finishImport() Finishes the import of a wallet
 *
 */
function finishImport(fr) {
    // Wallet base64 to word array
    // Word array to wallet string
    try {
        chrome.storage.local.clear(() => {
            chrome.storage.local.set({'default_xem_wallet': fr.result}, function() {console.log("Wallet imported successfully.");});
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
    const file = $('#wallet-file')[0].files[0];
    const fr = new FileReader();
    fr.onload = finishImport(fr);
    fr.readAsText(file);
}

/**
* logout() Logs the user out of the app
*
*/
function logout() {
    chrome.storage.local.clear();
    trezorAccount = undefined;
    renderHome();
}
// logout();

/**
* Check if an address is valid
*
* @param {string} address - An address
*
* @return {boolean} - True if address is valid, false otherwise
*/
let isValid = function(address) {
    try {
        new nem.Address(address);
        return true;
    } catch (e) {
        return false;
    }
};

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

// get real value of a mosaic
let getMosaicValue = function(value, mosaicId) {
    const mosaicHttp = new nem.MosaicHttp();
    return mosaicHttp.getMosaicDefinition(mosaicId).toPromise()
    .then(definition => {
        const div = definition.properties.divisibility;
        return (value / (10 ** div));
    });
}

// get real value of a mosaic with divisivility
let getMosaicValueAndDefinition = function(value, mosaicId) {
    const mosaicHttp = new nem.MosaicHttp();
    return mosaicHttp.getMosaicDefinition(mosaicId).toPromise()
    .then(definition => {
        const div = definition.properties.divisibility;
        return {
            value: (value / (10 ** div)),
            definition,
        }
    });
}

let ownedMosaics;
let getOwnedMosaics = function() {
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    const accountHttp = new nem.AccountHttp();
    return accountHttp.getMosaicOwnedByAddress(address).toPromise()
    .then(mosaics => {
        const allPromises = mosaics.map(mosaic => {
            if (mosaic.mosaicId.namespaceId === 'nem' && mosaic.mosaicId.name === 'xem') return Promise.resolve({
                mosaicId: mosaic.mosaicId,
                quantity: mosaic.quantity / 1000000,
            });
            const valueP =getMosaicValueAndDefinition(mosaic.quantity, mosaic.mosaicId);
            return valueP.then(value => {
                return {
                    mosaicId: mosaic.mosaicId,
                    quantity: value.value,
                    definition: value.definition,
                };
            });
        });
        return Promise.all(allPromises);
    });
}

/**
* sendTransaction() Sends a transaction with the parameters specified by the user
*
*/
function sendTransaction() {
    const recipient = $('#recipient').val();
    const amount = ($('#amount').val());
    const message = $('#message').val();
    const mosaicI = $('#mosaic-selected').val();
    const mosaic = ownedMosaics[mosaicI];
    console.log("selected", mosaic);
    let password;
    if (!isTrezor) {
        password = $('#password').val();
    }

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
        let transferTransaction;
        if (mosaic.mosaicId.namespaceId === 'nem' && mosaic.mosaicId.name === 'xem') {
            transferTransaction = nem.TransferTransaction.create(
                nem.TimeWindow.createWithDeadline(),
                new nem.Address(recipient),
                new nem.XEM(amount),
                nem.PlainMessage.create(message)
            );
        } else {
            transferTransaction = nem.TransferTransaction.createWithMosaics(
                nem.TimeWindow.createWithDeadline(),
                new nem.Address(recipient),
                [nem.MosaicTransferable.createWithMosaicDefinition(mosaic.definition, amount)],
                nem.PlainMessage.create(message)
            );
        }

        if (isTrezor) {
            try {
                const transactionHttp = new nem.TransactionHttp();

                trezorAccount.signTransaction(transferTransaction).toPromise()
                .then((signedTransaction) => {
                    transactionHttp.announceTransaction(signedTransaction).toPromise()
                    .then(x => {
                        $('#success-message').show();
                        $('#recipient').val('');
                        $('#amount').val('');
                        $('#message').val('');
                        $('#password').val('');
                        return;
                    });
                });
            } catch(err) {
                $('#an-error-message').show();
            };
        } else {
            chrome.storage.local.get('default_xem_wallet', function(data) {
                try {
                    const transactionHttp = new nem.TransactionHttp();
                    const account = wallet.open(new nem.Password(password));
                    const signedTransaction = account.signTransaction(transferTransaction);
                    transactionHttp.announceTransaction(signedTransaction)
                    .toPromise().then(x => {
                        $('#success-message').show();
                        $('#recipient').val('');
                        $('#amount').val('');
                        $('#message').val('');
                        $('#password').val('');
                        return;
                    });
                } catch(err) {
                    console.log(err);
                    $('#an-error-message').show();
                };
            });
        }

    }
}

//----------------------------------------------------------------------------------------------------------------------------//

chrome.storage.local.get('default_xem_wallet', function(data) {
    if (data.default_xem_wallet == undefined) renderLogin();
    else {
        wallet = readWalletFile(data.default_xem_wallet);
        initLibrary(wallet.network);
        renderHome();
    }
});

function generateTransactionItem (tx) {
    const t = getTransferTransaction(tx);
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    const network = (isTrezor) ? trezorNetwork : wallet.network;
    // console.log("transaction -> ", t);
    // console.log("own address -> ", address);
    if (!t) return;
    const url = (network == nem.NetworkTypes.TEST_NET) ? "http://bob.nem.ninja:8765/#/transfer/" : "http://chain.nem.ninja/#/transfer/";
    let classType = (t.recipient.plain() === address.plain()) ? "received" : "sent";
    const fromOrTo = (t.recipient.plain() === address.plain()) ? "From: " + t.signer.address.pretty() : "To: " + t.recipient.pretty();
    if (t.containsMosaics()) {
        // console.log('mosaics:', t.mosaics());
        const mosaicPromises = t.mosaics().map(m => {
            return getMosaicValue(m.quantity, m.mosaicId).then((value) => {
                return {
                    mosaicId: m.mosaicId,
                    quantity: value,
                }
            });
        });
        return Promise.all(mosaicPromises).then((mosaics) => {
            let item = `
            <div class=${classType}>
                <a class="tx-link" href="${url + t.getTransactionInfo().hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                <p>${fromOrTo}</p>
                <p>Message: ${getTransactionMessage(t)}</p>
                <p>Fee: ${t.fee/ 1000000} XEM </p>
            `
            mosaics.forEach(mosaic => {
                // console.log('mosaic ----->', mosaic);
                item += `
                    <p>Mosaic: ${mosaic.quantity} ${(mosaic.mosaicId.namespaceId + ':' + mosaic.mosaicId.name).toUpperCase()}</p>
                `
            });
            item += `
            </div>
            `
            return item;
        });
    } else {
        // console.log("xem ->", t.xem());
        return Promise.resolve(`
            <div class=${classType}>
                <a class="tx-link" href="${url + t.getTransactionInfo().hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                <p>${fromOrTo}</p>
                <p>Message: ${getTransactionMessage(t)}</p>
                <p>Amount: ${(t.xem().amount) + "XEM"} Fee: ${t.fee / 1000000} XEM </p>
            </div>
        `);
    }
}

function generateUnconfirmedTransactionItem (tx) {
    const t = getTransferTransaction(tx);
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    // console.log("transaction -> ", t);
    // console.log("own address -> ", address);
    if (!t) return;
    let classType = "unconfirmed";
    const fromOrTo = (t.recipient.plain() === address.plain()) ? "From: " + t.signer.address.pretty() : "To: " + t.recipient.pretty();
    if (t.containsMosaics()) {
        const mosaicPromises = t.mosaics().map(m => {
            return getMosaicValue(m.quantity, m.mosaicId).then((value) => {
                return {
                    mosaicId: m.mosaicId,
                    quantity: m.quantity,
                }
            });
        });
        // console.log('mosaics:', t.mosaics());
        return Promise.all(mosaicPromises).then((mosaics) => {
            let item = `
            <div class=${classType}>
                <p>Unconfirmed Transaction</p>
                <p>${fromOrTo}</p>
                <p>Message: ${getTransactionMessage(t)}</p>
                <p>Fee: ${t.fee/ 1000000} XEM </p>
            `
            mosaics.forEach(mosaic => {
                // console.log('mosaic ----->', mosaic);
                item += `
                    <p>Mosaic: ${mosaic.quantity} ${(mosaic.mosaicId.namespaceId + ':' + mosaic.mosaicId.name).toUpperCase()}</p>
                `
            });
            item += `
            </div>
            `
            return item;
        });
    } else {
        // console.log("xem ->", t.xem());
        return Promise.resolve(`
            <div class=${classType}>
                <p>Unconfirmed Transaction</p>
                <p>${fromOrTo}</p>
                <p>Message: ${getTransactionMessage(t)}</p>
                <p>Amount: ${(t.xem().amount) + "XEM"} Fee: ${t.fee / 1000000} XEM </p>
            </div>
        `);
    }
}

/**
* getBalanceAndTxs() Gets and prints the balance and transactions of an address
*/
function getBalanceAndTxs() {
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    const network = (isTrezor) ? trezorNetwork : wallet.network;
    initLibrary(network);
    const accountHttp = new nem.AccountHttp();
    const obs = accountHttp.getFromAddress(address);
    obs.toPromise()
    .then((accountInfoWithMd) => {
        let balance = accountInfoWithMd.balance.balance / 1000000;
        $('#p-balance').text(balance.toString() + ' XEM'); 
    });

    // get unconfirmed
    accountHttp.unconfirmedTransactions(address).toPromise()
    .then(unconfirmedTrans => {
        unconfirmedTransactions = unconfirmedTrans.length;
        unconfirmedTrans.forEach(tx => {
            const t = getTransferTransaction(tx);
            if (!t) return;
            generateUnconfirmedTransactionItem(tx).then(t => {
                $('#unconfirmed-transactions-box').append(t);
            });
        });
        // get comfirmed
        getAllTransactions(address)
        .then(transactions => {
            const promises = transactions[0].map(tx => {
                return generateTransactionItem(tx);
            });
            Promise.all(promises).then(trans => {
                trans.forEach(t => {
                    $('#last-transactions-box').append(t);
                });
            })
        });
    });
}

/**
* getNewBalanceAndTxs() Gets and prints the new balance and new transactions of an address
*
*/
function getNewBalanceAndTxs() {
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    const network = (isTrezor) ? trezorNetwork : wallet.network;
    initLibrary(network);
    const accountHttp = new nem.AccountHttp();
    accountHttp.getFromAddress(address).toPromise()
    .then((accountInfoWithMd) => {
        let balance = accountInfoWithMd.balance.balance / 1000000;
        $('#p-balance').text(balance.toString() + ' XEM'); 
    });
    // get unconfirmed
    accountHttp.unconfirmedTransactions(address).toPromise()
    .then(unconfirmedTrans => {
        $('#unconfirmed-transactions-box').empty();
        const newUnconfirmedTransactions = unconfirmedTrans.length;
        unconfirmedTrans.forEach(tx => {
            const t = getTransferTransaction(tx);
            if (!t) return;
            generateUnconfirmedTransactionItem(tx).then(t => {
                $('#unconfirmed-transactions-box').append(t);
            });
        });
        // get comfirmed
        getAllTransactions(address)
        .then(trans => {
            const transactions = trans[0];
            let promises = [];
            for(let i = 0; i < unconfirmedTransactions - newUnconfirmedTransactions; ++i){
                promises.push(generateTransactionItem(transactions[i]));
            }
            Promise.all(promises).then(ts => {
                ts.forEach(t => {
                    $('#last-transactions-box').append(t);
                });
            });
            unconfirmedTransactions = newUnconfirmedTransactions;
        });
    });
}

/**
* renderCreatePRNGWallet() Renders the create PRNG wallet page
*
*/
function renderCreatePRNGWallet() {
    $('body').empty();
    $('body').append(`
        <!-- CREATE PRNG WALLET PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <h1 class="text-nav">${createPRNGWalletText}</h1>
             </div>
        </header>
        <div id="create-prng-wallet-page" class="form-style-4 pading-top">
            <input type="text" id="wallet-name" placeholder="${walletNameText}" class="form-control" style="margin-top: 95px;"></input>
            <input type="password" id="wallet-password" placeholder="${passwordText}" class="form-control"></input>
            <select id="wallet-network" class="styled-select">
                <option value="${testnetId}">${testnetText}</option>
                <option value="${mainnetId}">${mainnetText}</option>
                <option value="${mijinId}">${mijinText}</option>
            </select>
            <button id="create-account-button" class="btn btn-1">${createWalletText}</button>
            <p class="error-message" id="all-fields-required">${allFieldsRequiredText}</p>
        </div>
        <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END CREATE PRNG WALLET PAGE -->`
    );
    $("#create-account-button").click(() => {
        const walletName = $('#wallet-name').val();
        const walletPassword = $('#wallet-password').val();
        if (walletName == "" || walletPassword == "") {
            $('#all-fields-required').show();
            setInterval(function(){ $('#all-fields-required').hide(); }, 5000);
        }
        else createPRNG();
    });
    $("#to-login").click(() => renderCreateWallet());
}

/**
* renderCreateWallet() Renders the create wallet
*
*/
function renderCreateWallet() {
    $('body').empty();
    $('body').append(`
        <!-- CREATE WALLET PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <h1 class="text-nav">${createWalletText}</h1>
             </div>
        </header>
        <div id="create-wallet-page" class="form-style-4 pading-top">
            <button id="create-prng-wallet-button" class="btn btn-1">${createPRNGWalletText}</button>
            <!-- <button id="create-brain-wallet-button" class="btn btn-1">${createBrainWalletText}</button> -->
            <button id="import-key-button" class="btn btn-1">${importKeyText}</button>
        </div>
        <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END CREATE WALLET PAGE -->`
    );
    $("#create-prng-wallet-button").click(() => renderCreatePRNGWallet());
    $("#create-brain-wallet-button").click(() => renderCreateBrainWallet());
    $("#import-key-button").click(() => renderImportPrivateKey());
    $("#to-login").click(() => renderLogin());
}

/**
* renderHome() Renders the home page
*
*/
function renderHome() {
    $('body').empty();
    chrome.storage.local.get('default_xem_wallet', function(data) {
        if (data.default_xem_wallet == undefined && trezorAccount == undefined) {
            renderLogin();
        } else {
            if (!isTrezor) {
                wallet = readWalletFile(data.default_xem_wallet);
            }
            const network = (isTrezor) ? trezorNetwork : wallet.network;
            initLibrary(network);
            $('body').append(`
                <!-- HOME PAGE -->
                <header>
                    <div class="navbar navbar-default navbar-fixed-top row">
                        <h1 class="text-nav">${appTitleText}</h1>
                        <p id="p-address" class="text-nav"></p>
                    </div>
                </header>
                <div id="home-page" style="padding-top: 85px;">
                    <p id="p-balance"></p>
                    <div id="transactions-box">
                        <div id="unconfirmed-transactions-box">
                        </div>
                        <div id="last-transactions-box">
                        </div>
                    </div>
                    <button id="to-new-transaction-button" class="btn btn-1">${newTransactionText}</button>
                    <button id="to-settings-button" class="btn btn-1">${settingsText}</button>
                </div>
                <!-- END HOME PAGE -->`
            );
            $("#to-new-transaction-button").click(() => renderNewTransaction());
            $("#to-settings-button").click(() => renderSettings());
            const address = (isTrezor) ? trezorAccount.address : wallet.address;
            $('#p-address').text(address.pretty());
            getBalanceAndTxs();
            clearIntervals();
            setInterval(() => getNewBalanceAndTxs(), 5000);
        }
    });
}

/**
* renderImportPrivateKey() Renders the import private key page
*
*/
function renderImportPrivateKey() {
    $('body').empty();
    $('body').append(`
        <!-- IMPORT PRIVATE KEY PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <h1 class="text-nav" style="font-size: 30px;">${importKeyText}</h1>
             </div>
        </header>
        <div class="form-style-4">
            <input type="text" id="wallet-name" class="form-control" placeholder="${walletNameText}" style="margin-top: 95px;"></input>
            <input type="password" id="wallet-p-key" class="form-control" placeholder="${privateKeyText}"></input>
            <input type="password" id="wallet-password" class="form-control" placeholder="${passwordText}"></input>
            <select id="wallet-network" class="styled-select">
                <option value="${testnetId}">${testnetText}</option>
                <option value="${mainnetId}">${mainnetText}</option>
                <option value="${mijinId}">${mijinText}</option>
            </select>
            <button id="create-account-button" class="btn btn-1">${createWalletText}</button>
            <p class="error-message" id="all-fields-required">${allFieldsRequiredText}</p>
        </div>
        <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END IMPORT PRIVATE KEY PAGE -->`
    );
    $("#create-account-button").click(() => {
        const walletName = $('#wallet-name').val();
        const walletPassword = $('#wallet-password').val();
        if (walletName == "" || walletPassword == "") {
            $('#all-fields-required').show();
            setInterval(function(){ $('#all-fields-required').hide(); }, 5000);
        }
        else createImportKeyWallet();
    });
    $("#to-login").click(() => renderCreateWallet());
}

/**
* renderLogin() Renders the login page
*
*/
function renderLogin() {
    $('body').empty();
    $('body').append(`
        <!-- LOGIN PAGE -->
        <div id="login-page">
            <img src="../img/nem-title.png" class="img-responsive titleIni">
            <img src="../img/nem-white.png" class="img-responsive logoIni">
            <h4 class="textIni">${appTitleText}</h4>
            <h4 class="textIni">${appClaimText}</h4>
            <div class="row underLogo">
                <div class="col-sm-12">
                    <button id="import-wallet" class="btn btn-1">${importWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="create-wallet" class="btn btn-1">${createWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="trezor-login" class="btn btn-1">${trezorLoginText}</button>
                </div>
            </div>
            <div id="warning-msg" class="row error hidden">
                <i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ${errorImportWalletText}
            </div>
            <input type="file" id="wallet-file" class="file-selector hidden">
        </div>
        <!-- END LOGIN PAGE -->`
    );
    $("#create-wallet").click(() => renderCreateWallet());
    document.getElementById("wallet-file").onchange = function() {
        importWallet();
    }
    $("#import-wallet").click(() => {
        $("#wallet-file").click();
    });
    $("#trezor-login").click(() => {
        trezorLogin();
    });
}


/**
* renderNewTransaction() Renders the new transaction page
*
*/
function renderNewTransaction() {
    $('body').empty();
    getOwnedMosaics().then(mosaics => {
        console.log("gotten", mosaics);
        ownedMosaics = mosaics;
        let elements = [];
        mosaics.forEach((mosaic, i) => {
            elements.push(`<option value=${i}>${mosaic.mosaicId.namespaceId}:${mosaic.mosaicId.name}</option>`);
        });
        let page = `
        <!--NEW TRANSACTION PAGE -->
            <header>
            <div class="navbar navbar-default navbar-fixed-top row">
            <a id="to-home"><h1><</h1></a>
            <h1 class="text-nav">${newTransactionText}</h1>
            </div>
            </header>

            <div id="new-transaction-page" class="form-style-4">
                <input type="text" id="recipient" placeholder="${recipientText}" class="form-control"></input>
                <select id="mosaic-selected" class="dropdown-mosaic">
                <!-- Carregar llistat de mosaics dinamicament i asigar com a valor el seu propi nom -->
        `
        elements.forEach(e => page += e);
        page += `
                </select>
                <input type="number" id="amount" placeholder="${amountText}" class="form-control"></input>
                <input type="text" id="message" placeholder="${messageText}"class="form-control"></input>
                <input type="password" id="password" placeholder="${passwordText}"class="form-control"></input>
                <button id="send-transaction-button" class="btn btn-1">${sendTxText}</button>
                <p id="success-message">${txSuccessText}</p>
                <p class="error-message" id="incomplete-error-message">${allFieldsRequiredText}</p>
                <p class="error-message" id="wrong-address-error-message">${wrongAddressText}</p>
                <p class="error-message" id="an-error-message">${anErrorOcurredText}</p>
                <p class="error-message" id="wrong-amount-error-message">${wrongAmountText}</p>
            </div>
            <!-- END NEW TRANSACTION PAGE -->
        `;
        $('body').append(page);
        $("#send-transaction-button").click(() => {
            sendTransaction();
        });
        $("#to-home").click(() => renderHome());
    });
    // TODO: no password field when trezor
}

/**
* renderAccountInfoQR() Renders the QR address of the wallet
*
*/
function renderAccountInfoQR() {
    $('body').empty();
    $('body').append(`
        <!-- QR ADDRESS PAGE -->
        <div id="qr-address-page">
            <h4 id="h4-address" style="margin-top: 25px;"></h4>
            <div class="row vertically-centered" style="margin-top: 50px;">
                <center><div id="accountInfoQR"></div></center>
            </div>
        </div>
        <a id="to-settings"><i class="fa fa-arrow-left" aria-hidden="true" style="margin-top: 50px;"></i><a>
        <!-- END QR ADDRESS PAGE -->`
    );
    const address = (isTrezor) ? trezorAccount.address : wallet.address;
    const network = (isTrezor) ? trezorNetwork : wallet.network;
    $('#h4-address').text(address.pretty());
    // Account info model for QR
    const accountInfoModelQR = {
        "v": network === nem.NetworkTypes.TEST_NET ? 1 : 2,
        "type": 1,
        "data": {
            "addr": address.plain(),
            "name": (isTrezor) ? "Trezor" : wallet.name
        }
    }
    const text = JSON.stringify(accountInfoModelQR);
    let qrCode = kjua({
                size: 256,
                text: text,
                fill: '#000',
                quiet: 0,
                ratio: 2,
    });
    $('#accountInfoQR').append(qrCode);
    $("#to-settings").click(() => renderSettings());
}

/* NEW FUNCTIONALLITY */

function renderMosaicList() {
    $('body').empty();
    $('body').append(`
        <!-- QR ADDRESS PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <a id="to-home"><h1><</h1></a>
                <h1 class="text-nav">${exploreText}</h1>
             </div>
        </header>
        <div id="divExplorer">
            <h4 style="color:#848484;">Your Mosaics</h4>
            <table class="table" id="tableMosaics">
              <thead class="table-header">
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td scope="row">Mosaic #1</td>
                  <td>455.2</td>

                </tr>
                <tr>
                  <td scope="row">Mosaic #2</td>
                  <td>300</td>

                </tr>
                <tr>
                  <td scope="row">Mosaic #3</td>
                  <td>200</td>
                </tr>
              </tbody>
            </table>
        </div>
        <!-- END QR ADDRESS PAGE -->`
    );
    $("#to-home").click(() => renderHome());
}

/**
* renderSettings() Renders the settings page
*
*/
function renderSettings() {

    $('body').empty();
    $('body').append(`
        <!-- SETTINGS PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <a id="to-home"><h1><</h1></a>
                <h1 class="text-nav">${settingsText}</h1>
             </div>
        </header>
        <div id="settings-page"> 
            <div class="row vertically-centered" style="margin-top: 50px;">

                <!-- NEW PAGE PART! -->
                <div class="col-sm-12">
                    <button id="mosaic-button" class="btn btn-1">${exploreText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="show-account-info-qr-button" class="btn btn-1">${showAccountInfoQRText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="export-wallet-button" class="btn btn-1">${exportWalletText}</button>
                </div>
                
                <div class="col-sm-12">
                    <button id="logout-button" class="btn btn-1">${logoutText}</button>
                </div>
            </div>
        </div>

        <!-- END SETTINGS PAGE -->`
    );
    $("#export-wallet-button").click(() => exportWallet());
    $("#show-account-info-qr-button").click(() => renderAccountInfoQR());
    $("#mosaic-button").click(() => renderMosaicList());
    $("#logout-button").click(() => logout());
    $("#to-home").click(() => renderHome());
}
