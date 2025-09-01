const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect("mongodb://127.0.0.1:27017/notesdb")
  .then(() => console.log("MongoDB'ye bağlandı"))
  .catch(err => console.log(err));

// Note model
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);

// Rotalar

// 1. Tüm notları getir
app.get("/notes", async (req, res) => {
  const notes = await Note.find();
  res.json(notes);
});

// 2. Yeni not ekle
app.post("/notes", async (req, res) => {
  const { title, content } = req.body;
  const newNote = new Note({ title, content });
  await newNote.save();
  res.json(newNote);
});

// 3. Not güncelle
app.put("/notes/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const updatedNote = await Note.findByIdAndUpdate(
    id,
    { title, content },
    { new: true }
  );
  res.json(updatedNote);
});

// 4. Not sil
app.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;
  await Note.findByIdAndDelete(id);
  res.json({ message: "Not silindi" });
});

// Server
app.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor");
});
