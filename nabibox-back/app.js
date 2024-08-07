// app.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const app = express();

// multer 설정: 업로드된 파일이 저장될 디렉터리와 파일 이름 설정
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const user = req.params.user;
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
            const day = ('0' + currentDate.getDate()).slice(-2);
            const formattedDate = `${year}-${month}-${day}`;
            const userDir = path.join(process.env.UPLOAD_PATH, user, formattedDate);

            await fs.mkdir(userDir, { recursive: true });
            cb(null, userDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const originalname = path.basename(file.originalname, path.extname(file.originalname));
        const uniqueSuffix = originalname + '|:|' + Math.round(Math.random() * 900);
        const filename = uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// 재귀적으로 디렉토리 구조를 탐색하여 모든 파일 경로를 수집하는 함수
async function getDirectoryStructure(dir) {
    try {
        const subdirs = await readdir(dir);
        const files = await Promise.all(subdirs.map(async (subdir) => {
            const res = path.resolve(dir, subdir);
            const stats = await stat(res);
            if (stats.isDirectory()) {
                return {
                    type: 'directory',
                    name: subdir,
                    children: await getDirectoryStructure(res)
                };
            } else {
                return { type: 'file', name: subdir };
            }
        }));
        return files;
    } catch (error) {
        console.error(`Failed to read directory: ${dir}`, error);
        throw new Error('Failed to read directory');
    }
}

async function getFiles(dir) {
    try {
        // const subdirs = await readdir(dir);
        //     const files = await Promise.all(subdirs.map(async (subdir) => {
        //         // const res = path.resolve(dir, subdir);
        //         // const stats = await stat(res);
        //         // if (stats.isDirectory()) {
        //         //     return getFiles(res);
        //         // } else {
        //             return subdir;
        //         // }
        //     }));
        return dir;
    } catch (error) {
        console.error(`Failed to read directory: ${dir}`, error);
        throw new Error('Failed to read directory');
    }
}

app.get('/list/:user', async function (req, res) {
    const user = req.params.user;
    const userDir = path.join(process.env.UPLOAD_PATH, user);
    try {
        const directoryStructure = await getDirectoryStructure(userDir);
        res.json({
            status: 'success',
            data: directoryStructure
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

app.get('/all_list/:user', async function (req, res) {
    const user = req.params.user;
    const userDir = path.join(process.env.UPLOAD_PATH, user);
    try {
        const files = await getFiles(userDir);
        res.json({
            status: 'success',
            data: files
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

app.get('/test', function (req, res) {
    res.sendFile(path.join(__dirname, 'uploadForm.html'));
});

// 파일 업로드 처리
app.post('/upload/:user', upload.array('uploadFile'), function (req, res) {
    console.log(req.files);
    res.send('파일이 업로드되었습니다.');
});

app.get('/down/:user/*', async function (req, res) {
    const user = req.params.user;
    const filePath = path.join(process.env.UPLOAD_PATH || 'uploads', user, req.params[0]);

    try {
        const fileStat = await stat(filePath);

        if (fileStat.isFile()) {
            res.download(filePath, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('File download failed');
                }
            });
        } else {
            res.status(400).send('Not a valid file');
        }
    } catch (err) {
        console.error(err);
        res.status(404).send('File not found');
    }
});

// 3000 포트로 서버 오픈
app.listen(3000, async function () {
    console.log("start! express server on port 3000");

    try {
        await fs.mkdir(process.env.UPLOAD_PATH, { recursive: true });
        console.log("upload folder created");
    } catch (error) {
        console.error("Failed to create upload folder", error);
    }
});
