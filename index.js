const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 7000;

// Middleware 

app.use(cors());
app.use(express.json());



app.get('/', (req,res) => {
    res.send("Career Craft server is running");
});

app.listen(port, () => {
    console.log(`Career Craft Server is running on PORT:${port}`)
});