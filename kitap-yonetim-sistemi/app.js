const express = require('express');
const mongoose = require('mongoose');

const app = express();


mongoose.connect("mongodb+srv://eliif:eliif111121@cluster0.q9cqw4m.mongodb.net/")
.thwen(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
