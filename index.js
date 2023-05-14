const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.some2ew.mongodb.net/?retryWrites=true&w=majority`;

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'Unauthorized Access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.SECRET_KEY, (error, decoded) => {
    if(error){
      return res.status(401).send({error: true, message: 'Unauthorized Access'})
    }
    res.decoded = decoded;
    next();
  })

}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const serviceCollection = client.db("docAppointment").collection("services");
    const appointmentCollection = client.db("docAppointment").collection("appointments")
    const bookingCollection = client.db("docAppointment").collection("bookings")

    //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '1hr'})
      res.send({token})
    })

    //getting services data
    app.get('/services', async (req, res) => {
        const query = serviceCollection.find()
        const result = await query.toArray();
        res.send(result);
    })

    //posting appointments data
    app.post('/appointments', async (req, res) => {
        const newAppointment = req.body;
        console.log(req.body);
        const result = await appointmentCollection.insertOne(newAppointment);
        res.send(result);
    })

    //getting a specific service data
    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    //taking bookings
    app.post('/services', async (req, res) => {
        const newBooking = req.body;
        const result = await bookingCollection.insertOne(newBooking)
        res.send(result)
    })

    //getting data by specific email
    app.get('/bookings', verifyJWT, async (req, res) => {
        let query = {};

        if(req.query.email){
            query = {email: req.query.email}
        }

        const result = await bookingCollection.find(query).toArray();
        res.send(result)
    })

    //deleting user bookings
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Doc Appointment Server')
})

app.listen(port, () => {
    console.log('Doc Appointment Server is running on port', port);
})