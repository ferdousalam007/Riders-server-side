const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5b3k9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        console.log('dc con')
        const database = client.db('riders');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const reviewCollection = database.collection("review");


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