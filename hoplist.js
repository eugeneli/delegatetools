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
var apiCallPs = [];

var visitChildren = (root) => {
    var params = {
        senderId: root,
        limit: 50,
        orderBy: "timestamp:desc"
    };

    var apiCallPromise = new Promise((resolve, reject) => {
        arkApi.getTransactionsList(params, (error, success, response) => {
            if(response.success)
            {
                response.transactions.forEach((tx) => {
                    var recipient = tx.recipientId;
                    if(!alreadySeen[recipient] && recipient != BITTREX_ADDR)
                    {
                        alreadySeen[tx.recipientId] = true;
                        visitChildren(recipient);
                        resolve();
                    }
                });
            }
            resolve();
        });
    });

    apiCallPs.push(apiCallPromise);
};

visitChildren(ROOT_ADDR);

Promise.all(apiCallPs).then(() => {
    console.log(Object.keys(alreadySeen));
});