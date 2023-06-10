const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// verifyJwt middleware
const jwtVerify = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" });
  }
  //jwt  bearer token
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorize access" });
    }
    req.decoded = decoded;
    next();
  });
};

// mongos

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bx18cif.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    //   student verify
    const studentVerify = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "student") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // Instructor Verify
    const instructorVerify = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    //   collection

    const usersCollection = client.db("sportsDB").collection("users");
    const userClass = client.db("sportsDB").collection("class");

    // class post
    app.post("/class", async (req, res) => {
      const newClass = req.body;
      const result = await userClass.insertOne(newClass);
      res.send(result);
    });

    // class get
    app.get("/class", async (req, res) => {
      const result = await userClass.find().toArray();
      res.send(result);
    });

    // class email find
    app.get("/class/:email",async(req,res)=>{
        const email=req.params.email;
        const query={instructorEmail:email}
        const result=await userClass.find(query).toArray()
        res.send(result)

    })

    app.patch('/class/:id',async(req,res)=>{
        const id=req.params.id;
        const {i}=req.body;
        console.log(i);
        const filter={_id:new ObjectId(id)}
        console.log(id);
        const updateDoc={
            $set: {
                  status:i===true?'approved':'denied'        
              },
        };

        const result=await userClass.updateOne(filter,updateDoc);
        res.send(result)

    })

    // user related apis
    // user Get
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //   make jwt token

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    //   user Post
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existUser = await usersCollection.findOne(query);
      if (existUser) {
        return res.send({ message: "User already Create" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // make user admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // check admin by email
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      //   if (req.decoded.email !== email) {
      //     res.send({ admin: false });
      //   }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    //   student role
    app.get(
      "/users/student/:email",

      async (req, res) => {
        const email = req.params.email;

        // if (req.decoded.email !== email) {
        //   res.send({ student: false });
        // }

        const query = { email: email };
        const user = await usersCollection.findOne(query);
        const result = { student: user?.role === "student" };
        res.send(result);
      }
    );

    //   Instructor role
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //   instructor instructor by email
    app.get(
      "/users/instructor/:email",

      async (req, res) => {
        const email = req.params.email;

        // if (req.decoded.email !== email) {
        //   res.send({ instructor: false });
        // }

        const query = { email: email };
        const user = await usersCollection.findOne(query);
        const result = { instructor: user?.role === "instructor" };
        res.send(result);
      }
    );

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// last part
app.get("/", (req, res) => {
  res.send("sports is running");
});

app.listen(port, () => {
  console.log(`sports running port:${port}`);
});
