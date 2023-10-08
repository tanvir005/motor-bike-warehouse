const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();


// middle ware 
app.use(cors());
app.use(express.json());

// verifing jwt 

function varifyJWT(req, res, next) {
    console.log('start here:', req.body, res.body, next);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        console.log(err, decoded);
        if (err) {
            return res.status(403).send({ message: 'Forbiden access.' })
        }

        req.decoded = decoded;
    })

    next();
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xz1rk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryItemsCollections = client.db('warehouse-inventor-management').collection('invenrotyitems');

        //auth 
        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user);
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1h'
            });

            res.send({ accessToken });
        });


        // adding items 
        app.post('/invenrotyitems', async (req, res) => {
            const doc = req.body;
            const result = await inventoryItemsCollections.insertOne(doc);
            res.send(result);
        });


        // get all items 
        app.get('/invenrotyitems', async (req, res) => {
            const query = {};
            const cursor = inventoryItemsCollections.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });


        // get an items using id 
        app.get('/invenrotyitems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await inventoryItemsCollections.findOne(query);
            res.send(item);
        });

        // update a item
        app.put('/invenrotyitems/:id', async (req, res) => {
            const id = req.params.id;
            const updatedItem = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedItem.newQuantity
                }
            };
            const updetedResult = await inventoryItemsCollections.updateOne(filter, updatedDoc, options);
            res.send(updetedResult);
        });

        //delete items from manage inventory
        app.delete('/invenrotyitems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await inventoryItemsCollections.deleteOne(query);
            res.send(result);
        });

        // my items
        app.get('/invenrotyitemsQ', varifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            const email = req.query.email;
            // 
            // const query = { email: email };
            // const cursor = inventoryItemsCollections.find(query);
            // const services = await cursor.toArray();
            // res.send(services);

            if (decodedEmail === email) {
                const query = { email: email };
                const cursor = inventoryItemsCollections.find(query);
                const services = await cursor.toArray();
                res.send(services);
            }
            else {
                res.status(403).send({ message: 'Forbidden access' })
            }
        });

    }
    finally {

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('server running');
});
app.get('/check', (req, res) => {
    res.send('Checkimg: server running');
});


app.listen(port, () => {
    console.log('listining to port:', port);
})