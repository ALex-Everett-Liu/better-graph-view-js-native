const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

let graphData = null;

app.post('/import-data', (req, res) => {
    graphData = req.body;
    res.json({ message: 'Data imported successfully' });
});

app.post('/related-chunks', (req, res) => {
    if (!graphData) {
        return res.status(400).json({ error: 'No graph data imported' });
    }

    const { chunk } = req.body;
    const relatedChunks = graphData
        .filter(edge => edge.source === chunk || edge.target === chunk)
        .map(edge => ({
            name: edge.source === chunk ? edge.target : edge.source,
            weight: edge.weight
        }));
    res.json(relatedChunks);
});

app.post('/search', (req, res) => {
    if (!graphData) {
        return res.status(400).json({ error: 'No graph data imported' });
    }

    const { keyword } = req.body;
    const results = new Set();
    graphData.forEach(edge => {
        if (edge.source.toLowerCase().includes(keyword.toLowerCase())) {
            results.add(edge.source);
        }
        if (edge.target.toLowerCase().includes(keyword.toLowerCase())) {
            results.add(edge.target);
        }
    });
    res.json(Array.from(results));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
