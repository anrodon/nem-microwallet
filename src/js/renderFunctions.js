/**
* getBalanceAndTxs() Gets and prints the balance and transactions of an address
*
* @param {object} endpoint - An NIS endpoint object
* @param {string} address - An account address
* @param {number} network - A NEM network Id
*/
function getBalanceAndTxs(endpoint, address, network) {
    nem.com.requests.account.mosaics.owned(endpoint, address).then((res) => {
        const data = res.data;
        let balance = fmtNemValue(data[0].quantity) + ' ' + data[0].mosaicId.name;
        $('#p-balance').text(balance.toUpperCase());
    });
    nem.com.requests.account.transactions.unconfirmed(endpoint, address).then((resp) => {
        unconfirmedTransactions = resp.data.length;
        for (const trx of resp.data) {
            $('#unconfirmed-transactions-box').append(`
                <div class="unconfirmed">
                    <p>Unconfirmed Transaction</p>
                    <p>From: ${fmtAddress(toAddress(trx.transaction.signer, network))}</p>
                    <p>To: ${fmtAddress(trx.transaction.recipient)}</p>
                    <p>Message: ${fmtHexToUtf8(trx.transaction.message.payload)}</p>
                    <p>Amount: ${fmtNemValue(trx.transaction.amount)} XEM Fee: ${fmtNemValue(trx.transaction.fee)} XEM<p>
                </div>
            `);
        }
        totalTransactions = 0;
        nem.com.requests.account.transactions.all(endpoint, address).then((res) => {
            for (const tx of res.data) {
                totalTransactions += 1;
                if (tx.transaction.recipient == address) {
                    if (network == testnetId) {
                        $('#last-transactions-box').append(`
                            <div class="received">
                                <a class="tx-link" href="http://bob.nem.ninja:8765/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').append(`
                            <div class="received">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    }
                } else {
                    if (network == testnetId) {
                        $('#last-transactions-box').append(`
                            <div class="sent">
                                <a class="tx-link" href="http://bob.nem.ninja:8765/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').append(`
                            <div class="sent">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    }
                }
            }
        });
    });
}

/**
* getNewBalanceAndTxs() Gets and prints the new balance and new transactions of an address
*
* @param {object} endpoint - An NIS endpoint object
* @param {string} address - An account address
* @param {number} network - A NEM network Id
*/
function getNewBalanceAndTxs(endpoint, address, network) {
    nem.com.requests.account.mosaics.owned(endpoint, address).then((res) => {
        const data = res.data;
        let balance = fmtNemValue(data[0].quantity) + ' ' + data[0].mosaicId.name;
        $('#p-balance').text(balance.toUpperCase());
    });
    nem.com.requests.account.transactions.unconfirmed(endpoint, address).then((resp) => {
        $('#unconfirmed-transactions-box').empty();
        const newUnconfirmedTransactions = resp.data.length;
        for (const trx of resp.data) {
            $('#unconfirmed-transactions-box').append(`
                <div class="unconfirmed">
                    <p>Unconfirmed Transaction</p>
                    <p>From: ${fmtAddress(toAddress(trx.transaction.signer, network))}</p>
                    <p>To: ${fmtAddress(trx.transaction.recipient)}</p>
                    <p>Message: ${fmtHexToUtf8(trx.transaction.message.payload)}</p>
                    <p>Amount: ${fmtNemValue(trx.transaction.amount)} XEM Fee: ${fmtNemValue(trx.transaction.fee)} XEM<p>
                </div>
            `);
        }
        nem.com.requests.account.transactions.all(endpoint, address).then((res) => {
            for(let i = 0; i < unconfirmedTransactions - newUnconfirmedTransactions; ++i) {
                tx = res.data[i];
                if (tx.transaction.recipient == address) {
                    if (network == testnetId) {
                        $('#last-transactions-box').prepend(`
                            <div class="received">
                                <a class="tx-link" href="http://bob.nem.ninja:8765/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').prepend(`
                            <div class="received">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    }
                } else {
                    if (network == testnetId) {
                        $('#last-transactions-box').prepend(`
                            <div class="sent">
                                <a class="tx-link" href="http://bob.nem.ninja:8765/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').prepend(`
                            <div class="sent">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${fmtHexToUtf8(tx.transaction.message.payload)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    }
                }
            }
            unconfirmedTransactions = newUnconfirmedTransactions;
        });
    });
}

/**
* renderCreateWallet() Renders the create wallet
*
*/
function renderCreateWallet() {
    $('body').empty();
    $('body').append(`
        <!-- CREATE WALLET PAGE -->
        <div id="create-wallet-page" class="form-style-4">
            <h1>${createWalletText}</h1>
            <input type="text" id="wallet-name" placeholder="${walletNameText}" style="margin-top: 95px;"></input>
            <input type="password" id="wallet-password" placeholder="${passwordText}"></input>
            <select id="wallet-network" class="styled-select">
                <option value="${testnetId}">${testnetText}</option>
                <option value="${mainnetId}">${mainnetText}</option>
                <option value="${mijinId}">${mijinText}</option>
            </select>
            <button id="create-account-button" class="btn btn-1">${createWalletText}</button>
            <p id="error-message">${allFieldsRequiredText}</p>
        </div>
        <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END CREATE WALLET PAGE -->`
    );
    $("#create-account-button").click(() => createPRNG());
    $("#to-login").click(() => renderLogin());
}

/**
* renderImportWallet() Renders the import wallet page
*
*/
function renderImportWallet() {
    $('body').empty();
    $('body').append(`
        <!-- IMPORT WALLET PAGE -->
        <div id="import-wallet-page">
            <h1>${importWalletText}</h1>
            <div class="row vertically-centered">
                <div class="col-sm-12">
                    <input type="file" id="wallet-file" class="file-selector">
                </div>
                <div class="col-sm-12">
                    <button id="import-wallet-button" class="btn btn-1">${importWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <p id="error-message">${allFieldsRequiredText}</p>
                </div>
                <div class="col-sm-12">
                    <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
                </div>
            </div>
        </div>
        <!-- END IMPORT WALLET PAGE -->`
    );
    $("#import-wallet-button").click(() => importWallet());
    $("#to-login").click(() => renderLogin());
}

/**
* renderHome() Renders the home page
*
*/
function renderHome() {
    $('body').empty();
    chrome.storage.local.get('default_xem_wallet', function(data) {
        const wallet = data.default_xem_wallet;
        if (wallet == undefined) {
            renderLogin();
        } else {
            network = wallet.accounts[0].network;
            if (wallet.accounts[0].network == 104) {
                endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultMainnet, nem.model.nodes.defaultPort);
            } else if (wallet.accounts[0].network == -104) {
                endpoint = nem.model.objects.create("endpoint")(/*nem.model.nodes.defaultTestnet*/'http://23.228.67.85', nem.model.nodes.defaultPort);
            } else if (wallet.accounts[0].network == 96) {
                endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultMijin, nem.model.nodes.defaultPort);
            }
            $('body').append(`
                <!-- HOME PAGE -->
                <div id="home-page">
                    <h1>${appTitleText}</h1>
                    <p id="p-address"></p>
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
            const address = wallet.accounts[0].address;
            $('#p-address').text(fmtAddress(address));
            getBalanceAndTxs(endpoint, address, network);
            setInterval(() => getNewBalanceAndTxs(endpoint, address, network), 5000);
        }
    });
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
            <h1>${appTitleText}</h1>
            <h5>${appClaimText}</h5>
            <div class="row vertically-centered">
                <div class="col-sm-12">
                    <button id="import-wallet" class="btn btn-1">${importWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="create-wallet" class="btn btn-1">${createWalletText}</button>
                </div>
            </div>
        </div>
        <!-- END LOGIN PAGE -->`
    );
    $("#create-wallet").click(() => renderCreateWallet());
    $("#import-wallet").click(() => renderImportWallet());
}


/**
* renderNewTransaction() Renders the new transaction page
*
*/
function renderNewTransaction() {
    $('body').empty();
    $('body').append(`
        <!-- NEW TRANSACTION PAGE -->
        <div id="new-transaction-page" class="form-style-4">
            <h1>${newTransactionText}</h1>
            <input type="text" id="recipient" placeholder="${recipientText}"></input>
            <input type="number" id="amount" placeholder="${amountText}"></input>
            <input type="text" id="message" placeholder="${messageText}"></input>
            <input type="password" id="password" placeholder="${passwordText}"></input>
            <button id="send-transaction-button" class="btn btn-1">${sendTxText}</button>
            <p id="success-message">${txSuccessText}</p>
            <p class="error-message" id="incomplete-error-message">${allFieldsRequiredText}</p>
            <p class="error-message" id="wrong-address-error-message">${wrongAddressText}</p>
            <p class="error-message" id="an-error-message">${anErrorOcurredText}</p>
            <p class="error-message" id="wrong-amount-error-message">${wrongAmountText}</p>
        </div>
        <a id="to-home"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END NEW TRANSACTION PAGE -->`
    );
    $("#send-transaction-button").click(() => sendTransaction());
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
        <div id="settings-page">
            <h1>${settingsText}</h1>
            <div class="row vertically-centered" style="margin-top: 50px;>
                <div class="col-sm-12">
                    <button id="export-wallet-button" class="btn btn-1">${exportWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="logout-button" class="btn btn-1">${logoutText}</button>
                </div>
            </div>
        </div>
        <a id="to-home"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END SETTINGS PAGE -->`
    );
    $("#export-wallet-button").click(() => exportWallet());
    $("#logout-button").click(() => logout());
    $("#to-home").click(() => renderHome());
}
