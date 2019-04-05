// export * from './lib/async';
// export * from './lib/hash';
// export * from './lib/number';


const dgraph = require("dgraph-js-http");
const faker = require("faker");


// Create a client stub.
function newClientStub() {
    return new dgraph.DgraphClientStub("http://localhost:8080");
}

// Create a client.
function newClient(clientStub) {
    return new dgraph.DgraphClient(clientStub);
}

// Drop All - discard all data and start from a clean slate.
async function dropAll(dgraphClient) {
    await dgraphClient.alter({ dropAll: true });
}

// Set schema.
async function setSchema(dgraphClient) {
    const schema = `
        name: string @index(exact) .
        age: int .
        married: bool .
        loc: geo .
        dob: datetime .
        password: password .
    `;
    await dgraphClient.alter({ schema: schema });
}

const nameit =  faker.name.findName();

// Create data using JSON.
async function createData(dgraphClient) {
    // Create a new transaction.
    const txn = dgraphClient.newTxn();
    try {
        // Create data.
        let pass = faker.internet.password();
        var options = { min: 22, max: 58 };
        const p = {
            name: nameit,
            age: faker.random.number(options), 
            image: faker.image.avatar(),
            married: faker.random.boolean(),
            email: faker.internet.email(),
            Address: faker.address.streetAddress(),
            work_at: faker.company.companyName(),
            jobTitle: faker.name.jobTitle(),
            Bitcoin_Address: faker.finance.bitcoinAddress(),
            security: {
                password: pass,
                tip: pass,
                iplastLogin: faker.internet.ip(),
                lastLogin: faker.date.past(),
                last_place_Login: faker.address.state()
            },
            loc: {
                type: "Point",
                coordinates: [1.1, 2],
            },
            dob: new Date(),
            friend: [faker.helpers.createCard(), faker.helpers.createCard(), faker.helpers.createCard() ,faker.helpers.createCard()],
            school: [
                {
                    name: "Crown Public School",
                }
            ]
        };

        // Run mutation.
        const assigned = await txn.mutate({ setJson: p });

        // Commit transaction.
        await txn.commit();

        // Get uid of the outermost object (person named "Alice").
        // Assigned#getUidsMap() returns a map from blank node names to uids.
        // For a json mutation, blank node names "blank-0", "blank-1", ... are used
        // for all the created nodes.
        console.log(`Created person named "Alice" with uid = ${assigned.data.uids["blank-0"]}\n`);

        console.log("All created nodes (map from blank node names to uids):");
        Object.keys(assigned.data.uids).forEach((key) => console.log(`${key} => ${assigned.data.uids[key]}`));
        console.log();
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
    }
}

// Query for data.
async function queryData(dgraphClient) {
    // Run query.
    const query = `query all($a: string) {
        all(func: eq(name, $a)) {
            uid
            expand(_all_)
            predicate_list : _predicate_
        }
    }`;
    const vars = { $a: nameit };
    const res = await dgraphClient.newTxn().queryWithVars(query, vars);
    const ppl = res.data;

    // Print results.
    console.log(`Number of people named "Alice": ${ppl.all.length}`);
    ppl.all.forEach((person) => console.log(person));
}

async function main() {
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
//    await dropAll(dgraphClient);
    await setSchema(dgraphClient);
    await createData(dgraphClient);
    await queryData(dgraphClient);
}

main().then(() => {
    console.log("\nDONE!");
}).catch((e) => {
    console.log("ERROR: ", e);
});