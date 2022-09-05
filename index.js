// import { Biconomy } from "@biconomy/mexa";
let Biconomy = require('@biconomy/mexa').Biconomy;
let ethers = require('ethers');

const scw = '0xC2f21737aba3Af019C6679950a1A2B309E74a7F0';
// const toAddr = '0xA0345623Dd18e62e4A20582Cc4B2776ab56f5825';
const toAddr = '0x0739cf128d03BAA0467f1939F7466AFbD652d058'; // AAK token

let biconomyWalletClient;
// let doesWalletExist;
// let walletAddress;

let btns = [
    document.getElementById('wallet_deploy'), 
    document.getElementById('check_wallet'),
    document.getElementById('transact')
];

async function initBiconomy() {   
    if (! window.ethereum) {
        console.log('Please install Metamask');
    }
    else {
        const test_dapp = new Biconomy(window.ethereum, {
            apiKey: "TjimfvnfI.0f43a334-e748-497f-bfb2-c761a77183c6",
        });
        
        test_dapp.onEvent(test_dapp.READY, async () => {
                 biconomyWalletClient = test_dapp.biconomyWalletClient;
                 btns.forEach(item => {
                    item.disabled = false;
                });
          }).onEvent(test_dapp.ERROR, (error, message) => {
              // Handle error while initializing mexa
              console.log(message);
              console.log(error);
          });
    }
}


async function checkWalletExists() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const { doesWalletExist, walletAddress } = await biconomyWalletClient.checkIfWalletExists({eoa:accounts[0]}); // default index(salt) 0

    console.log(doesWalletExist, walletAddress);

    let swcElement = document.getElementById('swc');
    let shortenedAddr = accounts[0].replace(/(0x\w\w\w\w)\w*(\w\w\w\w)\b/g, '$1...$2');
    swcElement.innerText = `your ${shortenedAddr} smart wallet address is: ${walletAddress}`
    // return doesWalletExist, walletAddress;
}

async function deployWallet() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    // accounts[0] -> currently selected address in metamask
    try {
        const walletAddress = await biconomyWalletClient.checkIfWalletExistsAndDeploy({eoa:accounts[0]}); // default index(salt) 0
        console.log(walletAddress);
    }
    catch (err) {
        console.log(err);
        let errElement = document.getElementById('err');
        errElement.innerText = `Error -> code: ${err.code}, message: ${err.message}`;
    }

}

// send tokens 
// from scw of account1, sending matic to account1 eoa, signing as account2 (failed)
// from scw of aacount1, sending matic to account2 eoa, signing as account1
async function transact() {
    // let safeTxBody = await biconomyWalletClient.buildExecTransaction({data:"0x", to: toAddr, walletAddress: scw});
    let data = await erc20Transfer();
    let safeTxBody = await biconomyWalletClient.buildExecTransaction({data: data, to: toAddr, walletAddress: scw});
    console.log('old:', safeTxBody);
    // safeTxBody.gasPrice = 20000000;
    // safeTxBody.value = ethers.BigNumber.from('1000000000000000000');
    console.log('new:', safeTxBody);
    const signature = await signTransaction(safeTxBody);
    console.log('signature:',signature);
    const transactionResult = await biconomyWalletClient.sendBiconomyWalletTransaction({execTransactionBody: safeTxBody, walletAddress: scw, signature});
    console.log('txResult:', transactionResult);
}

async function erc20Transfer() {
    let ABI = [
        "function transfer(address to, uint256 amount)"
    ];
    let iface = new ethers.utils.Interface(ABI);
    let data = iface.encodeFunctionData('transfer', ['0xA0345623Dd18e62e4A20582Cc4B2776ab56f5825', ethers.utils.parseEther('10000')]);
    console.log('calldata:', data);
    return data;
}

async function signTransaction(safeTxBody){
    const EIP712_WALLET_TX_TYPE = {
        WalletTx: [
            { type: "address", name: "to" },
            { type: "uint256", name: "value" },
            { type: "bytes", name: "data" },
            { type: "uint8", name: "operation" },
            { type: "uint256", name: "targetTxGas" },
            { type: "uint256", name: "baseGas" },
            { type: "uint256", name: "gasPrice" },
            { type: "address", name: "gasToken" },
            { type: "address", name: "refundReceiver" },
            { type: "uint256", name: "nonce" },
        ]
    }
    
    const walletProvider = new ethers.providers.Web3Provider(window.ethereum); // If it's from your front end provider hsould have accounts information
    const walletSigner = walletProvider.getSigner();
    // you can also create walletSigner from private key 
    
    const signature = await walletSigner._signTypedData({ verifyingContract: scw, chainId: ethers.BigNumber.from("80001") }, EIP712_WALLET_TX_TYPE, safeTxBody)
    let newSignature = "0x";
    newSignature += signature.slice(2);
    // pass newSignature as signature argument in above sendBiconomyWalletTransaction method 
    return newSignature;
}


window.app = {
    initBiconomy,
    checkWalletExists,
    deployWallet,
    transact
}