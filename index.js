import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import pg from 'pg';
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const _dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true}));

app.set("views", path.join(_dirname, "views"));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://covers.openlibrary.org/b/id/12547191.json');
        const result = response.data;
        res.render('index', { data: result });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.render('index', { data: null, error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});