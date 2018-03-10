/**
* getBalanceAndTxs() Gets and prints the balance and transactions of an address
*
*/
function getBalanceAndTxs() {
    let address = wallet.accounts[0].address;
    let network = wallet.accounts[0].network;
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
                    <p>Message: ${getTransactionMessage(trx.transaction)}</p>
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
                                <p>Message: ${getTransactionMessage(tx.transaction)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').append(`
                            <div class="received">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${getTransactionMessage(tx.transaction)}</p>
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
                                <p>Message: ${getTransactionMessage(tx.transaction)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').append(`
                            <div class="sent">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${getTransactionMessage(tx.transaction)}</p>
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
*/
function getNewBalanceAndTxs() {
    let address = wallet.accounts[0].address;
    let network = wallet.accounts[0].network;
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
                    <p>Message: ${getTransactionMessage(trx.transaction)}</p>
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
                                <p>Message: ${getTransactionMessage(trx.transaction)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').prepend(`
                            <div class="received">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>From: ${fmtAddress(toAddress(tx.transaction.signer, network))}</p>
                                <p>Message: ${getTransactionMessage(trx.transaction)}</p>
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
                                <p>Message: ${getTransactionMessage(trx.transaction)}</p>
                                <p>Amount: ${fmtNemValue(tx.transaction.amount)} XEM Fee: ${fmtNemValue(tx.transaction.fee)} XEM<p>
                            </div>
                        `);
                    } else {
                        $('#last-transactions-box').prepend(`
                            <div class="sent">
                                <a class="tx-link" href="http://chain.nem.ninja/#/transfer/${tx.meta.hash.data}" onclick="chrome.tabs.create({url:this.href})" target="_blank">Transaction link</a>
                                <p>To: ${fmtAddress(tx.transaction.recipient)}</p>
                                <p>Message: ${getTransactionMessage(trx.transaction)}</p>
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
* renderCreateBrainWallet() Renders the create brain wallet page
*
*/
function renderCreateBrainWallet() {
    $('body').empty();
    $('body').append(`
        <!-- CREATE BRAIN WALLET PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <h1 class="text-nav">${createBrainWalletText}</h1>
             </div>
        </header>
        <div id="create-brain-wallet-page" class="form-style-4 pading-top">
            <input type="text" id="wallet-name" placeholder="${walletNameText}" class="form-control" style="margin-top: 95px;"></input>
            <input type="password" id="wallet-passphrase" placeholder="${passphraseText}" class="form-control"></input>
            <input type="password" id="wallet-confirm-passphrase" placeholder="${confirmPassphraseText}" class="form-control"></input>
            <select id="wallet-network" class="styled-select">
                <option value="${testnetId}">${testnetText}</option>
                <option value="${mainnetId}">${mainnetText}</option>
                <option value="${mijinId}">${mijinText}</option>
            </select>
            <button id="create-account-button" class="btn btn-1">${createWalletText}</button>
            <p class="error-message" id="all-fields-required">${allFieldsRequiredText}</p>
            <p class="error-message" id="passphrases-incorrect">${passphrasesMustBeEqualText}</p>
        </div>
        <a id="to-login"><i class="fa fa-arrow-left" aria-hidden="true"></i><a>
        <!-- END CREATE BRAIN WALLET PAGE -->`
    );
    $("#create-account-button").click(() => {
        const walletName = $('#wallet-name').val();
        const walletPassphrase = $('#wallet-passphrase').val();
        if (walletName == "" || walletPassphrase == "") {
            $('#all-fields-required').show();
            setInterval(function(){ $('#all-fields-required').hide(); }, 5000);
        }
        else if ($('#wallet-passphrase').val() != $('#wallet-confirm-passphrase').val()) {
            $('#passphrases-incorrect').show();
            setInterval(function(){ $('#passphrases-incorrect').hide(); }, 5000);
        }
        else createBrainWallet();
    });
    $("#to-login").click(() => renderCreateWallet());
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
            <button id="create-brain-wallet-button" class="btn btn-1">${createBrainWalletText}</button>
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
* renderImportWallet() Renders the import wallet page
*
*/
/*
function renderImportWallet() {
    $('body').empty();
    $('body').append(`
        <!-- IMPORT WALLET PAGE -->
         <header>
            <div class="navbar navbar-default navbar-fixed-top">
                <h1 class="text-nav">${importWalletText}</h1>
             </div>
        </header>
        <div id="import-wallet-page">
            <div class="row vertically-centered">
                <div class="col-sm-12">
                    <input type="file" id="wallet-file" class="file-selector">
                </div>
                <div class="col-sm-12">
                    <button id="import-wallet-button" class="btn btn-1">${importWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <p class="error-message" id="all-fields-required">${allFieldsRequiredText}</p>
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
}*/

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
                endpoint = nem.model.objects.create("endpoint")('http://104.128.226.60', nem.model.nodes.defaultPort);
            } else if (wallet.accounts[0].network == 96) {
                endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultMijin, nem.model.nodes.defaultPort);
            }
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
            const address = wallet.accounts[0].address;
            $('#p-address').text(fmtAddress(address));
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
            <h1>${appTitleText}</h1>
            <img src="../img/nem-128.png" class="img-responsive logoIni">
            <h5>${appClaimText}</h5>
            <div class="row underLogo">
                <div class="col-sm-12">
                    <button id="import-wallet" class="btn btn-1">${importWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="create-wallet" class="btn btn-1">${createWalletText}</button>
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
}


/**
* renderNewTransaction() Renders the new transaction page
*
*/
function renderNewTransaction() {
    $('body').empty();
    $('body').append(`
        <!-- NEW TRANSACTION PAGE -->
        <header>
            <div class="navbar navbar-default navbar-fixed-top row">
                <h1 class="text-nav">${newTransactionText}</h1>
            </div>
        </header>

        <div id="new-transaction-page" class="form-style-4">
            <input type="text" id="recipient" placeholder="${recipientText}" class="form-control"></input>
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
        <a id="to-home"><i class="fa fa-arrow-left arrow-nav" aria-hidden="true" class="arrow-nav"></i></a>
        <!-- END NEW TRANSACTION PAGE -->`
    );
    $("#send-transaction-button").click(() => {
        sendTransaction();
    });
    $("#to-home").click(() => renderHome());
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
    const address = wallet.accounts[0].address;
    $('#h4-address').text(fmtAddress(address));
    // Account info model for QR
    const accountInfoModelQR = {
        "v": network === testnetId ? 1 : 2,
        "type": 1,
        "data": {
            "addr": address,
            "name": wallet.name
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
                <h1 class="text-nav">${settingsText}</h1>
             </div>
        </header>
        <div id="settings-page"> 
            <div class="row vertically-centered" style="margin-top: 50px;">
                <div class="col-sm-12">
                    <button id="export-wallet-button" class="btn btn-1">${exportWalletText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="show-account-info-qr-button" class="btn btn-1">${showAccountInfoQRText}</button>
                </div>
                <div class="col-sm-12">
                    <button id="logout-button" class="btn btn-1">${logoutText}</button>
                </div>
            </div>
        </div>
        <a id="to-home"><i class="fa fa-arrow-left arrow-nav" aria-hidden="true" class="arrow-nav"></i></a>

        <!-- END SETTINGS PAGE -->`
    );
    $("#export-wallet-button").click(() => exportWallet());
    $("#show-account-info-qr-button").click(() => renderAccountInfoQR());
    $("#logout-button").click(() => logout());
    $("#to-home").click(() => renderHome());
}
