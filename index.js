const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;




const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5b3k9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}


async function run() {
    try {
        await client.connect();
        console.log('dc con')
        const database = client.db('riders');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const reviewCollection = database.collection("review");

        const userCollection = database.collection('user');


        // add products
        app.post("/addProducts", async (req, res) => {
            console.log(req.body);
            const result = await productsCollection.insertOne(req.body);
            // console.log(result);
            res.json(result)
        });


        // get all Products
        app.get("/products", async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result);
        });

        //get single Product
        app.get("/Products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const Products = await productsCollection.findOne(query);
            res.json(Products);
        });

        // add all Order
        app.post("/allOrder", async (req, res) => {
            console.log(req.body);
            const result = await usersCollection.insertOne(req.body);
            res.send(result);
        });

        // my order
        app.get("/myOrder/:email", async (req, res) => {
            const result = await usersCollection.find({
                email: req.params.email,
            }).toArray();
            res.send(result);
        });

        // delete my order
        app.delete("/deleteMyOrder/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await usersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });


        //add review
        // review
        app.post("/addSReview", async (req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            res.send(result);
        });

        //get all reviews
        // get all orders

        app.get("/getReview", async (req, res) => {
            const result = await reviewCollection.find({}).toArray();
            res.send(result);
            console.log(result);
        });


        //admincollection check

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/user', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/user/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        });

///manage all order
app.get("/allOrders", async (req, res) => {
    // console.log("hello");
    const result = await usersCollection.find({}).toArray();
    res.send(result);
  });
// delete all orders
app.delete("/deleteOrder/:id", async (req, res) => {
    console.log(req.params.id);
    const result = await usersCollection.deleteOne({
      _id: ObjectId(req.params.id),
    });
    res.send(result);
  });

// status update
app.put("/statusUpdate/:id", async (req, res) => {
    const filter = { _id: ObjectId(req.params.id) };
    console.log(req.params.id);
    const result = await usersCollection.updateOne(filter, {
      $set: {
        status: 'shipped',
      },
    });
    res.send(result);
    console.log(result);
  });

  //manageproducts delete
  // delete all orders
  app.delete("/products/deleteProduct/:id", async (req, res) => {
    console.log(req.params.id);
    const result = await productsCollection.deleteOne({
      _id: ObjectId(req.params.id),
    });
    res.send(result);
  });


    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('HelloRiders!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})