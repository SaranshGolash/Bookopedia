import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import pg from 'pg';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Creating a PostgreSQL client

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookopedia",
  password: "Saransh@2003",
  port: 5432,
});
db.connect();

const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));

// Middleware setup

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
  next();
});

// Setting up EJS as the template engine

app.set("views", path.join(_dirname, "views"));
app.set("view engine", "ejs");

// Function to get the next available ID for a new book

async function getNextAvailableId() {
  const result = await db.query('SELECT id FROM books ORDER BY id');
  const ids = result.rows.map(row => row.id);

  for (let i = 1; i <= ids.length + 1; i++) {
    if (!ids.includes(i)) {
      return i;
    }
  }
  return 1;
}

// Route to handle the root path

app.get("/", async (req, res) => {
  try {

    // Check if the books table exits

    const existing = await db.query('SELECT * FROM books');
    let books = existing.rows;

    // If no books are found, fetch from Open Library API and insert into the database

    if (books.length === 0) {
      const searchResponse = await axios.get('https://openlibrary.org/search.json?q=the+lord+of+the+rings');
      const bookData = searchResponse.data.docs[0]; // pick the first result

      let id = 1;
      const title = bookData.title;
      const workKey = bookData.key;
      const authorName = bookData.author_name ? bookData.author_name[0] : "Unknown";
      const source = `https://openlibrary.org${workKey}`;

      id = await getNextAvailableId();

      // Insert the book into the database

      await db.query('INSERT INTO books (id, name, author, source) VALUES ($1, $2, $3, $4)', [
        id,
        title,
        authorName,
        source
      ]);

      // Fetch the books again after insertion

      const result = await db.query('SELECT * FROM books ORDER BY id ASC');
      books = result.rows;
    }

    // Render the index page with the book data

    res.render("index", { bookShelf: books, error: null });
  } catch (err) {
    console.error("Error:", err);
    res.render("index", { bookShelf: [], error: "Failed to fetch or store book data." });
  }
});

// Route to handle adding a new book

app.get("/add", (req, res) => {
  res.render("add");
});

// Route to handle the form submission for adding a new book

app.post("/add", async (req, res) => {
  const { name, author, source } = req.body;
  let id = await getNextAvailableId();
  try {
    await db.query('INSERT INTO books (id, name, author, source) VALUES ($1, $2, $3, $4)', [
      id,
      name,
      author,
      source
    ]);
    res.redirect("/");
  } catch (err) {
    console.error("Error adding book:", err);
    res.render("add", { error: "Failed to add book. Please try again." });
  }
});

// Route to handle deleting a book

app.delete('/delete/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    await db.query('DELETE FROM books WHERE id = $1', [bookId]);
    res.status(200).send("Deleted");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).send("Failed to delete");
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
