const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());

//Mongo Code
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vhdpi0m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");

    // Collections
    const jobsCollection = client.db("CareerCraft").collection("jobs");
    const jobApplyCollection = client
      .db("CareerCraft")
      .collection("job-application");

    // ================= Jobs API =================
    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // ================= Job Application API =================
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplyCollection.find(query).toArray();

      // Add job details to applications
      for (const application of result) {
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }

      res.send(result);
    });

    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await jobApplyCollection.insertOne(application);
      res.send(result);
    });

    // ================= Delete Job Application =================
    app.delete("/job-application/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log("Delete request for ID:", id);

        const query = { _id: new ObjectId(id) };
        const result = await jobApplyCollection.deleteOne(query);

        console.log("Delete result:", result);
        res.send(result);
      } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send({ error: "Failed to delete" });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Career Craft server is running");
});

app.listen(port, () => {
  console.log(`🚀 Server running on PORT: ${port}`);
});
