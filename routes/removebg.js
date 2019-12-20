var express = require('express');
var base64ToImage = require('base64-to-image');
var router = express.Router();

const upDir ='/Users/kosuke_matsuoka/Pictures/testfolder/'
const tmpDir = '/Users/kosuke_matsuoka/Pictures/testfolder/'
const bgDir = '/Users/kosuke_matsuoka/Pictures/testfolder/bg/'
// const tmpDir = '/Users/ban/Pictures/testfolder/'
// const upDir = '/Users/ban/Pictures/testfolder/'
// const bgDir = '/Users/ban/Pictures/testfolder/bg/'
const custumViewUrl ='-----------'

var request = require('request');
var fs = require('fs');
const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");

// File  Upload
var multer = require('multer');
var upload = multer({ dest: tmpDir });

const sharp = require('sharp');
const sizeOf = require('image-size')

// endpoint1: save the no-bg-image localy
router.post('/', upload.single('data'), async (req, res)=> {
    console.log('in test');
    const filename = 'output.png'
    // デッバグのため、アップしたファイルの名前を表示する
    console.log('start removebg');
    var optionalObj = {'fileName': 'bgTest', 'type':'png'};

    const img = await base64ToImage(req.body.data,upDir,optionalObj);
    console.log(img.fileName)
    setTimeout(function(){
        request.post({
            url: 'https://api.remove.bg/v1.0/removebg',
            formData: {
                //image_file: fs.createReadStream(req.files.path),
                image_file: fs.createReadStream(upDir + img.fileName),
                size: 'auto',
            },
            headers: {
                'X-Api-Key': ''
            },
            encoding: null
        }, function (error, response, body) {
            if (error)
                return console.error('Request failed:', error);
            if (response.statusCode != 200){
                console.error('Error:', response.statusCode, body.toString('utf8'));
                return res.status(response.statusCode).json({msg:'Error:'+ response.statusCode + body.toString('utf8')})
            }
            fs.writeFileSync(upDir + filename, body);
            console.log('pass')
            res.status(200).json({name: filename});
        });
    },3000);
});

// 背景特徴 endpoint
router.get('/selectbg/:filename', async function (req, res) {
    const predictionKey = "";
    const predictor = new PredictionAPIClient(predictionKey, custumViewUrl);
    //const testFile = fs.readFileSync(upDir+'save/'+req.params.filename);
    const testFile = fs.readFileSync(upDir + req.params.filename);
    const publishIterationName = "";
    const projectId = "";
    const results = await predictor.classifyImage(projectId, publishIterationName, testFile);

    console.log("Results:");
    if (results.predictions[0].probability < results.predictions[1].probability) {
        res.json({ tag : results.predictions[1].tagName });
    } else {
        res.json({ tag : results.predictions[0].tagName });
    }
});

// 画像編集 endpoint
router.post('/editimage/:filename', async function (req, res) {
    console.log(JSON.stringify(req.body))
    const idx =req.params.filename.indexOf('.png');
    const filename = req.params.filename.slice(0, idx)
    console.log(filename);
    
    console.log(req.body.data.tag)
    const number = (req.body.data.tag === 'front') ? (getRandomInt(5)+1).toString() : (getRandomInt(4)+6).toString()
    console.log(number);
    
    const bg_file = 'bg' + number+'.jpg'
    console.log('bg_file:' + bg_file);

    const dimensions = sizeOf(bgDir + bg_file);
    console.log(dimensions.width, dimensions.height);
    const left = number != 2 ? Math.ceil(dimensions.width*0.6) : 350;
    const top = number != 2 ? Math.ceil(dimensions.height*0.7) : 200;
    const resize_height = Math.ceil(dimensions.height*0.7);
    console.log('left:' + left);
    console.log('top:' + top);

    // 人物画サイズ変更
    console.log(req.body.data.grayscale);
    if(req.body.data.grayscale){
        await sharp(upDir + req.params.filename).resize(null,resize_height).grayscale().toFile(upDir+'save/'+req.params.filename)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.error(err);
        });
    } else {
        await sharp(upDir + req.params.filename).resize(null,resize_height).toFile(upDir+'save/'+req.params.filename)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.error(err);
        });
    }

    // 背景画像の合成
    if(req.body.data.grayscale){
        await sharp(bgDir + bg_file).composite([{
            input: upDir+'save/'+req.params.filename,
            // top: parseInt(req.body.top),
            // left: parseInt(req.body.left)
            top: top,
            left: left
        }]).grayscale().toFile(upDir+'save/'+filename +number+'-compositite-gray.png')
        .then(data =>{
            //console.log(data);
            console.log('save: '+upDir+'save/'+filename + number+'-compositite.png')
        })
        .catch(err => {
            console.error(err);
        });
        res.json({name: filename+number+'-compositite-gray.png'});
    } else {
        await sharp(bgDir + bg_file).composite([{
            input: upDir+'save/'+req.params.filename,
            // top: parseInt(req.body.top),
            // left: parseInt(req.body.left)
            top: top,
            left: left
        }]).toFile(upDir+'save/'+filename + number+'-compositite.png')
        .then(data =>{
            //console.log(data);
            console.log('save: '+upDir+'save/'+filename + number+'-compositite.png')
        })
        .catch(err => {
            console.error(err);
        });
        res.json({name: filename+number+'-compositite.png'});
    }
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

module.exports = router;