'use strict';
var nem = require("nem-sdk").default;

let endpoint = undefined;
let wallet = undefined;


chrome.storage.local.get('default_xem_wallet', function(data) {
    wallet = data.default_xem_wallet;
    if (wallet == undefined) renderLogin();
    else renderHome();
});
