// import { Biconomy } from "@biconomy/mexa";
let Biconomy = require('@biconomy/mexa').Biconomy;
let ethers = require('ethers');

const scw = '0xA0f4AEDCea7d33b8F33E1796960F3563b8264e1A';
// const toAddr = '0xA0345623Dd18e62e4A20582Cc4B2776ab56f5825';
const toAddr = '0x0739cf128d03BAA0467f1939F7466AFbD652d058'; // AAK token
const recipientAddr = '0x83F4122b30Df38b02AEA99AD0A9eAC53b5eAcBa6';

let biconomyWalletClient;
let biconomy;
// let doesWalletExist;
// let walletAddress;

let btns = [
    document.getElementById('wallet_deploy'), 
    document.getElementById('check_wallet'),
    document.getElementById('transact')
];

async function initBiconomy() {   
    return new Promise((resolve, reject) => {
        // let provider = new ethers.providers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/uWyySoINuCH0KxzgSwpPruApQHJnETLh');
        // biconomy = new Biconomy(provider, {
        //     apiKey: "TjimfvnfI.0f43a334-e748-497f-bfb2-c761a77183c6"
        // });
        biconomy = new Biconomy(window.ethereum, {
            apiKey: "TjimfvnfI.0f43a334-e748-497f-bfb2-c761a77183c6",
        });
        biconomy.onEvent(biconomy.READY, async () => {
                    biconomyWalletClient = biconomy.biconomyWalletClient;
                    btns.forEach(item => {
                        item.disabled = false;
                    });
                resolve();
            }).onEvent(biconomy.ERROR, (error, message) => {
                // Handle error while initializing mexa
                console.log(message);
                console.log(error);
                reject(error)
            });
    });
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
    // safeTxBody.gasPrice = 3000000;
    // safeTxBody.gasLimit = 200000;
    // safeTxBody.value = ethers.BigNumber.from('1000000000000000000');
    console.log('new:', safeTxBody);
    const signature = await signTransaction(safeTxBody);
    console.log('signature:',signature);
    // const transactionResult = await biconomyWalletClient.sendBiconomyWalletTransaction({execTransactionBody: safeTxBody, walletAddress: scw, signature});
    const transactionResult = await biconomyWalletClient.sendBiconomyWalletTransaction({execTransactionBody: safeTxBody, walletAddress: scw});
    console.log('txResult:', transactionResult);
}

async function erc20Transfer() {
    let ABI = [
        "function transfer(address to, uint256 amount)"
    ];
    let iface = new ethers.utils.Interface(ABI);
    let data = iface.encodeFunctionData('transfer', [recipientAddr, ethers.utils.parseEther('100')]);
    // console.log(ethers.utils.parseEther('100'))
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
            // { type: "uint256", name: "gasLimit" },
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
    biconomy,
    checkWalletExists,
    deployWallet,
    transact
}