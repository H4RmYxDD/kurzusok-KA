import express from "express";
import db from "./data/db.js";

const PORT = 3030;
const app = express();
app.use(express.json());

app.get("/students/", (req, res) => {
  const clss = req.query.class;
  const students = db
    .prepare("SELECT * FROM students WHERE classes = ?")
    .all(clss);
  res.status(200).json(students);
});

app.get("/students/:id", (req, res) => {
  const id = req.params.id;
  const student = db.prepare("SELECT * FROM students WHERE id=?").get(id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  return res.json(student);
});

app.get("/subjects", (req, res) => {
  const subjects = db.prepare("SELECT * FROM subjects ORDER BY name").all();
  return res.json(subjects);
});

app.post("/courses", (req, res) => {
  const { firstname, lastname, classes, subject } = req.body;
  if (!firstname || !lastname || !classes || !subject) {
    return res.status(400).json({ message: "missing credentials" });
  }
  let studentId = db
    .prepare("SELECT id from students WHERE firstname =? AND lastname = ?")
    .get(firstname, lastname);
  if (!studentId) {
    db.prepare(
      "INSERT INTO students (firstname, lastname, classes) VALUES (?,?,?)",
    ).run(firstname, lastname, classes);
    db.prepare(
      "SELECT id from students WHERE firstname =? AND lastname = ?",
    ).get(firstname, lastname);
  }
  let subjectId = db
    .prepare("SELECT id from subjects WHERE name = ?")
    .get(subject);
  if (!subjectId) {
    db.prepare("INSERT INTO subjects (name) VALUES (?)").run(subject);
    subjectId = db
      .prepare("SELECT id from subjects WHERE name = ?")
      .get(subject);
  }
  const student = db
    .prepare("SELECT * FROM classmembers WHERE student_id=? AND subject_id = ?")
    .get(studentId.id, subjectId.id);

  if (student) {
    return res
      .status(400)
      .json({ message: `${firstname} ${lastname} already studies ${subject}` });
  }
  if (!student) {
    db.prepare(
      "INSERT INTO classmembers (subject_id, student_id) VALUES (?,?)",
    ).run(subjectId.id, studentId.id);
    return res.status(200).json({
      message: `${firstname} ${lastname} from ${classes} studies ${subject}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
