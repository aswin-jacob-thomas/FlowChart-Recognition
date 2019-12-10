const http = require('http');
const url = require('url');
const readline = require('readline');
const fs = require('fs');
const os = require('os');
const path = require('path');

function handleRequest(req, res) {
    const q = url.parse(req.url, true);
    let page;
    switch(q.pathname) {
        case '/':
            res.writeHead(200, {"Content-Type": "text/html"});
            page = fs.readFileSync('index.html');
            res.write(page);
            res.end();
            break;
        default:
            page = fs.existsSync('.' + q.pathname) ? fs.readFileSync('.' + q.pathname) : undefined;
            if (page === undefined) {
                res.writeHead(404);
                res.end();
                break;
            }
            if (path.extname(q.pathname) === '.js') {
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
            } else if (path.extname(q.pathname) === '.css') {
                res.writeHead(200, { 'Content-Type': 'text/css' });
            } else if (path.extname(q.pathname) === '.svg') {
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            } else {
                res.writeHead(200);
            }
            res.write(page);
            res.end();
            break;
    }
}

function createServer() {
    http.createServer(handleRequest).listen(3000, () => {
        console.log("Server started at localhost:3000");
        console.log("Terminate server with ctrl+c");
    });
}

createServer();
