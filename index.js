const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
require('dotenv').config();

const UserRoutes = require('./routes/UserRoutes');

const app = express();

PORT = process.env.PORT || 8080;

const connect = async () => {
    await mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('Connected to MONGODB!!!');
    })
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello from Mamafua API!');
})
app.use('/user', UserRoutes);

app.listen(PORT, () => {
    connect();
    console.log(`Server running on port ${PORT}`);
})
