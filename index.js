import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import pg from 'pg';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

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

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(_dirname, "views"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  try {
    // Check if any books exist
    const existing = await db.query('SELECT * FROM books');
    let books = existing.rows;

    if (books.length === 0) {
      // 1. Search for a book
      const searchResponse = await axios.get('https://openlibrary.org/search.json?q=the+lord+of+the+rings');
      const bookData = searchResponse.data.docs[0]; // pick the first result

      const title = bookData.title;
      const workKey = bookData.key;
      const authorName = bookData.author_name ? bookData.author_name[0] : "Unknown";
      const source = `https://openlibrary.org${workKey}`;

      // 2. Insert into DB
      await db.query('INSERT INTO books (name, author, source) VALUES ($1, $2, $3)', [
        title,
        authorName,
        source
      ]);

      // 3. Re-fetch updated data
      const result = await db.query('SELECT * FROM books ORDER BY id ASC');
      books = result.rows;
    }

    res.render("index", { bookShelf: books, error: null });
  } catch (err) {
    console.error("Error:", err);
    res.render("index", { bookShelf: [], error: "Failed to fetch or store book data." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
