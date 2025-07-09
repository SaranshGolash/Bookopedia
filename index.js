import bodyParser from 'body-parser';
import express from 'express';
import axios from 'axios';
import pg from 'pg';

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/', async (req, res) => {
    try {
        const response = await axios.get('https://api.example.com/data');
        const result = response.data;
        res.render('index.ejs', { data: result });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.render('index.ejs', { data: null, error: 'Failed to fetch data' });
    }
});