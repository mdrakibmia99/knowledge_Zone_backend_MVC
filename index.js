const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.drzmd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbbiden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const booksCollection = client
      .db("knowledge-zone")
      .collection("books-collection");
    const blogCollection = client
      .db("knowledge-zone")
      .collection("blog-collection");

    const orderCollection = client.db("knowledge-zone").collection("order");
    const addReviewCollection = client
      .db("knowledge-zone")
      .collection("review");

    // for user collection (faisal)

    const userCollection = client.db("knowledge-zone").collection("users");

    //  class one_to_twelve and courses routes database start
    const classAndCourse = client
      .db("classes_courses_info")
      .collection("allClassesCoursesInfo");
    //  class one_to_twelve and courses routes database end

    // Instructors database (faisal)
    const instructorCollection = client
      .db("instructors")
      .collection("allSubInstructors");

    // CCI => classes and courses info notification--
    app.get("/ccis", async (req, res) => {
      res.status(200).json({
        unreadData: await classAndCourse
          .find({}, { projection: { title: 1, state: 1 } })
          .toArray(),
        unreadCount: await classAndCourse.countDocuments({ state: "unread" }),
      });
    });
    // CCI => classes and courses info notification kausar book section--
    app.get("/bookN", async (req, res) => {
      res.status(200).json({
        unreadData: await booksCollection
          .find({}, { projection: { bookName: 1, state: 1 } })
          .toArray(),
        unreadCount: await booksCollection.countDocuments({ state: "unread" }),
      });
    });

    app.put("/cci/:id", async (req, res) => {
      res.status(201).send(
        await classAndCourse.updateOne(
          { _id: ObjectId(req.params.id) },
          {
            $set: {
              state: "read",
            },
          },
          { upsert: true }
        )
      );
    });
    // Book notification start ===(kausar)====
    app.put("/bookN/:id", async (req, res) => {
      res.status(201).send(
        await booksCollection.updateOne(
          { _id: ObjectId(req.params.id) },
          {
            $set: {
              state: "read",
            },
          },
          { upsert: true }
        )
      );
    });

    // Book notification End

    // add course
    // add a course api
    app.post("/addCourse", async (req, res) => {
      const course = req.body;
      const result = await classAndCourse.insertOne(course);
      res.send(result);
    });
    // add a book api
    app.post("/addBook", async (req, res) => {
      const course = req.body;
      const result = await booksCollection.insertOne(course);
      res.send(result);
    });
    // add a blog api
    app.post("/addBlog", async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });

    // search course start

    app.get("/searchCourse", async (req, res) => {
      const result = await classAndCourse.find().toArray();
      res.send(result);
    });
    // search course end
    // search user start

    app.get("/nodemon in", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // search user end

    // search book ===(kausar)===

    // app.get("/searchBook", async (req, res) => {
    //   const result = await booksCollection.find().toArray();
    //   res.send(result);
    // });
    //search book end

    // update a course
    app.put("/courseUpdate/:id", async (req, res) => {
      const updateCourse = req.body;
      const { id } = req.params;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: updateCourse,
      };
      const result = await classAndCourse.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    // ===update a Book kausar===
    app.put("/bookUpdate/:id", async (req, res) => {
      const updateBook = req.body;
      const { id } = req.params;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: updateBook,
      };
      const result = await booksCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    //=== update a Blog kausar===
    app.put("/blogUpdate/:id", async (req, res) => {
      const updateBlog = req.body;
      const { id } = req.params;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: updateBlog,
      };
      const result = await blogCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    //get detail for payment

    app.get("/payment/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const payment = await orderCollection.findOne(query);
      res.send(payment);
    });

    //payment
    app.post("/create-payment-intent", verifyJwt, async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    // create api for get class and courses information (Rakib)

    app.get("/courses/:course", async (req, res) => {
      const course = req.params.course;
      console.log(course);
      const query = { classCourse: course };
      const result = await classAndCourse.find(query).toArray();
      res.send(result);
    });

    // after click enroll from course or class route (Rakib)

    app.get("/course/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await classAndCourse.findOne(query);
      res.send(result);
    });
    // delete a course (Rakib)
    app.delete("/course/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await classAndCourse.deleteOne(query);
      res.send(result);
    });
    // ===delete book (kausar)===
    app.delete("/bookDelete/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });
    //=== delete blog (kausar)===
    app.delete("/blogDelete/:id", verifyJwt, async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await blogCollection.deleteOne(query);
      res.send(result);
    });

    // ===get book (kausar)====

    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    app.get("/book/:id", async (req, res) => {
      const { id } = req.params;
      const queary = { _id: ObjectId(id) };
      const result = await booksCollection.findOne(queary);
      res.send(result);
    });

    //=== get blog (kausar)===

    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    app.get("/blog/:id", async (req, res) => {
      const { id } = req.params;
      const queary = { _id: ObjectId(id) };
      const result = await blogCollection.findOne(queary);
      res.send(result);
    });

    //===ADD Review (kausar)===

    app.post("/addreview", async (req, res) => {
      const review = req.body;

      const result = await addReviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/addreview", async (req, res) => {
      const result = await addReviewCollection.find().toArray();
      res.send(result);
    });

    // ==================================================================

    // create instructor api (faisal)
    app.get("/instructors/:subject", async (req, res) => {
      const subject = req.params.subject;
      const query = { Subject: subject };
      const result = await instructorCollection.find(query).toArray();
      res.send(result);
    });

    // api for getting single instructor (faisal)
    app.get("/instructor/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await instructorCollection.findOne(query);
      res.send(result);
    });

    // delete instructor api (faisal)
    app.delete("/instructor/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const result = await instructorCollection.deleteOne(query);
      res.send(result);
    });

    // api for adding instructor (faisal)
    app.post("/addInstructor", async (req, res) => {
      const instructor = req.body;
      const result = await instructorCollection.insertOne(instructor);
      res.send(result);
    });

    // api for updating instructor (faisal)
    app.put("/updateInstructor/:id", async (req, res) => {
      const updateInstructor = req.body;
      const { id } = req.params;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: updateInstructor,
      };
      const result = await instructorCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.send(result);
    });

    // insert a order (faisal)
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // GET user order by filtering email (faisal)

    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email, paid: false };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    // paid order collection
    app.get("/paidOrder", async (req, res) => {
      const email = req.query.email;
      const query = { email: email, paid: true };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // DELETE user's order (faisal)
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // for user collection (faisal)

    app.get("/user", verifyJwt, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden message" });
      }
    });

    // DELETE user from user's collection (faisal)
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //=============== Update User Profile START By (Rafi) ===============
    //========== Get User By Email (Rafi) ==========
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //========== Update User Profile (Rafi) ==========
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const profile = req.body;
      const query = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: profile.name,
          email: profile.email,
          education: profile.education,
          location: profile.location,
          phone: profile.phone,
        },
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //=============== Update User Profile END By (Rafi) ===============

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      res.send({ result, token });
    });

    // add payment status and transaction id
    app.patch("/enrollCourse/:id", verifyJwt, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      // const result = await paymentCollection.insertOne(payment);
      const updateOrder = await orderCollection.updateOne(filter, updatedDoc);
      res.send(updateOrder);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("welcome to Knowledge Zone......aa");
});

app.listen(port, () => {
  console.log("listening to port", port);
});

// Heroku Link is given below:

// https://immense-meadow-70411.herokuapp.com/
