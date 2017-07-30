var arkApi = require("ark-api");
var util = require("./util");

arkApi.init("main");

var args = process.argv.slice(2);
if(args.length < 1 || !util.isAddress(args[0]))
{
    console.log("Please enter an ARK Address");
    process.exit(1);
}

const BITTREX_ADDR = "AUexKjGtgsSpVzPLs6jNMM6vJ6znEVTQWK";
const ROOT_ADDR = args[0];

var alreadySeen = {};

var visitChildren = (root) => {
    return new Promise((resolve, reject) => {
        var params = {
            senderId: root,
            limit: 50,
            orderBy: "timestamp:desc"
        };

        arkApi.getTransactionsList(params, (error, success, response) => {
            if(response && response.success)
            {
                var childrenPs = response.transactions
                .filter((tx) => !alreadySeen[tx.recipientId] && tx.recipientId != BITTREX_ADDR)
                .map((tx) => {
                    alreadySeen[tx.recipientId] = true;
                    return visitChildren(tx.recipientId);
                });
                Promise.all(childrenPs).then(() => resolve());
            }
            else
                resolve();
        });
    });
};

console.log("Checking transaction tree. \nThis may take a while...")

visitChildren(ROOT_ADDR).then(() => {
    var addresses = Object.keys(alreadySeen);
    console.log(addresses);
    console.log(`${addresses.length} addresses found`);
});