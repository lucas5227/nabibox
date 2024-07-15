// app.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const util = require('util');

const app = express();

// multer 설정: 업로드된 파일이 저장될 디렉터리와 파일 이름 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const user = req.params.user;
        const currentDate = new Date();
        const year = currentDate.getFullYear(); // 현재 연도
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // 현재 월 (0부터 시작하기 때문에 +1을 해줌)
        const day = ('0' + currentDate.getDate()).slice(-2); // 현재 일
        const formattedDate = `${year}-${month}-${day}`;
        const userDir = path.join(process.env.UPLOAD_PATH, user, formattedDate);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
        const originalname = path.basename(file.originalname, path.extname(file.originalname)); // 파일의 확장자를 제외한 원래 이름
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
            return {type: 'file', name: subdir};
        }
    }));
    return files;
}

app.get('/list/:user', async function(req, res) {
    const user = req.params.user;
    const userDir = path.join(process.env.UPLOAD_PATH, user);
    try {
        const directoryStructure = await getDirectoryStructure(userDir);

        res.json({
            status: 'success',
            data: directoryStructure
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to read directory'
        });
    }
});

app.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname, 'uploadForm.html'));
});

// 파일 업로드 처리
app.post('/upload/:user', upload.array('uploadFile'), function(req, res) {
    // upload.array('uploadFile')에서 'uploadFile'은 <input> 요소의 name 속성값입니다.
    // 업로드된 파일들은 req.files 배열에 저장됩니다.
    console.log(req.files);
    // 업로드된 파일 정보를 클라이언트로 응답할 수도 있습니다.
    res.send('파일이 업로드되었습니다.');
});



app.get('/down/:user/*', async function(req, res) {
    const user = req.params.user;
    console.log(req.params[0]);
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
app.listen(3000, function() {
    console.log("start! express server on port 3000");
    //    init 만약 업로드 폴더가 없으면 만든다.
    var hasUpload = fs.existsSync(process.env.UPLOAD_PATH); //디렉토리 경로 입력
    if (!hasUpload) {
        fs.mkdirSync(process.env.UPLOAD_PATH);
        console.log("upload folder maked");
    }
});
// 이제 터미널에 node app.js 를 입력해보자.
