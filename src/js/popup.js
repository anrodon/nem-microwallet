var nem = require("nem-sdk").default;
let endpoint;
let network;
const timestampNemesisBlock = 1427587585;

chrome.storage.local.get('default_xem_wallet', function(data) {
    const wallet = data.default_xem_wallet;
    if (wallet == undefined) {
        renderLogin();
    } else {
        renderHome();
    }
});
