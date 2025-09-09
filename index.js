const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');

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

    //==============Auth Related API===============
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.send( token );
    });

    // ================= Jobs API =================
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // ================= Jobs API =================
    app.get("/jobs", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) {
          query = { hr_email: email }; //  consistent field name
        }
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).send({ error: "Failed to fetch jobs" });
      }
    });

    app.post("/jobs", async (req, res) => {
      try {
        const newJob = req.body;

        //  Ensure hr_email exists before insert
        if (!newJob.hr_email) {
          return res.status(400).send({ error: "hr_email is required" });
        }

        const result = await jobsCollection.insertOne(newJob);
        res.send(result);
      } catch (error) {
        console.error("Error inserting job:", error);
        res.status(500).send({ error: "Failed to insert job" });
      }
    });

    // ================= Job Application API =================
    app.get("/job-application", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ error: "Email is required" });
        }

        const query = { applicant_email: email };
        const result = await jobApplyCollection.find(query).toArray();

        for (const application of result) {
          if (ObjectId.isValid(application.job_id)) {
            const job = await jobsCollection.findOne({
              _id: new ObjectId(application.job_id),
            });
            if (job) {
              application.title = job.title;
              application.company = job.company;
              application.company_logo = job.company_logo;
              application.location = job.location;
              application.applicationDeadline = job.applicationDeadline;
            }
          } else {
            console.warn("Invalid job_id:", application.job_id);
          }
        }

        res.send(result);
      } catch (err) {
        console.error("Error in /job-application:", err);
        res.status(500).send({ error: "Internal Server Error" });
      }
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
