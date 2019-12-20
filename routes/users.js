var express = require('express');
var router = express.Router();

// ユーザのサンプルデータ
var userList = [
  {
    id: "1",
    name: "Daisuke",
  },{
    id: "2",
    name: "Mitsuru",
  }
]

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  res.json(userList);
});

// POST
router.post('/', function (req, res) {
  res.json('POST ' + req.body.name + ' OK');
});

// PUT
router.put('/:id', function (req, res) {
  res.json('PUT '  + req.params.id + ' Change ' + req.body.name);
});

// DELETE
router.delete('/:id', function (req, res) {
  res.json('DELETE '  + req.params.id + ' OK');
});

module.exports = router;
