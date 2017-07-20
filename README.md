# NEM Microwallet
## NEM Blockchain Chrome Extension wallet

This repository contains the source code for the NEM Microwallet extension, a Chrome extension that allows the user to have some of the nem features in a fast and accessible way.

### Features
At this moment, the NEM Microwallet has the following features:
- Creation, importing and exporting of Mainnet, Testnet and Mijin wallets.
- Transaction creation and sending containing:
  + Recipient
  + XEM Amount
  + Message
- Visualization of address and balance.
- Visualization of outcoming, incoming and unconfirmed transactions.
- Automatic refresh of balance and transactions.

### Feature roadmap
As this is still an Alpha version of the wallet, lots of features need to be included to make this wallet as much complete as possible, so the next features planned to add are the following:
- Add visualization of QR address
- Add different wallet types
- Add Multiwallet support
- Add Multisignature accounts support
- Add Mosaic transfer support
- Add Mosaic tools
- Add Alias Service support
- Add harvesting info and tools
- ...

Please don't hesiate to open feature request issues in this repository, we'll kindly appreciate them.

### Collaboration
Please feel free to fork this repository and propose pull requests, after being reviewed they'll be merged and the changes will be uploaded at the Chrome Webstore.

### Build and use your own release
To build your own release (if you don't trust the one deployed at the Chrome Webstore) you have to follow this simple steps:
1. Open a console.
2. Clone this repository with:

  ```
  git clone https://github.com/anrodon/nem-microwallet
  ```
   
3. Access the project folder with:

  ```
  cd nem-microwallet
  ```
   
4. Install all dependencies with:

  ```
  npm install
  ```
  
5. Build your release with:

  ```
  grunt build
  ```
  
6. Enjoy your release at the `dist` folder.

With this folder you can now load your own release to your Chrome Browser going to `chrome://extensions`, enabling developer mode and selecting your `dist` folder as an unpacked extension.

### License
This repository is under the GNU GENERAL PUBLIC LICENSE version 3.

This program may be freely distributed, as long as this notice and documentation are distributed with the program.  This program is released as-is, with no warranty expressed or implied.

### Tips
**XEM:** NBCAQE-TSUFWK-YR6RID-CYMDHA-R7J5DY-XKJU4M-QZOA

**BTC:** 1NcUf7wXtfeDai2Vc4iDwQsFCubmPq5vvW
