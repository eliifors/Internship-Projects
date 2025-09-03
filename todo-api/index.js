const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect("mongodb://127.0.0.1:27017/tododb")
  .then(() => console.log("MongoDB'ye bağlandı"))
  .catch(err => console.log(err));

// Task (Görev) şeması
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

// Rotalar

// 1. Tüm görevleri listele
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// 2. Yeni görev ekle
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  const newTask = new Task({ title });
  await newTask.save();
  res.json(newTask);
});

// 3. Görevi güncelle (tamamla / düzenle)
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const updatedTask = await Task.findByIdAndUpdate(
    id,
    { title, completed },
    { new: true }
  );
  res.json(updatedTask);
});

// 4. Görev sil
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  await Task.findByIdAndDelete(id);
  res.json({ message: "Görev silindi" });
});

// Server
app.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor");
});
