var arkApi = require("ark-api");
var fs = require("fs");
var util = require("./util.js");

arkApi.init("main");

var args = process.argv.slice(2);
if(args.length < 1 || !util.isAddress(args[0]))
{
    console.log("Please enter an ARK Address");
    process.exit(1);
}

var delegateAddr = args[0];
const SATOSHI = 100000000;
fs.readFile("./voters.json", "utf-8", (err, data) => {
    if(err) throw err;

    /*
        Get current voters db
        Map of Key: address
        Val: {
            "balance": ark balance
            "percentChange": balance percent change
        }
    */
    var voters = JSON.parse(data);

    //Get delegate public key
    arkApi.getPublicKey(delegateAddr, (err, succ, resp) => {
        if(resp.success)
        {
            var pubKey = resp.publicKey;

            //Get delegate voters
            arkApi.getVoters(pubKey, (err, succ, resp) => {
                if(resp.success)
                {
                    resp.accounts.forEach((acct) => {
                        var prevVoterData = voters[acct.address];
                        var balance = acct.balance / SATOSHI;
                        if(prevVoterData != null)
                        {
                            var percentChange = util.percentChange(prevVoterData.balance, balance);

                            prevVoterData.balance = balance;
                            prevVoterData.percentChange = percentChange;
                        }
                        else
                        {
                            var voterData = {
                                balance: balance,
                                percentChange: 0
                            };

                            voters[acct.address] = voterData;
                        }
                    });

                    //Update voters.json
                    fs.writeFile("./voters.json", JSON.stringify(voters), "utf-8");

                    //Map to array and sort for display
                    var voterArr = Object.keys(voters).map((addr) => {
                        return {
                            address: addr,
                            data: voters[addr]
                        };
                    }).sort((a, b) => b.data.percentChange - a.data.percentChange);

                    console.log("ADDRESS                           PERCENT CHANGE");
                    voterArr.forEach((voter) => {
                        var percentChangeRounded = Math.round(voter.data.percentChange * 100) / 100;
                        console.log(`${voter.address} ${percentChangeRounded}%`);
                    });
                }
                else
                    console.log("Error getting voters");
            });
        }
        else
            console.log("Error getting delegate public key");
    });
});