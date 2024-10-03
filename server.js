const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

let graphData = null;

function getRelatedChunks(startChunk, maxDepth = 3) {
    return new Promise((resolve) => {
        const related = new Map();
        const queue = [[startChunk, 0]];
        const visited = new Set();

        function processDepth(depth) {
            if (depth >= maxDepth || queue.length === 0) {
                resolve(related);
                return;
            }

            const newQueue = [];

            queue.forEach(([current, currentWeight]) => {
                if (current !== startChunk) {
                    related.set(current, Math.max(related.get(current) || 0, currentWeight));
                }

                graphData.forEach(edge => {
                    if (edge.source === current && !visited.has(edge.target)) {
                        newQueue.push([edge.target, edge.weight]);
                        visited.add(edge.target);
                    }
                });
            });

            queue.length = 0;
            queue.push(...newQueue);
            processDepth(depth + 1);
        }

        processDepth(0);
    });
}

function sortRelatedChunks(related) {
    return Array.from(related.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

app.post('/import-data', (req, res) => {
    graphData = req.body;
    res.json({ message: 'Data imported successfully' });
});

app.post('/related-chunks', async (req, res) => {
    if (!graphData) {
        return res.status(400).json({ error: 'No graph data imported' });
    }

    const { chunk, maxDepth } = req.body;
    const related = await getRelatedChunks(chunk, maxDepth);
    const sortedRelated = sortRelatedChunks(related);
    res.json(sortedRelated.map(([name, weight]) => ({ name, weight })));
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
